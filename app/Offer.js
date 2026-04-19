import { Contract } from "./Contract.js";
import { OfferStatus } from "./OfferStatus.js";

export class Offer {
    static count = 0;

    constructor(customer, office, startDate, endDate, requestedArea, allocatedArea, meetingPriority, parkingCount, totalPrice, status, createdAt, answeredAt) {
        this.id = ++Offer.count;
        this.customer = customer;
        this.office = office;
        this.startDate = startDate;
        this.endDate = endDate;
        this.requestedArea = requestedArea;
        this.allocatedArea = allocatedArea;
        this.meetingPriority = meetingPriority;
        this.parkingCount = parkingCount;
        this.totalPrice = totalPrice;
        this.status = status;
        this.createdAt = createdAt;
        this.answeredAt = answeredAt;
        this.contract = null;
    }

    isActual(start, end) {
        return this.status === OfferStatus.CONTRACTED && new Date(this.endDate) >= new Date(start) && new Date(this.startDate) <= new Date(end);
    }

    accept() {
        this.status = OfferStatus.CONTRACTED;
        this.answeredAt = new Date();
        this.contract = new Contract(this, new Date());
    }

    reject() {
        this.status = OfferStatus.REJECTED;
        this.answeredAt = new Date();
    }
}
