# Irodaház-menedzsment – Test Plan

## 2. Terjedelem (Scope)

### 2.1 In scope

- UR-001..UR-046 funkcionális követelmények.
- Ajánlatkérés bemenetek validációja (`customer_name`, dátumok, m2, emelet, prioritások, parkoló).
- Standard iroda és coworking ajánlatok kezelése.
- Meeting room és parkoló árképzés.
- Zaj konfliktus és szerződés-hossz kedvezmény.
- Kimutatás és telítettségi számítás.
- Scheduler alapú lejáratkezelés.

### 2.2 Out of scope

- UI kinézet, UX finomhangolás.
- Infrastrukturális teljesítményteszt nagy terhelés alatt (külön performance körben tesztelendő).
- Külső integrációk (ha még nincsenek implementálva).

## 3. Tesztstratégia

### 3.1 Tesztszintek

- **Unit tesztek**: árképletek, szorzók, validációk, allokációs szabályok.
- **Integrációs tesztek**: API + adatbázis + domain logika együtt.
- **E2E / API workflow tesztek**: ajánlatkérés -> státuszváltások -> szerződés -> riport.

### 3.2 Teszttípusok

- Pozitív tesztek (happy path).
- Negatív tesztek (hibás input, kapacitáslimit, szabálysértés).
- Határérték tesztek (minimum 5 m2, kedvezmény sávhatárok, időintervallumok).
- Regressziós tesztek (módosítás után kritikus üzleti folyamatok újrafuttatása).

## 4. Tesztkörnyezet

- **Alkalmazás**: teszt konfigurációval indított backend API.
- **Adatbázis**: izolált tesztadatbázis (minden futás előtt reset).
- **Időkezelés**: állítható tesztidő (lejáratkezelés validálásához).
- **Konfiguráció**:
	- `PARKING_TOTAL_COUNT` tesztelhető értékekkel (pl. 10, 1, 0),
	- ár-szorzók és alapárak fixált tesztértékekkel.

## 5. Tesztadatok

### 5.1 Alap adatkészlet

- 2-3 emelet, emeletenként több iroda.
- Vegyes irodaméretek (pl. 5, 7, 10, 30, 100 m2).
- Legalább 1 coworking iroda `max_tenants` értékkel.
- Irodák, ahol fizikai szeparáció szükséges (`office_segments`).
- Több ügyfél (külön névvel) és előre létrehozott ajánlat/szerződés állapotok.

### 5.2 Riport / telítettség adatok

- Több napra elosztott `contracted` és nem `contracted` ajánlatok.
- Külön napokon eltérő parkoló- és meeting room használat.

## 6. Belépési és kilépési kritériumok

### 6.1 Belépési kritériumok

- Tesztkörnyezet és tesztadatok elkészítve.
- API endpointok elérhetők.

### 6.2 Kilépési kritériumok

- Kritikus tesztesetek 100%-a sikeres.
- Magas prioritású hibák száma 0.
- Közepes prioritású hibákra dokumentált workaround vagy javítási terv van.
- UR lefedettség legalább 95%.

## 7. Tesztesetek (magas szint)

## 7.1 Árajánlatkérés és validáció

- **TC-001**: Érvényes ajánlatkérés `customer_name` mezővel -> `proposed` ajánlat létrejön.
- **TC-002**: Hiányzó `customer_name` -> validációs hiba.
- **TC-003**: `igényelt_négyzetméter < 5` -> validációs hiba.
- **TC-004**: `start_date > end_date` -> validációs hiba.
- **TC-005**: Emelet = 0 -> teljes épületből választás történik.
- **TC-006**: Érvényes ajánlatkérés esetén az `Offer` rekord csak a legolcsóbb ajánlat kiszámítása után jön létre – a kalkuláció közben nem keletkezik közbülső rekord.

## 7.2 Legolcsóbb ajánlat kiválasztás

- **TC-007**: Azonos bemenetre több alkalmas iroda esetén a legolcsóbb ajánlat kerül kiválasztásra.
- **TC-008**: Megadott emelet esetén csak az adott emelet irodái számítanak.

