# Irodaház-menedzsment – Architektúraterv / Rendszerterv

## 1. A rendszer fő funkciói:

- aktív bérleti szerződések és ajánlatok kezelése,
- árajánlat-generálás (klasszikus iroda + coworking),
- ajánlat státusz-életciklus kezelése,
- napi bevétel- és telítettség-kimutatás.

## 2. Magas szintű architektúra

A rendszer **réteges (layered), moduláris monolit** felépítést követ:

- **Prezentációs réteg**: web UI / API kliens a menedzser számára.
- **Alkalmazási réteg**: use-case szolgáltatások (árképzés, elfogadás, kimutatás).
- **Domain réteg**: üzleti szabályok és számítások (telítettség, zaj, kedvezmények).
- **Infrastruktúra réteg**: perzisztencia (adatbázis), időzített feladatok, naplózás.

Indoklás:

- az üzleti logika erősen szabályalapú, jól izolálható domain szolgáltatásokba,
- a számítások későbbi változásai minimális hatással legyenek UI/API rétegre,
- egyszerű üzemeltetés (egy deploy egység), mégis tiszta felelősség-szétválasztás.

## 3. Fő komponensek

### 3.1 Offer Management

Felelősség:

- ajánlat létrehozása `proposed` státusszal,
- státuszváltások kezelése (`proposed` → `reserved` / `rejected` / `contracted`),
- 1 hónapnál régebbi megválaszolatlan ajánlatok automatikus `rejected`-re állítása.

Kimenet:

- ajánlat rekord számított árral és részletes árösszetevőkkel.

### 3.2 Pricing Engine

Felelősség:

- iroda- és coworking ajánlat árkalkuláció,
- legolcsóbb érvényes ajánlat kiválasztása (emelet vagy teljes épület),
- meeting room és parkoló díj hozzáadása igény esetén.

Almodulok:

- `AreaAllocator` (négyzetméter szabályok + fizikai szeparáció),
- `OccupancyCalculator` (irodaház / meeting / parkoló telítettség),
- `NoiseCalculator` (folyosó-pozíció és sinus görbe),
- `DiscountCalculator` (szerződéshossz kedvezmény),
- `OfficePriceCalculator`, `CoworkingPriceCalculator`.

### 3.3 Contract Management

Felelősség:

- elfogadott ajánlat alapján foglalás/szerződés adatok mentése,
- aktív szerződések nyilvántartása,
- mutatók számára csak `contracted` rekordok biztosítása.

### 3.4 Reporting

Felelősség:

- napi bevételi tábla előállítása,
- napi és intervallumos irodaház telítettség számítás,
- lekérdezések API-n keresztüli kiszolgálása.

### 3.5 Scheduler / Background Jobs

Felelősség:

- ajánlat lejárat-ellenőrzés (1 hónap),
- opcionális előszámított napi aggregátumok frissítése.

## 4. Domain modell

## 4.1 Fő entitások

- **Building**: irodaház törzsadatok.
- **Floor**: emelet adatok.
- **Office**:
	- `id`, `floor_id`, `office_number`, `total_area_m2`,
- **OfficeSegment**:
	- `office_id`, `segment_no`, `segment_area_m2`.
- **CoworkingOffice**:
	- `id`, `floor_id`, `office_number`, `total_area_m2`, `max_tenants`.
- **Customer**: 
	- `id`, `name` (unique)
- **Offer**:
	- `id`, `customer_id`, `office_id`, `start_date`, `end_date`, 
	- `total_area_m2`,
    - `meeting_priority` = `none|low|medium|high`,
    - `parking_place_count`,
	- `total_price`,
	- `status` = `proposed|reserved|rejected|contracted`,
	- `created_at`, `answered_at`.
- **Contract**:
	- `id`, `offer_id`,
- **ParkingCapacityConfig**: egyetlen konfigurálható parkolókapacitás-változó (összes parkolóhely száma).
- **DailyMetrics** (opcionális): napi bevétel, telítettség cache.

## 4.2 Értékobjektumok

- **DateRange**: kezdő/záró dátum + napok száma.
- **Money**: pénznem + összeg (kerekítés szabályokkal).
- **PricingBreakdown**: alapár, szorzók, kedvezmény, extrák.

## 4.3 Állapotgép (Offer)

- Kezdő állapot: `proposed`.
- Tranzíciók:
	- `proposed -> reserved` (ügyfél elfogadja),
	- `proposed -> rejected` (ügyfél elutasítja vagy 1 hónapig nincs válasz),
	- `reserved -> contracted` (szerződés megkötve).
