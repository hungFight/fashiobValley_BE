import twilio from 'twilio';
import express from 'express';
import { getRedis } from '../connectDatabase/connect.Redis';
import Security from '../actionsHandling/Security';
class VerifyController {
    public sendSMS = (req: express.Request, res: express.Response) => {
        const TWILIO_SID = process.env.TWILIO_SID;
        console.log(TWILIO_SID, 'TWILIO_SID', req.body);
        const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
        const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
        const phoneCode = req.body.value;
        if (TWILIO_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER && phoneCode) {
            const otp = String(Math.floor(Math.random() * (999999 - 100000) + 100000));
            if (otp) {
                const otpHashed = Security.hash(otp);
                const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
                const key = `OTP_${phoneCode}`;
                return client.messages
                    .create({ body: 'FashionValley. Here is your code: 5522', from: TWILIO_PHONE_NUMBER, to: '+' + phoneCode })
                    .then((data) => {
                        getRedis().set(key, otpHashed, () => {
                            getRedis().expire(key, 70);
                        });
                        return res.status(200).json(data);
                    })
                    .catch((err) => res.status(500).json(err));
            }
        }
        return res.status(500).json('ENVIRONMENT IS EMPTY');
    };
}
export default new VerifyController();
