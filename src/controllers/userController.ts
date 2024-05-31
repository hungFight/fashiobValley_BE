import express from 'express';
import userService from '../services/userService';
import Validation from '../actionsHandling/errors/Validation';
import NotFound from '../actionsHandling/errors/NotFound';
import getMAC, { isMAC } from 'getmac';

class UserController {
    public register = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const account = req.body.account;
            const userName = req.body.userName;
            const password = req.body.password;
            const code = req.body.code;
            const subPassword = req.body.subPassword;
            const macIP = getMAC();
            const validAc = req.cookies.asdf_;
            if (
                (Validation.validPhoneNumber(account) || Validation.validEmail(account)) &&
                Validation.validUUID(code) &&
                userName &&
                password &&
                isMAC(macIP) &&
                Validation.validLength(password, 6, 50) &&
                Validation.validLength(userName, 6, 50)
            ) {
                const data = await userService.register(res, code, userName, password, account, validAc ? JSON.parse(validAc) : validAc, macIP, subPassword);
                return res.status(200).json(data);
            }
            throw new NotFound('Register', 'Invalid');
        } catch (error) {
            next(error);
        }
    };
    public resetPassword = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const account = req.body.account;
            const code = req.body.code;
            const password = req.body.password;
            const validAc = req.cookies.asdf_;
            const macIP = getMAC();
            const subPass = req.body.subPass;
            if ((Validation.validPhoneNumber(account) || Validation.validEmail(account)) && password && isMAC(macIP) && Validation.validLength(password, 6, 50)) {
                const data = await userService.resetPassword(res, code, password, account, validAc ? JSON.parse(validAc) : validAc, macIP, subPass);
                return res.status(200).json(data);
            }
            throw new NotFound('Register', 'Invalid');
        } catch (error) {
            next(error);
        }
    };
}
export default new UserController();
