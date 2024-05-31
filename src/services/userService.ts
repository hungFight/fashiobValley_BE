import { v4 as keyV4 } from 'uuid';
import express from 'express';
import bcrypt from 'bcryptjs';

import Validation from '../actionsHandling/errors/Validation';
import Security from '../actionsHandling/Security';
import { getRedis } from '../connectDatabase/connect.Redis';
import ClassUser from '../CLasses/ClassUser';
import { prisma } from '..';
import Token from './TokensService/Token';
import { PropsRefreshToken } from './TokensService/RefreshTokenCookie';
// 0 exist, 200 success, 400 invalid, 300 expired, 403 Unauthorized, 404 not found
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
    ): Promise<{ status: 0 | 200 | 400 | 404 | 300; message: string }> {
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
                                    if (data) return resolve({ status: 200, message: 'Created successfully' });
                                    return resolve({ status: 0, message: 'Account existed!' });
                                }
                            });
                        } else return resolve({ status: 400, message: 'Invalid coded!' });
                    });
                } else return resolve({ status: 400, message: 'Invalid data!' });
            } else return resolve({ status: 300, message: 'Your time to create account is expired. Please try again!' });
        });
    }
    public login(res: express.Response, IP_USER: string, IP_MAC: string, userAgent: string, password: string, account: string): Promise<{ status: number; message: string }> {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await ClassUser.findByAccount(account, { id: true, account: true, password: true });
                if (user) {
                    const key = keyV4();
                    if (Validation.validUUID(key)) {
                        const secretKey = Security.hash(key);
                        const JwtId = Security.hash(key);
                        if (!secretKey || !JwtId) return resolve({ status: 404, message: 'secretKey ore JwtId is invalid' });
                        const checkP = bcrypt.compareSync(password, user.password);
                        if (checkP) {
                            const accessToken = Token.accessTokenF({ id: user.id }, secretKey, JwtId);
                            const refreshToken = Token.refreshTokenF({ id: user.id }, secretKey, JwtId);
                            if (accessToken && refreshToken) {
                                res.cookie('tks', 'Bearer ' + accessToken, {
                                    path: '/',
                                    secure: false, // Set to true if you're using HTTPS
                                    sameSite: 'strict', // Options: 'lax', 'strict', 'none'
                                    expires: new Date(new Date().getTime() + 30 * 86409000), // 30 days
                                    signed: true, // Sign the cookie
                                });
                                res.cookie('k_user', user.id, {
                                    path: '/',
                                    secure: false, // Set to true if you're using HTTPS
                                    sameSite: 'strict', // Options: 'lax', 'strict', 'none'
                                    expires: new Date(new Date().getTime() + 30 * 86409000), // 30 days
                                    signed: true, // Sign the cookie
                                });
                                getRedis().get(user.id + '_refreshToken', (err, data) => {
                                    console.log(data, 'IN AuthService');
                                    if (err) reject(err);
                                    if (data && JSON.parse(data)?.length) {
                                        const newDa: PropsRefreshToken[] = JSON.parse(data);
                                        const foundDa = newDa.find((p) => p.mac === IP_MAC);
                                        if (!foundDa) {
                                            newDa.push({
                                                refreshToken: refreshToken + '@_@' + secretKey,
                                                accept: false,
                                                mac: IP_MAC,
                                                userId: user.id,
                                                status: [{ name: 'login', dateTime: new Date(), ip: IP_USER }],
                                                userAgent,
                                            });
                                        } else if (['logout', 'invalid'].includes(foundDa.status[foundDa.status.length - 1].name) && foundDa.accept) {
                                            newDa.map((p) => {
                                                if (p.mac === foundDa.mac) {
                                                    p.status.push({ name: 'login', dateTime: new Date(), ip: IP_USER });
                                                    p.userAgent = userAgent;
                                                    p.refreshToken = refreshToken + '@_@' + secretKey;
                                                }
                                                return p;
                                            });
                                        }
                                        console.log(newDa, 'newDa', newDa[0].status);
                                        getRedis().set(user.id + '_refreshToken', JSON.stringify(newDa), (err: any, res: any) => {
                                            if (err) {
                                                console.log('Error setting refreshToken', err);
                                                reject(err);
                                            }
                                            getRedis().expire(user.id + '_refreshToken', 60 * 60, (err) => {
                                                if (err) reject(err);
                                                resolve({ status: 200, message: 'Login successful' });
                                            }); // 1h
                                        });
                                    } else {
                                        getRedis().set(
                                            user.id + '_refreshToken',
                                            JSON.stringify([
                                                {
                                                    refreshToken: refreshToken + '@_@' + secretKey,
                                                    accept: true,
                                                    mac: IP_MAC,
                                                    userId: user.id,
                                                    status: [{ name: 'login', dateTime: new Date(), ip: IP_USER }],
                                                    userAgent,
                                                },
                                            ]),
                                            (err: any) => {
                                                if (err) {
                                                    console.log('Error setting refreshToken', err);
                                                    reject(err);
                                                }
                                                getRedis().expire(user.id + '_refreshToken', 60 * 60, (err) => {
                                                    if (err) reject(err);
                                                    resolve({ status: 200, message: 'Login successful' });
                                                });
                                            },
                                        );
                                    }
                                });
                            } else resolve({ status: 404, message: 'AccessToken or RefreshToken is empty!' });
                        } else resolve({ status: 300, message: 'Account or password is invalid!' });
                    }
                } else resolve({ status: 300, message: 'Account or password is invalid!' });
            } catch (err) {
                reject(err);
            }
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
            try {
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
            } catch (error) {
                reject(error);
            }
        });
    }
}
export default new UserService();
