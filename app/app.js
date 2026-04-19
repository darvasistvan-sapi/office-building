import { MEETING_ROOM_PRICES, BASE_PRICE, COWORKING_OFFICE_BASE_PRICE, OCCUPANCY_MULTIPLIER, NOISE_MULTIPLIER, PARKING_PRICE } from "./config.js";
import { OfficeBuilding } from "./OfficeBuilding.js";
import { Floor } from "./Floor.js";
import { Office } from "./Office.js";
import { CoworkingOffice } from "./CoworkingOffice.js";

// Dummy adatok
const floor1 = new Floor(1, [
    new Office(null, '101', [20]),
    new Office(null, '102', [15]),
    new CoworkingOffice(null, '103', [15], 5),
]);
for (const office of floor1.offices) {
    office.floor = floor1; // Kapcsolat beállítása
}
const floor2 = new Floor(2, [
    new Office(null, '201', [25]),
    new Office(null, '202', [30]),
]);
for (const office of floor2.offices) {
    office.floor = floor2; // Kapcsolat beállítása
}
const floors = [floor1, floor2];

let officeBuilding = new OfficeBuilding(
    floors,
    10,
    "Fő Irodaház",
    BASE_PRICE,
    OCCUPANCY_MULTIPLIER,
    NOISE_MULTIPLIER,
    MEETING_ROOM_PRICES,
    PARKING_PRICE,
    COWORKING_OFFICE_BASE_PRICE
);

function renderContracts() {
    const contractedOffers = officeBuilding.getContractedOffers();
    if (contractedOffers.length === 0) {
        document.getElementById('contracts').innerHTML = '<i>Nincs aktív szerződés.</i>';
        return;
    }
    document.getElementById('contracts').innerHTML = `
        <table>
            <tr><th>Iroda</th><th>Ügyfél</th><th>Terület</th><th>Időszak</th><th>Ár</th></tr>
            ${contractedOffers.map(offer => `<tr>
                <td>${offer.office.officeNumber}</td>
                <td>${offer.customer.name}</td>
                <td>${offer.allocatedArea} m²</td>
                <td>${offer.startDate.toISOString().split('T')[0]} - ${offer.endDate.toISOString().split('T')[0]}</td>
                <td>${offer.totalPrice} Ft</td>
            </tr>`).join('')}
        </table>
    `;
}

function renderMetrics(date = null) {
    let selectedDate = date;
    if (!selectedDate) {
        const input = document.getElementById('metrics-date');
        if (input && input.value) {
            selectedDate = new Date(input.value);
        } else {
            selectedDate = new Date();
        }
    }
    const metrics = officeBuilding.getMetrics(selectedDate);
    document.getElementById('metrics').innerHTML = `
        <b>Dátum:</b> ${metrics.date.toISOString().split('T')[0]}<br>
        <b>Telítettség:</b> ${(metrics.occupancy * 100).toFixed(1)}%<br>
        <b>Napi bevétel:</b> ${metrics.revenue} Ft
    `;
}

function handleOfferForm(e) {
    e.preventDefault();

    try {
        const formData = new FormData(e.target);
        const coworking = formData.get('coworking') === 'on';
        let area = Math.max(5, parseFloat(formData.get('area')));
        if (coworking) area = 1;
        const start = new Date(formData.get('start'));
        const end = new Date(formData.get('end'));
        const floorNo = parseInt(formData.get('floor'));
        let noise = null;
        if (document.getElementById('noiseEnable').checked) {
            const noiseVal = formData.get('noise');
            noise = noiseVal !== null && noiseVal !== "" ? parseFloat(noiseVal) : null;
        }
        const meeting = formData.get('meeting');
        const parking = parseInt(formData.get('parking'));
        const customerName = formData.get('customer');

        let bestOffer = officeBuilding.getBestOffer({ floorNo: floorNo, area, start, end, meeting, parking, noise, customerName, coworking });
        if (!bestOffer) {
            document.getElementById('offerResult').innerHTML = '<b>Nincs megfelelő szabad iroda.</b>';
            return;
        }
        document.getElementById('offerResult').innerHTML = `
            <b>Ajánlat létrejött!</b><br>
            Iroda: ${bestOffer.office.officeNumber} (${bestOffer.office.totalArea} m²)<br>
            ${coworking ? '' : `Lefoglalt terület: ${bestOffer.allocatedArea} m²<br>`}
            Ár: ${bestOffer.totalPrice} Ft<br>
            <button onclick="acceptOffer(${bestOffer.id})">Elfogadom</button>
            <button onclick="rejectOffer(${bestOffer.id})">Elutasítom</button>
        `;
    } catch (err) {
        document.getElementById('offerResult').innerHTML = `<span style="color: red;"><b>Hiba:</b> ${err.message}</span>`;
    }
}

function renderApp() {
    // A HTML-t már az index.html tartalmazza, csak az eseménykezelőket kell beállítani
    document.getElementById('offerForm').onsubmit = handleOfferForm;
    // Noise checkbox logic
    const noiseEnable = document.getElementById('noiseEnable');
    const noiseInput = document.getElementById('noise');
    function updateNoiseInput() {
        if (noiseEnable.checked) {
            noiseInput.disabled = false;
        } else {
            noiseInput.disabled = true;
            noiseInput.value = "";
        }
    }
    noiseEnable.addEventListener('change', updateNoiseInput);
    updateNoiseInput();

    renderContracts();
    renderMetrics();

    // Coworking checkbox logika
    const coworkingCheckbox = document.getElementById('coworking');
    const areaInput = document.getElementById('area');
    function updateCoworkingInput() {
        if (coworkingCheckbox.checked) {
            areaInput.disabled = true;
            areaInput.value = 1;
        } else {
            areaInput.disabled = false;
            areaInput.value = 10;
        }
    }
    coworkingCheckbox.addEventListener('change', updateCoworkingInput);
    updateCoworkingInput();

    // Kimutatás gomb eseménykezelő
    const metricsBtn = document.getElementById('metrics-btn');
    if (metricsBtn) {
        metricsBtn.onclick = () => {
            const dateInput = document.getElementById('metrics-date');
            if (dateInput && dateInput.value) {
                renderMetrics(new Date(dateInput.value));
            }
        };
    }
}

// Automatikus ajánlat elutasítás (1 hónapnál régebbi, meg nem válaszolt)
setInterval(() => {
    officeBuilding.rejectOldOffers();
    renderContracts();
}, 10000); // 10 másodpercenként ellenőriz

window.acceptOffer = function(id) {
    if (officeBuilding.acceptOffer(id)) {
        renderContracts();
        document.getElementById('offerResult').innerHTML = '<b>Ajánlat elfogadva, szerződés létrejött.</b>';
    } else {
        document.getElementById('offerResult').innerHTML = '<b>Hiba történt az ajánlat elfogadásakor.</b>';
    }
};

window.rejectOffer = function(id) {
    if (officeBuilding.rejectOffer(id)) {
        renderContracts();
        document.getElementById('offerResult').innerHTML = '<b>Ajánlat elutasítva.</b>';
    } else {
        document.getElementById('offerResult').innerHTML = '<b>Hiba történt az ajánlat elutasításakor.</b>';
    }
};

renderApp();
