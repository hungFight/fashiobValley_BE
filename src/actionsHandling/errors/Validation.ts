class Validation extends Error {
    public validEmail(email: string): boolean {
        return /^\w+([\\.-]?\w+)*@\w+([\\.-]?\w+)*(\.\w{2,5})+$/.test(email);
    }
    public validLength(value: string, start: number, end: number): boolean {
        return value.length >= start && value.length <= end;
    }
    public validOTP(value: string): boolean {
        return value.length === 6;
    }
    public validPhoneNumber(value: string): boolean {
        const phoneNumberRegex = /^(\+?\d{1,3})?[-.\s]?(\(?\d{1,4}\)?)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
        return phoneNumberRegex.test(value);
    }
    public validUUID(value: string | string[]): boolean {
        const uuidPattern: RegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
        if (typeof value === 'string') {
            return uuidPattern.test(value);
        } else {
            let check = true;
            value.map((v) => {
                if (!uuidPattern.test(v)) check = false;
            });
            return check;
        }
    }
}
export default new Validation();