## 7.3 Négyzetméter allokáció és szeparáció

- **TC-009**: Pontos egyezésnél allokált terület = igényelt terület.
- **TC-010**: Ha a maradék terület < 5 m2, hozzáadódik az ajánlathoz.
- **TC-011**: Fizikai szeparáció szabály sérülése esetén ajánlat ne jöjjön létre.

## 7.4 Árképletek

- **TC-012**: Standard iroda árképlet helyes alkalmazása fix tesztadatokra.
- **TC-013**: Coworking árképlet helyes alkalmazása.
- **TC-014**: Meeting room ár hozzáadása prioritás szerint (`low/medium/high`).
- **TC-015**: Parkoló ár hozzáadása `parking_count` szerint.
- **TC-016**: Zaj konfliktus függvény helyes értéket ad szélső/közép irodaszámokra.
- **TC-017**: Szerződés-hossz kedvezmény sávhatárok helyesek (6/12/18 hónap).

## 7.5 Coworking kapacitás

- **TC-018**: `max_tenants` alatt új coworking ajánlat létrejön.
- **TC-019**: `max_tenants` elérése után új coworking ajánlat elutasítva.

## 7.6 Státusz-életciklus

- **TC-020**: Új ajánlat státusza `proposed`.
- **TC-021**: Ügyfél elfogadás -> `reserved`.
- **TC-022**: Ügyfél elutasítás -> `rejected`.
- **TC-023**: Szerződésesítés -> `contracted`.
- **TC-024**: 30 napnál régebbi, meg nem válaszolt ajánlat -> `rejected` (scheduler).

## 7.7 Kimutatás és telítettség

- **TC-025**: Napi bevétel riport csak `contracted` tételekből számol.
- **TC-026**: Napi telítettség képlet helyes eredményt ad kontroll adatokra.
- **TC-027**: Intervallum telítettség = napi telítettségek átlaga.

## 7.8 Konfiguráció

- **TC-028**: `PARKING_TOTAL_COUNT` módosítása hat a parkoló telítettség és ár eredményére.
- **TC-029**: Ár-szorzók konfigurációs változásait a kalkuláció azonnal követi.

## 8. UR lefedettségi mátrix (összefoglaló)

- **Általános + ajánlatkérés**: UR-001..UR-010, UR-046 -> TC-001..TC-008
- **Telítettség + terület**: UR-011..UR-018 -> TC-009..TC-011, TC-025..TC-027
- **Kedvezmények + zaj**: UR-019..UR-026 -> TC-016..TC-017
- **Szeparáció + coworking**: UR-027..UR-031 -> TC-011, TC-018..TC-019
- **Meeting + parkoló**: UR-032..UR-037 -> TC-014..TC-015, TC-028..TC-029
- **Kimutatás + státuszok**: UR-038..UR-045 -> TC-020..TC-027

## 9. Hibakezelés és riportálás

- Hibajegy kötelező mezők: reprodukciós lépések, környezet, input adatok, várt/tényleges eredmény.
- Prioritás szintek: Critical / High / Medium / Low.
- Napi tesztstátusz riport: futott tesztek, pass/fail arány, blokkerek.

## 10. Kockázatok és mitigáció

- **Kockázat**: komplex árképlet-eltérések.
	- **Mitigáció**: referencia-kalkulációk és fix expected értékek.
- **Kockázat**: dátum- és státuszhibák scheduler körül.
	- **Mitigáció**: időutazásos integrációs tesztek.
- **Kockázat**: regresszió gyakori szabálymódosítás után.
	- **Mitigáció**: automatizált regressziós csomag (TC-001, 007, 012, 020, 025, 028).

## 11. Deliverable-ek

- Részletes teszteset lista (tesztmenedzsment rendszerben).
- Automata teszt futtatási riportok.
- Hibajegy lista prioritással.
- Test Summary Report (végső kiadás előtt).
