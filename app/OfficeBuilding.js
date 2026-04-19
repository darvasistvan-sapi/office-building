import { OfferStatus } from "./OfferStatus.js";
import { Offer } from "./Offer.js";
import { Customer } from "./Customer.js";
import { DailyMetrics } from "./DailyMetrics.js";
import { daysBetween, monthsBetween } from "./helpers.js";
import { CoworkingOffice } from "./CoworkingOffice.js";

export class OfficeBuilding {
    static count = 0;

    constructor(floors = [], parkingCount = 0, name = "",
        basePrice,
        occupancyMultiplier,
        noiseMultiplier,
        meetingRoomPrices,
        parkingPrice,
        coworkingBasePrice
    ) {
        this.id = ++OfficeBuilding.count;
        this.floors = floors;
        this.calculateOffices();
        this.calculateOffers();
        this.calculateCustomers();
        this.parkingCount = parkingCount;
        this.name = name;
        this.basePrice = basePrice;
        this.occupancyMultiplier = occupancyMultiplier;
        this.noiseMultiplier = noiseMultiplier;
        this.meetingRoomPrices = meetingRoomPrices;
        this.parkingPrice = parkingPrice;
        this.coworkingBasePrice = coworkingBasePrice;
    }

    calculateOffices() {
        this.offices = this.floors.flatMap(floor => floor.offices);
    }

    getOffices(floorNo = 0) {
        if (floorNo === 0) {
            return this.offices;
        }
        let floor = this.floors.find(f => f.floorNo === floorNo);
        return floor ? floor.offices : [];
    }

    calculateOffers() {
        this.offers = this.offices.flatMap(office => office.offers);
    }

    calculateCustomers() {
        const customers = new Set(this.offers.map(offer => offer.customer));
        this.customers = Array.from(customers);
    }

    getContractedOffers() {
        return this.offers.filter(offer => offer.status === OfferStatus.CONTRACTED);
    }

    getCustomer(name) {
        let customer = this.customers.find(customer => customer.name === name);
        if (!customer) {
            customer = new Customer(name);
            this.customers.push(customer);
        }
        return customer;
    }

    getOccupancy(start, end) {
        let totalArea = this.offices.reduce((sum, office) => sum + office.totalArea, 0);
        let occupied = this.offers.filter(offer => offer.isActual(start, end))
            .reduce((sum, offer) => sum + offer.allocatedArea, 0);
        return totalArea === 0 ? 0 : occupied / totalArea;
    }

    getContractLengthDiscount(months) {
        if (months < 6) return 0;
        if (months < 12) return 0.05;
        if (months < 18) return 0.1;
        return 0.15;
    }

    calculateOfferPrice({ area, meeting, parking, noise, occupancy, days, months, coworking = false }) {
        let occupancyFactor = 1 + this.occupancyMultiplier * occupancy;
        let lengthDiscount = 1 - this.getContractLengthDiscount(months);
        let noiseFactor = noise !== null ? 1 - this.noiseMultiplier * noise : 1;
        let meetingCost = this.meetingRoomPrices[meeting] * days;
        let parkingCost = this.parkingPrice * parking * days;

        if (coworking) {
            // coworking_alap_ár * napok_száma * (1 + irodaház_telitettség_szorzó * irodaház_telítettség) * (1 - szerződés_hossza_kedvezmény)
            return Math.round(
                this.coworkingBasePrice * days * occupancyFactor * lengthDiscount
                + meetingCost
                + parkingCost
            );
        }
        return Math.round(
            this.basePrice * area * days * occupancyFactor * lengthDiscount * noiseFactor
            + meetingCost
            + parkingCost
        );
    }

    getBestOffer({ floorNo = 0, area, start, end, meeting = 0, parking = 0, noise = 0, customerName, coworking = false }) {
        // Parameter validation
        if (coworking && area !== 1) {
            throw new Error('Hibás terület coworking esetén: ' + area);
        }
        if (!coworking && (typeof area !== 'number' || isNaN(area) || area < 5)) {
            throw new Error('Hibás terület: ' + area);
        }
        if (!(start instanceof Date) || isNaN(start)) {
            throw new Error('Hibás kezdő dátum: ' + start);
        }
        if (!(end instanceof Date) || isNaN(end) || end <= start) {
            throw new Error('Hibás záró dátum: ' + end);
        }
        if (typeof meeting !== 'string' || !this.meetingRoomPrices.hasOwnProperty(meeting)) {
            throw new Error('Hibás meeting prioritás: ' + meeting);
        }
        if (typeof parking !== 'number' || isNaN(parking) || parking < 0) {
            throw new Error('Hibás parkoló: ' + parking);
        }
        if (noise !== null && (typeof noise !== 'number' || isNaN(noise) || noise < 0 || noise > 1)) {
            throw new Error('Hibás zaj érték: ' + noise);
        }
        if (typeof customerName !== 'string' || customerName.trim() === '') {
            throw new Error('Hibás ügyfélnév: ' + customerName);
        }

        let bestOffice = null;
        let bestPrice = Infinity;
        let bestArea = area;
        const occupancy = this.getOccupancy(start, end);
        const days = daysBetween(start, end);
        const months = monthsBetween(start, end);

        // Coworking szűrés
        let offices = this.getOffices(floorNo);
        if (coworking) {
            offices = offices.filter(office => office instanceof CoworkingOffice);
        } else {
            offices = offices.filter(office => !(office instanceof CoworkingOffice));
        }

        for (let office of offices) {
            if (noise !== null && noise < office.getNoise()) continue; // zajszint nem megfelelő
            let free = office.getFreeArea(start, end);
            let allocArea = area;
            if (coworking) {
                if (free < 1) continue;
            }
            else {
                if (free < area) continue;
                if (free - area < 5 && free - area > 0) allocArea = free;
            }
            const price = this.calculateOfferPrice({ area: allocArea, meeting, parking, noise, occupancy, days, months, coworking });
            if (price < bestPrice) {
                bestOffice = office;
                bestPrice = price;
                bestArea = allocArea;
            }
        }
        if (!bestOffice) {
            return null;
        }

        let customer = this.getCustomer(customerName);
        const offer = new Offer(
            customer,
            bestOffice,
            new Date(start),
            new Date(end),
            area,
            bestArea,
            meeting,
            parking,
            bestPrice,
            OfferStatus.PROPOSED,
            new Date(),
            null
        );
        this.offers.push(offer);
        bestOffice.offers.push(offer);

        return offer;
    }

    acceptOffer(id) {
        const offer = this.offers.find(offer => offer.id === id);
        if (offer) {
            offer.accept();
            return true;
        }
        return false;
    }

    rejectOffer(id) {
        const offer = this.offers.find(offer => offer.id === id);
        if (offer) {
            offer.reject();
            return true;
        }
        return false;
    }
    
    getMetrics(date) {
        const occupancy = this.getOccupancy(date, date);
        // Napi bevétel
        const revenue = this.offers.filter(offer => offer.isActual(date, date))
            .reduce((sum, offer) => sum + offer.totalPrice / daysBetween(offer.startDate, offer.endDate), 0);
        return new DailyMetrics(date, occupancy, Math.round(revenue));
    }

    rejectOldOffers() {
        const now = new Date();
        let count = 0;
        this.offers.forEach(offer => {
            if (offer.status === OfferStatus.PROPOSED) {
                const created = new Date(offer.createdAt);
                if ((now - created) / (1000 * 60 * 60 * 24) > 30) {
                    offer.status = OfferStatus.REJECTED;
                    offer.answeredAt = now;
                    count++;
                }
            }
        });
        return count;
    }
}
