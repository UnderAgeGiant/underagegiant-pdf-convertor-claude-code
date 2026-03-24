import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/error-handler';
import convertRoutes from './routes/convert.routes';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors());
app.use(compression() as express.RequestHandler);
app.use(requestLogger);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/convert', convertRoutes);

app.use(errorHandler);

export default app;
