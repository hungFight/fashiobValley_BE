import twilio from 'twilio';
import bcrypt from 'bcryptjs';
import express from 'express';
import getMAC, { isMAC } from 'getmac';
import { v4 as keyV4 } from 'uuid';
import { getRedis } from '../connectDatabase/connect.Redis';
import Security from '../actionsHandling/Security';
import NotFound from '../actionsHandling/errors/NotFound';
import Validation from '../actionsHandling/errors/Validation';
class VerifyController {
    public sendSMS = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
            const TWILIO_SID = process.env.TWILIO_SID;
            const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
            const phoneCode = '+' + req.body.value;
            const codeId = keyV4();
            const macIP = getMAC();

            if (!Validation.validPhoneNumber(phoneCode) || !Validation.validUUID(codeId) || !isMAC(macIP)) throw new NotFound('sendSMS', 'Empty or Invalid!');
            if (TWILIO_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER && phoneCode) {
                const otp = String(Math.floor(Math.random() * (999999 - 100000) + 100000));
                if (otp) {
                    const otpHashed = Security.hash(otp);
                    const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
                    const key = `OTP_${phoneCode}_${codeId}_${macIP}`;
                    console.log(key, macIP);

                    return client.messages
                        .create({ body: `FashionValley. Here is your code: ${otp}`, from: TWILIO_PHONE_NUMBER, to: phoneCode })
                        .then((data) => {
                            getRedis().set(key, otpHashed, (err) => {
                                if (err) {
                                    console.error('Redis set error:', err);
                                    return res.status(500).json({ error: 'Redis set error', details: err });
                                }
                                getRedis().expire(key, 70, (expireErr) => {
                                    if (expireErr) {
                                        console.error('Redis expire error:', expireErr);
                                        return res.status(500).json({ error: 'Redis expire error', details: expireErr });
                                    }
                                });
                                res.cookie('asdf_', JSON.stringify({ phoneEmail: phoneCode, id: codeId }), {
                                    path: '/',
                                    secure: false, // Set to true if you're using HTTPS
                                    sameSite: 'strict', // Options: 'lax', 'strict', 'none'
                                    expires: new Date(new Date().getTime() + 32 * 60 * 1000), // 1m
                                });
                                return res.status(200).json({ phoneEmail: phoneCode, id: codeId });
                            });
                        })
                        .catch((err) => res.status(500).json(err));
                }
            }
            return res.status(500).json('ENVIRONMENT IS EMPTY');
        } catch (error) {
            next(error);
        }
    };
    public verifyOTP = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const phoneEmail = req.body.phoneEmail;
            const id = req.body.id;
            const code = req.body.code;
            const macIP = getMAC();
            const status: 'checkValid' | undefined = req.body.status;
            if (!Validation.validPhoneNumber(phoneEmail) || (!Validation.validOTP(code) && status !== 'checkValid') || !Validation.validUUID(id) || !isMAC(macIP))
                throw new NotFound('verifyOTPBySMS', 'Empty or Invalid!');
            const key = `OTP_${phoneEmail}_${id}_${macIP}`;
            getRedis().get(key, (err, data) => {
                if (err) throw new NotFound('verifyOTP', 'Code is empty!', err);
                if (data) {
                    if (status === 'checkValid') {
                        if (data === code) return res.status(200).json(true);
                        throw new NotFound('verifyOTP', 'Invalid code!', err);
                    } else {
                        const checkOTP = bcrypt.compareSync(code, data);
                        if (checkOTP) {
                            const uniqueCode = keyV4();
                            if (Validation.validUUID(uniqueCode)) {
                                getRedis().set(key, uniqueCode, (err) => {
                                    if (err) throw new NotFound('verifyOTP', 'set failed!', err);
                                    getRedis().expire(key, 30 * 60, (err) => {
                                        if (err) throw new NotFound('verifyOTP', 'set expiration failed!', err);
                                    });
                                });
                                return res.status(200).json(uniqueCode);
                            }
                        }
                    }
                    return res.status(404).json('Invalid!');
                }
                return res.status(404).json('Empty!');
            });
        } catch (error) {
            next(error);
        }
    };
}
export default new VerifyController();
