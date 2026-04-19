export class OfficeSegment {
    static count = 0;
    constructor(officeId, segmentNo, segmentArea) {
        this.id = ++OfficeSegment.count;
        this.officeId = officeId;
        this.segmentNo = segmentNo;
        this.segmentArea = segmentArea;
    }
}
