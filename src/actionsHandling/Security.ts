import bcrypt from 'bcryptjs';
const hash = bcrypt.genSaltSync(10);

class Security {
    hash(data: string) {
        return bcrypt.hashSync(data, hash);
    }
}
export default new Security();
