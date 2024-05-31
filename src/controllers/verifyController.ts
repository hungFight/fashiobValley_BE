import twilio from 'twilio';
import bcrypt from 'bcryptjs';
import express from 'express';
import getMAC, { isMAC } from 'getmac';
import { v4 as keyV4 } from 'uuid';
import { getRedis } from '../connectDatabase/connect.Redis';
import Security from '../actionsHandling/Security';
import NotFound from '../actionsHandling/errors/NotFound';
import Validation from '../actionsHandling/errors/Validation';
import nodemailer from 'nodemailer';
import Invalid from '../actionsHandling/errors/Invalid';
import ServerError from '../actionsHandling/errors/ServerError';

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
                    const date = new Date();
                    return client.messages
                        .create({ body: `FashionValley. Here is your code: ${otp} and expired in 1 minute`, from: TWILIO_PHONE_NUMBER, to: phoneCode })
                        .then((data) => {
                            getRedis().set(key, JSON.stringify({ key: otpHashed, createdAt: date }), (err) => {
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
                                res.cookie('asdf_', JSON.stringify({ phoneEmail: phoneCode, id: codeId, createdAt: date }), {
                                    path: '/',
                                    secure: false, // Set to true if you're using HTTPS
                                    sameSite: 'strict', // Options: 'lax', 'strict', 'none'
                                    expires: new Date(new Date().getTime() + 32 * 60 * 1000), // 32m
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
    public sendMAIL = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const oldStore = req.cookies.asdf_;
            const oldData: { phoneEmail: string; id: string } = oldStore ? JSON.parse(oldStore) : oldStore;
            const MAILER_USER = process.env.MAILER_USER;
            const MAILER_PASSWORD = process.env.MAILER_PASSWORD;
            const mailCode = req.body.value;
            const codeId = keyV4();
            const macIP = getMAC();
            if (!Validation.validEmail(mailCode) || !Validation.validUUID(codeId) || !isMAC(macIP)) throw new NotFound('sendMAIL', 'Empty or Invalid!');
            const otp = String(Math.floor(Math.random() * (999999 - 100000) + 100000));
            if (otp && MAILER_USER && MAILER_PASSWORD) {
                const otpHashed = Security.hash(otp);
                const key = `OTP_${mailCode}_${codeId}_${macIP}`;
                console.log(key, macIP);
                const date = new Date();
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: MAILER_USER,
                        pass: MAILER_PASSWORD,
                    },
                });
                const mailOptions = {
                    from: MAILER_USER,
                    to: mailCode,
                    subject: `FashionValley code: ${otp} and expired in 1 minute`,
                    text: `FashionValley. Here is your code: ${otp} and expired in 1 minute`,
                };
                return transporter.sendMail(mailOptions, function (error: any, info: { response: string }) {
                    if (error) {
                        throw new ServerError('error', error);
                    } else {
                        return getRedis().set(key, JSON.stringify({ key: otpHashed, createdAt: date }), (err) => {
                            if (err) {
                                console.error('Redis set error:', err);
                                return res.status(500).json({ error: 'Redis set error', details: err });
                            }
                            getRedis().expire(key, 120, (expireErr) => {
                                if (expireErr) {
                                    console.error('Redis expire error:', expireErr);
                                    return res.status(500).json({ error: 'Redis expire error', details: expireErr });
                                }
                            });
                            res.cookie('asdf_', JSON.stringify({ phoneEmail: mailCode, id: codeId, createdAt: date }), {
                                path: '/',
                                secure: false, // Set to true if you're using HTTPS
                                sameSite: 'strict', // Options: 'lax', 'strict', 'none'
                                expires: new Date(new Date().getTime() + 2 * 60 * 1000), // 32m
                            });
                            if (oldData) {
                                const oldKey = `OTP_${oldData.phoneEmail}_${oldData.id}_${macIP}`;
                                getRedis().del(oldKey);
                            }
                            return res.status(200).json({ phoneEmail: mailCode, id: codeId });
                        });
                    }
                });
            }
            throw new ServerError('error', 'ENVIRONMENT IS EMPTY');
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
            if (
                (!Validation.validPhoneNumber(phoneEmail) && !Validation.validEmail(phoneEmail)) ||
                (!Validation.validOTP(code) && status !== 'checkValid') ||
                !Validation.validUUID(id) ||
                !isMAC(macIP)
            )
                throw new NotFound('verifyOTP', 'Empty or Invalid!');
            const key = `OTP_${phoneEmail}_${id}_${macIP}`;
            getRedis().get(key, (err, data) => {
                if (err) throw new NotFound('verifyOTP', 'Code is empty!', err);
                if (data) {
                    const newData = JSON.parse(data);
                    if (status === 'checkValid') {
                        if (newData.key === code) return res.status(200).json(true);
                        res.clearCookie('asdf_', { path: '/' });
                        return res.status(200).json(false);
                    } else {
                        const checkOTP = bcrypt.compareSync(code, newData.key);
                        if (checkOTP) {
                            const uniqueCode = keyV4();
                            if (Validation.validUUID(uniqueCode)) {
                                getRedis().set(key, JSON.stringify({ key: uniqueCode, createdAt: new Date() }), (err) => {
                                    if (err) return new NotFound('verifyOTP', 'set failed!', err);

                                    getRedis().expire(key, 30 * 60, (err) => {
                                        if (err) return new NotFound('verifyOTP', 'set expiration failed!', err);
                                    });
                                });
                                res.cookie('asdf_', JSON.stringify({ phoneEmail: phoneEmail, id: id, createdAt: new Date(), key: uniqueCode }), {
                                    path: '/',
                                    secure: false, // Set to true if you're using HTTPS
                                    sameSite: 'strict', // Options: 'lax', 'strict', 'none'
                                    expires: new Date(new Date().getTime() + 28 * 60 * 1000), // 32m
                                });
                                return res.status(200).json(uniqueCode);
                            }
                        }
                        return res.status(200).json(false);
                    }
                }
                return res.status(200).json(null);
            });
        } catch (error) {
            next(error);
        }
    };
}
export default new VerifyController();