- Telítettség-számítás inputja: kizárólag `contracted` ajánlat/szerződés.

## 5. Alkalmazási folyamatok

### 5.1 Árajánlat létrehozás

1. Kérés fogadása (input validáció, beleértve a `customer_name` mezőt).
2. Ügyfél azonosítása név alapján (létező ügyfél használata vagy új ügyfél létrehozása).
3. Cél iroda-készlet meghatározása (emelet / teljes épület).
4. Minden jelölt irodára árkalkuláció (jogosultsági és kapacitás ellenőrzésekkel).
5. Legolcsóbb érvényes ajánlat kiválasztása.
6. `Offer` mentése `proposed` státusszal.
7. Válaszadás részletes `PricingBreakdown` adatokkal.

### 5.2 Ajánlat elfogadás / szerződés

1. Ügyfélválasz rögzítése.
2. Elfogadás esetén státusz `reserved`.
3. Menedzseri véglegesítéskor szerződés létrehozás + státusz `contracted`.
4. Telítettségi aggregátumok frissítése.

### 5.3 Lejáratkezelés

1. Napi scheduler futás.
2. `proposed` ajánlatok keresése, ahol `created_at + 30 nap < mai nap` és nincs válasz.
3. Státusz frissítés `rejected`-re.

### 5.4 Kimutatás készítés

1. Intervallum paraméterezése.
2. Napi bevétel számítása (`contracted` szerződések alapján).
3. Napi telítettség számítása.
4. Táblázatos válasz összeállítása.

## 6. API terv (v1)

### 6.1 Árajánlatok

- `POST /api/v1/offers/quote`
	- bemenet: `customer_name` + igényparaméterek
	- kimenet: legolcsóbb ajánlat + árösszetevők
- `POST /api/v1/offers/{offerId}/accept`
	- státusz: `reserved`
- `POST /api/v1/offers/{offerId}/reject`
	- státusz: `rejected`
- `POST /api/v1/offers/{offerId}/contract`
	- szerződésesítés + státusz: `contracted`

### 6.2 Kimutatás

- `GET /api/v1/reports/daily-revenue?from=YYYY-MM-DD&to=YYYY-MM-DD`
	- napi bevétel + napi telítettség.

### 6.3 Törzsadat

- `GET /api/v1/offices`
- `GET /api/v1/floors/{floorId}/offices`

## 7. Perzisztencia terv (relációs séma)

Javasolt fő táblák:

- `floors(id, floor_no)`
- `offices(id, floor_id, office_number, total_area_m2)`
- `coworking_offices(office_id, max_tenants)`
- `office_segments(id, office_id, segment_no, segment_area_m2)`
- `customers(id, name)`
- `offers(id, customer_id, office_id, start_date, end_date, requested_area_m2, allocated_area_m2, meeting_priority, parking_count, base_price, meeting_price, parking_price, total_price, status, created_at, answered_at)`
- `contracts(id, offer_id, contracted_at, total_price)`
- `daily_metrics(id, day, revenue, occupancy_ratio)`

Konfigurációban tárolt érték (nem relációs tábla):

- `PARKING_TOTAL_COUNT` (összes parkolóhely száma)

Kulcs indexek:

- `offers(status, created_at)` (lejáratkezeléshez),
- `offers(office_id, start_date, end_date)` (ütközésvizsgálathoz),
- `contracts(contracted_at)` és riport indexek `day` mezőn.

## 8. Számítási pontosság és technikai szabályok

- Pénz számítás decimal típussal történjen (lebegőpontos hiba kerülése).
- A százalékos szorzók és a parkoló kapacitás konfigurációból jöjjenek (`*_szorzó`, `*_alap_ár`).
- Dátumkezelés lokális időzónában, nap alapú elszámolással.
- Árösszegek kerekítése egységes szabály szerint (pl. 2 tizedes).

## 9. Nem funkcionális követelmények

- **Konzisztencia**: státuszváltás és szerződésesítés tranzakcióban történjen.
- **Auditálhatóság**: ajánlat státuszváltozások naplózása.
- **Skálázhatóság**: napi riportoknál előaggregáció támogatása.
- **Tesztelhetőség**: pricing modulok determinisztikus egységtesztekkel lefedve.

## 10. UR megfeleltetési összefoglaló

- Árajánlat és árképletek: UR-004..UR-010, UR-033..UR-040.
- Telítettség és kimutatás: UR-011..UR-012, UR-043..UR-044, UR-049.
- Terület, szeparáció, zaj: UR-015..UR-029.
- Státusz-életciklus és elfogadás: UR-045..UR-050.
