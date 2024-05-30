import { v4 as keyV4 } from 'uuid';
import express from 'express';
import Validation from '../actionsHandling/errors/Validation';
import Security from '../actionsHandling/Security';
import { getRedis } from '../connectDatabase/connect.Redis';
import ClassUser from '../CLasses/ClassUser';
// 0 exist, 1 success, 2 invalid, 3 expired
class UserService {
    public register(
        res: express.Response,
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
            console.log(Validation.validUUID(keyId), validAc?.phoneEmail === account, Validation.validUserName(userName, 6, 50), validAc?.phoneEmail);
            if (validAc) {
                if (Validation.validUUID(keyId) && validAc?.phoneEmail === account && Validation.validUserName(userName, 6, 50)) {
                    const key = `OTP_${account}_${validAc.id}_${macIP}`;
                    console.log(key, 'key');

                    return getRedis().del(key, async (err, data) => {
                        if (err) reject(err);
                        if (data) {
                            res.clearCookie('asdf_', { path: '/' });
                            const data = await ClassUser.create(keyId, userName, account, password, subPassword);
                            console.log(data, 'data');

                            if (data) return resolve({ status: 1, message: 'Created successfully' });
                            return resolve({ status: 0, message: 'User existed!' });
                        }
                    });
                } else return resolve({ status: 2, message: 'Invalid data!' });
            } else return resolve({ status: 3, message: 'Your time to create account is expired' });
        });
    }
}
export default new UserService();
