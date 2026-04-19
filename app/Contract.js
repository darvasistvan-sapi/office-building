export class Contract {
    static count = 0;
    
    constructor(offer, contractedAt) {
        this.id = ++Contract.count;
        this.offer = offer;
        this.contractedAt = contractedAt;
    }
}
