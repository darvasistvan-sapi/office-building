import { OfficeSegment } from "./OfficeSegment.js";

export class Office {
    static count = 0;

    constructor(floor, officeNumber, segmentAreas, offers = []) {
        this.id = ++Office.count;
        this.floor = floor;
        this.officeNumber = officeNumber;
        this.segments = segmentAreas.map((area, i) => new OfficeSegment(this.id, i + 1, area));
        this.calculateTotalArea();
        this.offers = offers;
    }

    calculateTotalArea() {
        this.totalArea = this.segments.reduce((sum, segment) => sum + segment.segmentArea, 0);
    }

    getActualOffers(start, end) {
        return this.offers.filter(offer => offer.isActual(start, end));
    }

    getFreeArea(start, end) {
        let used = this.getActualOffers(start, end).reduce((sum, offer) => sum + offer.allocatedArea, 0);
        return this.totalArea - used;
    }

    getNoise() {
        const floorOfficeCount = this.floor.offices.length;
        let officeIndex = this.floor.offices.indexOf(this) + 1;
        let corridorPos;
        if (officeIndex <= floorOfficeCount / 2) {
            corridorPos = officeIndex;
        } else {
            corridorPos = floorOfficeCount - officeIndex + 1;
        }
        
        return Math.sin(Math.PI * (corridorPos - 0.5) / (floorOfficeCount / 2 + 0.5));
    }
}
