import twilio from 'twilio';
import bcrypt from 'bcryptjs';
import express from 'express';
import { getRedis } from '../connectDatabase/connect.Redis';
import Security from '../actionsHandling/Security';
import NotFound from '../actionsHandling/errors/NotFound';
class VerifyController {
    public sendSMS = (req: express.Request, res: express.Response) => {
        const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
        const TWILIO_SID = process.env.TWILIO_SID;
        const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
        const phoneCode = '+' + req.body.value;
        if (!phoneCode) throw new NotFound('sendSMS', 'Empty!');
        if (TWILIO_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER && phoneCode) {
            const otp = String(Math.floor(Math.random() * (999999 - 100000) + 100000));
            if (otp) {
                const otpHashed = Security.hash(otp);
                const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
                const key = `OTP_${phoneCode}`;
                return client.messages
                    .create({ body: `FashionValley. Here is your code: ${otp}`, from: TWILIO_PHONE_NUMBER, to: phoneCode })
                    .then((data) => {
                        return getRedis().set(key, otpHashed, (err) => {
                            if (err) {
                                console.error('Redis set error:', err);
                                return res.status(500).json({ error: 'Redis set error', details: err });
                            }
                            return getRedis().expire(key, 70, (expireErr) => {
                                if (expireErr) {
                                    console.error('Redis expire error:', expireErr);
                                    return res.status(500).json({ error: 'Redis expire error', details: expireErr });
                                }
                                return res.status(200).json(data);
                            });
                        });
                    })
                    .catch((err) => res.status(500).json(err));
            }
        }
        return res.status(500).json('ENVIRONMENT IS EMPTY');
    };
    public verifyOTPBySMS = (req: express.Request, res: express.Response) => {
        const phoneCode = '+' + req.body.phone;
        const code = '+' + req.body.code;
        if (!phoneCode || !code) throw new NotFound('verifyOTPBySMS', 'Empty!');
        const key = `OTP_${phoneCode}`;
        return getRedis().get(key, (err, data) => {
            if (!data || err) throw new NotFound('verifyOTPBySMS', 'Code is empty!');
            const checkOTP = bcrypt.compareSync(code, data);
            if (checkOTP) {
                getRedis().del(key, (err) => {
                    if (err) throw new NotFound('verifyOTPBySMS', 'Deleted failed!');
                });
                res.cookie('asdf_', phoneCode, {
                    path: '/',
                    secure: false, // Set to true if you're using HTTPS
                    sameSite: 'strict', // Options: 'lax', 'strict', 'none'
                    expires: new Date(new Date().getTime() + 30 * 86409000), // 30 days
                    signed: true, // Sign the cookie
                });
                return res.status(200).json(phoneCode);
            }
            throw new NotFound('verifyOTPBySMS', 'Invalid!');
        });
    };
}
export default new VerifyController();
