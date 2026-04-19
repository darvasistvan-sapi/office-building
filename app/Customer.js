export class Customer {
    static count = 0;
    
    constructor(name) {
        this.id = ++Customer.count;
        this.name = name;
    }
}
