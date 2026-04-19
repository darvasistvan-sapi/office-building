export class Floor {
    static count = 0;

    constructor(floorNo, offices = []) {
        this.id = ++Floor.count;
        this.floorNo = floorNo;
        this.offices = offices.sort((a, b) => a.id - b.id);
    }
}
