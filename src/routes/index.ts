import { Express } from 'express';
import verifyController from '../controllers/verifyController';
import verifyRouter from './verifyRoute';
import errorHandler from '../actionsHandling/errorHandles';

export default function router(app: Express) {
    app.use('/api/v1/verify', verifyRouter);
}
