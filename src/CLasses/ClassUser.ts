import { prisma } from '..';
import Security from '../actionsHandling/Security';
interface PropsSelectUser {
    id: boolean;
    account?: boolean;
    password?: boolean;
    extraPassword?: boolean;
}
class ClassUser {
    public findByAccount = (account: string, select: PropsSelectUser) => prisma.users.findFirst({ where: { account }, select });
    public create = async (keyId: string, userName: string, account: string, password: string, subPassword?: string) => {
        const checkUser = await this.findByAccount(account, { id: true });
        if (!checkUser) {
            const pass = Security.hash(password);
            const subPass = subPassword ? Security.hash(subPassword) : null;
            const data = await prisma.users.create({ data: { id: keyId, fullName: userName, account, password: pass, extraPassword: subPass }, select: { id: true } });
            return data;
        }
        return null;
    };
    public changeOne = async (account: string, value: string, name: 'password' | 'extraPassword') => {
        const checkUser = await this.findByAccount(account, { id: true });
        if (checkUser) {
            const data = await prisma.users.update({ where: { id: checkUser.id }, data: { [name]: value }, select: { id: true } });
            return data;
        }
        return null;
    };
}
export default new ClassUser();
