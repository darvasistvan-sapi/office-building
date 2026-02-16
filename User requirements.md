## Árajánlat-generálás

- **UR-001**: A létrehozott árajánlat egy létező irodaszámra hivatkozik.
- **UR-002**: A rendszerben ugyanahhoz az irodához több, különböző vevőhöz tartozó bérlés is rögzíthető.
- **UR-003**: A rendszer egy iroda árajánlatát az alábbi képlettel számolja:

`alap_ár * négyzetméterek_száma * hónapok_száma * (1 - emelet_telitettség_kedvezmény) * (1 - hónapok_száma_kedvezmény)`

- **UR-004**: A rendszer a megadott emelet iroda árai közül a legolcsóbbat adja vissza mint árajánlat
- **UR-005**: Ha az emeletnek 0 van megadva akkor az összes iroda árai közül a legolcsóbbat adja vissza mint árajánlat
- **UR-006**: Ha a rendszer nem talál olyan irodát amiben a kiadható négyzetméterek száma kissebb mint a megadott négyzetméterszám akkor a rendszer adjon vissza hibát
- **UR-007**: Ha a meeting room igény be van kapcsolva, akkor az árajánlathoz adódjon hozzá a `meeting_room_ár`
- **UR-008**: Ha a parkolóigény be van kapcsolva, akkor az árajánlathoz adódjon hozzá a `parkoló_ár`
- **UR-009**: Ha a `hónapok_száma` nagyobb mint 120 akkor a rendszer adjon vissza hibát

## Alapár és alapár-frissítés

- **UR-010**: A rendszer az `irodaház_telitettség` értékét így számolja:

`sum(bérleti_szerződés az irodaházban)(bérleti_szerződés.négyzetméterek_száma) / sum(iroda az irodaházban)(iroda.négyzetmérek_száma)`

- **UR-011**: A „Következő hónap” meghívásakor, ha `irodaház_telitettség > 0.9`, akkor az új `alap_ár = régi_alap_ár * 1.05`.
- **UR-012**: A „Következő hónap” meghívásakor, ha `irodaház_telitettség < 0.4` és `alap_ár > kezdeti_alap_ár / 2`, akkor az új `alap_ár = régi_alap_ár * 0.95`.

## Négyzetméterek száma követelmények

- **UR-013**: A rendszer csak olyan irodára generálhat ajánlatot, ahol a szabad négyzetméterek száma `>= megadott_négyzetméterek_száma`.
- **UR-014**: Ha nincs olyan iroda, ahol a szabad négyzetméterek száma `>= megadott_négyzetméterek_száma`, a rendszer árajánlat helyett hibát ad vissza.
- **UR-015**: Ha egy iroda szabad területe pontosan egyenlő a `megadott_négyzetméterek_száma` értékével, akkor az ajánlatban `négyzetméterek_száma = megadott_négyzetméterek_száma`.
- **UR-016**: Ha egy iroda szabad területe legalább 5-tel nagyobb a `megadott_négyzetméterek_száma` értékénél, akkor az ajánlatban `négyzetméterek_száma = megadott_négyzetméterek_száma`.
- **UR-017**: Ha egy iroda szabad területe nagyobb a `megadott_négyzetméterek_száma` értékénél, de a különbség kisebb mint 5, akkor az ajánlatban a `négyzetméterek_száma` egyenlő az iroda szabad négyzetmétereinek számával`.

## Hónapok száma kedvezmény

- **UR-018**: Ha `hónapok_száma < 6`, akkor `hónapok_száma_kedvezmény = 0`.
- **UR-019**: Ha `6 <= hónapok_száma < 12`, akkor `hónapok_száma_kedvezmény = 0.05`.
- **UR-020**: Ha `12 <= hónapok_száma < 18`, akkor `hónapok_száma_kedvezmény = 0.1`.
- **UR-021**: Ha `hónapok_száma >= 18`, akkor `hónapok_száma_kedvezmény = 0.15`.

## Emelet telítettség és kedvezmény

- **UR-022**: A rendszer az `emelet_telitettség` értékét így számolja:

`sum(bérleti_szerződés az emeleten)(bérleti_szerződés.négyzetméterek_száma) / sum(iroda az emeleten)(iroda.négyzetmérek_száma)`

- **UR-023**: Ha `emelet_telitettség > 0.8`, akkor `emelet_telitettség_kedvezmény = emelet_telitettség / 20`.
- **UR-024**: Ha `emelet_telitettség <= 0.8`, akkor `emelet_telitettség_kedvezmény = 0`.

## Meeting room árképzés

- **UR-025**: A rendszer a `meeting_room_ár` értékét így számolja:

`meeting_room_ár = 10 * (1 - emelet_meeting_room_telitettség_kedvezmény)`

- **UR-026**: A rendszer az `emelet_meeting_room_telitettség` értékét így számolja:

`(adott emeleten meeting roomot igénybe vevők száma) / (adott emelet irodáinak száma * 2)`

- **UR-027**: Ha `emelet_meeting_room_telitettség > 0.8`, akkor `emelet_meeting_room_telitettség_kedvezmény = emelet_meeting_room_telitettség / 20`.
- **UR-028**: Ha `emelet_meeting_room_telitettség <= 0.8`, akkor `emelet_meeting_room_telitettség_kedvezmény = 0`.

## Parkoló árképzés

- **UR-029**: A rendszer a `parkoló_ár` értékét így számolja:

`parkoló_ár = parkolók_száma * 10 * (1 - parkoló_telitettség_kedvezmény)`

- **UR-030**: A rendszer a `parkoló_telitettség` értékét így számolja:

`kibérelt_parkolók_száma / összes_parkoló_száma`

- **UR-031**: Ha `parkoló_telitettség > 0.8`, akkor `parkoló_telitettség_kedvezmény = parkoló_telitettség / 20`.
- **UR-032**: Ha `parkoló_telitettség <= 0.8`, akkor `parkoló_telitettség_kedvezmény = 0`.
- **UR-033**: Ha a parkolóigény be van kapcsolva és nincs elérhető parkoló akkor a rendszer adjon vissza hibát

## Kimutatás

- **UR-034**: A táblázat minden sora tartalmazza a hónap dátumát és az adott hónap bevételét.
- **UR-035**: A hónap bevétele meg kell egyezzen a hónapra érvényes bérleti szerződések összegével (egy bérleti szerződés már abban a hónapban is érvényesnek számít amiben megkötötték)
- **UR-036**: A kimutatás tartalmazza az `irodaház_telitettség`-et melyet a leírásban szereplő képlet szerint számol ki a hónapra érvényes bérleti szerződésekből

## Árajánlat elfogadása

- **UR-037**: Az ajánlat elfogadásával az árajánlatban megadott adatok bekerülnek a rendszerbe 

## Következő hónap

- **UR-038**: A következő hónap meghívásával a rendszer növeli az aktuális dátumot
