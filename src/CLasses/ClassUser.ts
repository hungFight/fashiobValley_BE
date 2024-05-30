import { prisma } from '..';
import Security from '../actionsHandling/Security';

class ClassUser {
    public create = async (keyId: string, userName: string, account: string, password: string, subPassword?: string) => {
        const checkUser = await prisma.users.findFirst({ where: { account } });
        if (!checkUser) {
            const pass = Security.hash(password);
            const subPass = subPassword ? Security.hash(subPassword) : null;
            const data = await prisma.users.create({ data: { id: keyId, fullName: userName, account, password: pass, extraPassword: subPass }, select: { id: true } });
            return data;
        }
        return null;
    };
}
export default new ClassUser();
