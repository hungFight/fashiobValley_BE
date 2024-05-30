import { Express } from 'express';
import verifyRouter from './verifyRoute';
import userRouter from './userRoute';

export default function router(app: Express) {
    app.use('/api/v1/verify', verifyRouter);
    app.use('/api/v1/user', userRouter);
}
