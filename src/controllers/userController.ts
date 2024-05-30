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
            const subPassword = req.body.subPassword;
            const macIP = getMAC();
            const validAc = req.cookies.asdf_;
            if ((Validation.validPhoneNumber(account) || Validation.validEmail(account)) && userName && password && isMAC(macIP)) {
                const data = await userService.register(res, userName, password, account, validAc ? JSON.parse(validAc) : validAc, macIP, subPassword);
                return res.status(200).json(data);
            }
            throw new NotFound('Register', 'Invalid');
        } catch (error) {
            next(error);
        }
    };
}
export default new UserController();
