# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (hot reload)
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start

# Run all tests (no Redis or LibreOffice required)
NODE_ENV=test npm test

# Docker (recommended for local dev — includes Redis)
docker compose up
```

## Architecture

This is a Node.js/Express REST API that converts files between DOCX and PDF formats using LibreOffice under the hood. Files are processed entirely in memory (no disk I/O).

**Request flow:** `routes/convert.routes.ts` → rate limiter → multer (memory storage, 50MB limit) → `controllers/convert.controller.ts` → `services/convert.service.ts` (LibreOffice via `libreoffice-convert`) → binary response

**Dual entry points:**
- `src/server.ts` — local HTTP server
- `api/index.ts` — Vercel serverless export

**Rate limiting** (`src/middleware/rate-limit.ts`): Redis-backed by default (10 req/15min per IP), automatically falls back to in-memory store when `NODE_ENV=test`.

**Error handling** (`src/utils/errors.ts` + `src/middleware/error-handler.ts`): Custom error hierarchy — `AppError` (base) → `ValidationError` (400) / `UnsupportedMediaError` (415). All unhandled errors go through the global error handler, which hides stack traces in production.

**Testing** (`test/`): Mocha + Chai + Sinon + Supertest. Tests stub LibreOffice and Redis via sinon — no external services needed. Run with `NODE_ENV=test` to activate in-memory rate limiter.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `NODE_ENV` | `development` | `development` / `production` / `test` |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | `10` | Max requests per window |
| `LOG_LEVEL` | `info` | Pino log level |

Copy `.env.example` to `.env` for local setup.

## API Endpoints

- `GET /health` — Server status
- `POST /api/convert/docx-to-pdf` — Accepts `multipart/form-data` with field `file` (DOCX/DOC), returns PDF
- `POST /api/convert/pdf-to-docx` — Accepts `multipart/form-data` with field `file` (PDF), returns DOCX

## Key Implementation Notes

- LibreOffice (`libreoffice-convert`) is required at runtime — the Docker image installs it via apt. Tests stub it out with sinon.
- The `libreoffice-convert` promisify call is done lazily inside the service functions (not at module load time) specifically to allow sinon to stub it in tests.
- Vercel deployment requires Upstash Redis (standard Redis won't work serverless). A custom Vercel runtime with LibreOffice is also needed.
