import { v4 as keyV4 } from 'uuid';
import express from 'express';
import Validation from '../actionsHandling/errors/Validation';
import Security from '../actionsHandling/Security';
import { getRedis } from '../connectDatabase/connect.Redis';
import ClassUser from '../CLasses/ClassUser';
import { prisma } from '..';
// 0 exist, 1 success, 2 invalid, 3 expired
class UserService {
    public register(
        res: express.Response,
        code: String,
        userName: string,
        password: string,
        account: string,
        validAc: {
            phoneEmail: string;
            id: string;
        },
        macIP: string,
        subPassword?: string,
    ): Promise<{ status: 0 | 1 | 2 | 3; message: string }> {
        return new Promise(async (resolve, reject) => {
            const keyId = keyV4();
            console.log(Validation.validUUID(keyId), validAc?.phoneEmail === account, Validation.validLength(userName, 6, 50), validAc?.phoneEmail);
            if (validAc) {
                if (Validation.validUUID(keyId) && validAc?.phoneEmail === account && Validation.validLength(userName, 6, 50)) {
                    const key = `OTP_${account}_${validAc.id}_${macIP}`;
                    console.log(key, 'key');
                    getRedis().get(key, (err, data) => {
                        if (err) reject(err);
                        if (data === code) {
                            return getRedis().del(key, async (err, data) => {
                                if (err) reject(err);
                                if (data) {
                                    res.clearCookie('asdf_', { path: '/' });
                                    const data = await ClassUser.create(keyId, userName, account, password, subPassword);
                                    if (data) return resolve({ status: 1, message: 'Created successfully' });
                                    return resolve({ status: 0, message: 'Account existed!' });
                                }
                            });
                        } else return resolve({ status: 2, message: 'Invalid coded!' });
                    });
                } else return resolve({ status: 2, message: 'Invalid data!' });
            } else return resolve({ status: 3, message: 'Your time to create account is expired. Please try again!' });
        });
    }
    public resetPassword(
        res: express.Response,
        code: String,
        password: string,
        account: string,
        validAc: {
            phoneEmail: string;
            id: string;
        },
        macIP: string,
        subPass: boolean,
    ): Promise<{ status: 0 | 1 | 2 | 3; message: string }> {
        return new Promise(async (resolve, reject) => {
            console.log(validAc?.phoneEmail === account, validAc?.phoneEmail);
            if (validAc) {
                if (validAc?.phoneEmail === account) {
                    const key = `OTP_${account}_${validAc.id}_${macIP}`;
                    console.log(key, 'key');
                    getRedis().get(key, (err, dataFE) => {
                        if (err) reject(err);
                        if (dataFE) {
                            const data = JSON.parse(dataFE);
                            if (data?.key === code) {
                                return getRedis().del(key, async (err, data) => {
                                    if (err) reject(err);
                                    if (data) {
                                        res.clearCookie('asdf_', { path: '/' });
                                        const pass = Security.hash(password);
                                        const data = await ClassUser.changeOne(account, pass, subPass ? 'extraPassword' : 'password');
                                        if (data) return resolve({ status: 1, message: 'Update successfully' });
                                        return resolve({ status: 0, message: 'Update failed!' });
                                    }
                                });
                            }
                        } else return resolve({ status: 2, message: 'Invalid code!' });
                    });
                } else return resolve({ status: 2, message: 'Invalid data!' });
            } else return resolve({ status: 3, message: 'Your time to update account is expired. Please try again!' });
        });
    }
}
export default new UserService();
