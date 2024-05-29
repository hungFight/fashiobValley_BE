import express from 'express';
import verifyController from '../../controllers/verifyController';
import errorHandler from '../../actionsHandling/errorHandles';

const verifyRouter = express.Router();
verifyRouter.post('/sendSMS', verifyController.sendSMS);
verifyRouter.post('/OTP', verifyController.verifyOTP);
export default verifyRouter;
