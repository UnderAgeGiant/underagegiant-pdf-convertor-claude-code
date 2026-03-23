# underagegiant-pdf-convertor-claude-code

A production-ready REST API for converting files between DOCX and PDF formats using LibreOffice. Built with Node.js, Express, and TypeScript. Supports local server and Vercel serverless deployment with Redis-backed rate limiting.

---

## Features

- Convert **DOCX → PDF** via REST endpoint
- Convert **PDF → DOCX** via REST endpoint
- **Redis-backed rate limiting** (10 requests / 15 min per IP)
- **Vercel-ready** — same codebase runs locally and as a serverless function
- **50MB** file size limit
- Structured logging with [pino](https://github.com/pinojs/pino)
- Full test suite with mocha, chai, and sinon (28 tests)

---

## Requirements

- **Node.js** >= 18
- **LibreOffice** installed and `soffice` available in `PATH`
- **Redis** instance (local or cloud)

### Install LibreOffice

| Platform | Command |
|----------|---------|
| Ubuntu/Debian | `sudo apt install libreoffice` |
| macOS | `brew install --cask libreoffice` |
| Windows | Download from [libreoffice.org](https://www.libreoffice.org/download/download/) |

---

## Getting Started

### Option A — Docker (recommended, no local LibreOffice or Redis needed)

```bash
docker compose up
```

Server runs at `http://localhost:3000`. Redis starts automatically and LibreOffice is bundled in the container.

---

### Option B — Manual setup

#### 1. Clone and install dependencies

```bash
git clone https://github.com/UnderAgeGiant/underagegiant-pdf-convertor-claude-code.git
cd underagegiant-pdf-convertor-claude-code
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=10
LOG_LEVEL=info
```

### 3. Start the dev server

```bash
npm run dev
```

Server runs at `http://localhost:3000`.

---

## API Reference

### `GET /health`

Returns server health status.

**Response `200`:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-22T20:00:00.000Z"
}
```

---

### `POST /api/convert/docx-to-pdf`

Converts a DOCX file to PDF.

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | `.docx` or `.doc` file (max 50MB) |

**Response `200`:** Binary PDF file with headers:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="document.pdf"
```

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | No file uploaded |
| `415` | File is not a DOCX/DOC |
| `413` | File exceeds 50MB limit |
| `429` | Rate limit exceeded |

---

### `POST /api/convert/pdf-to-docx`

Converts a PDF file to DOCX.

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | `.pdf` file (max 50MB) |

**Response `200`:** Binary DOCX file with headers:
```
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="document.docx"
```

**Error responses:**

| Status | Reason |
|--------|--------|
| `400` | No file uploaded |
| `415` | File is not a PDF |
| `413` | File exceeds 50MB limit |
| `429` | Rate limit exceeded |

---

## Rate Limiting

Endpoints are protected by a Redis-backed rate limiter:

- **Window:** 15 minutes
- **Max requests:** 10 per IP
- **Headers:** `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

Configure via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX` environment variables.

---

## Running Tests

```bash
NODE_ENV=test npm test
```

No Redis or LibreOffice required to run tests — all external dependencies are stubbed with sinon.

**28 tests across 4 suites:**

| Suite | Tests |
|-------|-------|
| `convert.service` | 9 |
| `convert.controller` | 7 |
| `error-handler` | 4 |
| `routes` (supertest) | 8 |

---

## Project Structure

```
├── api/
│   └── index.ts                  # Vercel serverless entry point
├── src/
│   ├── app.ts                    # Express app (shared)
│   ├── server.ts                 # Local server entry point
│   ├── config/
│   │   └── redis.ts              # ioredis client
│   ├── controllers/
│   │   └── convert.controller.ts
│   ├── middleware/
│   │   ├── error-handler.ts
│   │   ├── logger.ts
│   │   └── rate-limit.ts         # Redis-backed rate limiter
│   ├── routes/
│   │   └── convert.routes.ts
│   ├── services/
│   │   └── convert.service.ts    # libreoffice-convert wrapper
│   └── utils/
│       └── errors.ts
├── test/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── services/
├── postman/
│   └── underagegiant-pdf-convertor.postman_collection.json
├── .env.example
├── vercel.json
└── README.md
```

---

## Deploying to Vercel

1. Install the [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
2. Set environment variables in the Vercel dashboard:
   - `REDIS_URL` — use [Upstash Redis](https://upstash.com/) for serverless compatibility
   - `RATE_LIMIT_WINDOW_MS`
   - `RATE_LIMIT_MAX`
3. Deploy:
   ```bash
   vercel deploy
   ```

> **Note:** LibreOffice must be available in the runtime. For standard Vercel deployments use a [custom runtime](https://vercel.com/docs/runtimes) or a Docker-based approach (Vercel Pro). For serverless-compatible conversion without LibreOffice, consider using a dedicated conversion microservice.

---

## Postman Collection

Import `postman/underagegiant-pdf-convertor.postman_collection.json` into Postman and set the `baseUrl` variable to your server URL (default: `http://localhost:3000`).

---

## License

MIT
