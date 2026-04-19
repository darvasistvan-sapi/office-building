import { Office } from "./Office.js";

export class CoworkingOffice extends Office {
    constructor(floor, officeNumber, segmentAreas, maxTenants, offers = []) {
        super(floor, officeNumber, segmentAreas, offers);
        if (typeof maxTenants !== 'number' || isNaN(maxTenants) || maxTenants < 1) {
            throw new Error('Hibás maxTenants érték: ' + maxTenants);
        }
        this.maxTenants = maxTenants;
    }
    
    getFreeArea(start, end) {
        let used = this.getActualOffers(start, end).length;
        return this.maxTenants - used;
    }
    
    isFullyOccupied(start, end) {
        return this.getFreeArea(start, end) == 0;
    }
}
