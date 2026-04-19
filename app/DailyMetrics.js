// Napi metrikák osztály
export class DailyMetrics {
    static count = 0;

    constructor(date, occupancy, revenue) {
        this.id = ++DailyMetrics.count;
        this.date = date; // ISO string vagy Date
        this.occupancy = occupancy; // 0..1
        this.revenue = revenue; // Ft
    }
}
