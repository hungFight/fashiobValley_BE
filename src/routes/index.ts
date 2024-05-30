import { Express } from 'express';
import verifyRouter from './verifyRoute';

export default function router(app: Express) {
    app.use('/api/v1/verify', verifyRouter);
    app.use('/api/v1/user', verifyRouter);
}
