class Invalid extends Error {
    private status: number = 0;
    private errorAny: any;
    constructor(name?: string, message?: string, errorAny?: any) {
        super();
        this.status = 400;
        if (name && message) {
            this.message = message;
            this.name = name;
        }
        this.errorAny = errorAny;
    }
}
export default Invalid;
