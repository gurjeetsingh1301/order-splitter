import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { responseTimeMiddleware } from './middleware/responseTime.js';
import router from './routes/index.js';

const app = express();

app.use(express.json());
app.use(responseTimeMiddleware);
app.use('/api/v1', router);
app.use(errorHandler);

export default app;
