import express from 'express';
import verifyController from '../../controllers/verifyController';

const verifyRouter = express.Router();
verifyRouter.post('/sendSMS', verifyController.sendSMS);
export default verifyRouter;
