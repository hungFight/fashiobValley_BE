import { v4 as keyV4 } from 'uuid';
import { prisma } from '..';
import Validation from '../actionsHandling/errors/Validation';
import Security from '../actionsHandling/Security';
import { getRedis } from '../connectDatabase/connect.Redis';
import ClassUser from '../CLasses/ClassUser';
class UserService {
    public register(
        userName: string,
        password: string,
        account: string,
        validAc: {
            phoneEmail: string;
            id: string;
        },
        macIP: string,
        subPassword?: string,
    ): Promise<{ status: 0 | 1 | 2; message: string }> {
        return new Promise(async (resolve, reject) => {
            const keyId = keyV4();
            if (Validation.validUUID(keyId) && validAc.phoneEmail === account && Validation.validUserName(userName, 6, 50)) {
                const key = `OTP_${account}_${validAc.id}_${macIP}`;
                getRedis().del(key, async (err, data) => {
                    if (err) reject(err);
                    if (data) {
                        const data = await ClassUser.create(keyId, userName, account, password, subPassword);
                        if (data && data.id === keyId) return resolve({ status: 1, message: 'Created successfully' });
                        return resolve({ status: 0, message: 'User existed!' });
                    }
                });
            }
            return resolve({ status: 2, message: 'Invalid data!' });
        });
    }
}
export default new UserService();
