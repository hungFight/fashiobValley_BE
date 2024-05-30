import express from 'express';
import verifyController from '../controllers/verifyController';

const verifyRouter = express.Router();
verifyRouter.post('/sendSMS', verifyController.sendSMS);
verifyRouter.post('/sendEmail', verifyController.sendMAIL);
verifyRouter.post('/OTP', verifyController.verifyOTP);
export default verifyRouter;
