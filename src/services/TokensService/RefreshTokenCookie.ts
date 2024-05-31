import Token from './Token';
import jwt from 'jsonwebtoken';
import { v4 as keyV4 } from 'uuid';
import token from './Token';
import express from 'express';
import getMAC, { isMAC } from 'getmac';
import { Redis } from 'ioredis';
import { getRedis } from '../../connectDatabase/connect.Redis';
import Security from '../../actionsHandling/Security';
import Invalid from '../../actionsHandling/errors/Invalid';
export interface PropsRefreshToken {
    refreshToken: string;
    accept: boolean;
    mac: string;
    userId: string;
    status: { name: 'login' | 'logout' | 'invalid'; dateTime: Date | string; ip: string }[];
    userAgent: string;
}
class RefreshTokenCookie {
    refreshToken = async (req: express.Request, res: any, next: express.NextFunction) => {
        try {
            const userId = req.cookies.k_user,
                accessToken = req.signedCookies.tks,
                IP_MAC = getMAC(),
                IP_USER = req.connection.remoteAddress ?? req.ip;
            if (!IP_MAC || !isMAC(IP_MAC)) return res.status(403).json({ status: 0, message: "You're IP_m is empty!" });
            const warning = JSON.stringify({
                id: 0,
                message: 'There was an person trying to login to your Account!',
            });
            getRedis().get(userId + 'refreshToken', (err, data) => {
                if (err) {
                    return res.status(500).json('Error getting refresh token: ' + err);
                }
                if (data) {
                    const newData: PropsRefreshToken[] = JSON.parse(data);
                    console.log(newData, 'newDataD');
                    const newDataFiltered = newData.filter((g) => g.userId === userId && g.mac === IP_MAC);
                    if (newDataFiltered.length) {
                        console.log(newData, 'newData - newData');
                        const de = newDataFiltered[0];
                        const my = de.refreshToken.split('@_@');
                        const [refreshToken, code] = my;
                        if (!refreshToken || !userId || !accessToken || !code) {
                            // token.deleteToken(res, userId, IP_MAC, IP_USER);
                            return res.status(403).json({ status: 0, message: "You're not Authenticated" });
                        }
                        jwt.verify(refreshToken, code, async (err: any, user: any) => {
                            // {id:string; iat: number; exp: number}
                            if (err || userId !== user.id || user.iss !== process.env.REACT_URL || user.aud !== process.env.REACT_URL) {
                                // token.deleteToken(res, userId, IP_MAC, IP_USER);
                                return res.status(401).json({ status: 8888, message: 'Unauthorized' });
                            }
                            delete user.iat;
                            const key = keyV4();
                            const secretKey = Security.hash(key);
                            const JwtId = Security.hash(key);
                            if (!secretKey || !JwtId) return new Invalid('RefreshToken', 'secretKey ore JwtId is invalid');
                            const newAccessToken = Token.accessTokenF({ id: user.id }, secretKey, JwtId);
                            const newRefreshToken = Token.refreshTokenF({ id: user.id }, secretKey, JwtId);
                            getRedis().set(
                                userId + 'refreshToken',
                                JSON.stringify(
                                    newData.map((re) => {
                                        if (re.refreshToken === refreshToken + '@_@' + code && re.userId === user.id && re.mac === IP_MAC && re.accept) {
                                            re.refreshToken = newRefreshToken + '@_@' + secretKey;
                                        }
                                        return re;
                                    }),
                                ),
                                (err, apply) => {
                                    if (err || !apply) {
                                        console.log('Error setting and expire refreshToken');
                                        return res.status(404).json('Can not set refreshToken in redis');
                                    }
                                    res.cookie('tks', 'Bearer ' + newAccessToken, {
                                        path: '/',
                                        secure: false, // Set to true if you're using HTTPS
                                        sameSite: 'strict', // Options: 'lax', 'strict', 'none'
                                        expires: new Date(new Date().getTime() + 30 * 86409000), // 30 days
                                        signed: true, // Sign the cookie
                                    });
                                    getRedis().expire(userId + 'refreshToken', 15 * 24 * 60 * 60); // 15days
                                    return res.status(200).json('Bearer ' + newAccessToken);
                                },
                            );
                        });
                    } else {
                        // token.deleteToken(res, userId, IP_MAC, IP_USER);
                        return res.status(401).json({ status: 0, message: 'Unauthorized' });
                    }
                } else {
                    // Token.deleteToken(res, userId, IP_MAC, IP_USER);
                    return res.status(404).json({ status: 0, message: 'Expired refresh token' });
                }
            });
        } catch (error) {
            next(error);
        }
    };
}
export default new RefreshTokenCookie();
