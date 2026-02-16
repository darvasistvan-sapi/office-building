# Irodaház-menedzsment

Az applikáció egy olyan irodaház menedzselését segíti elő, ahol irodákat adnak bérbe. Az applikáció tárolja, hogy az irodaházban milyen bérleti szerződések aktívak, árajánlatokat generál, illetve kimutatást készít.

## Árajánlat generálás

A menedzser megadhatja a vevő igényeit amikből az applikáció kigenerál az igényeknek megfelelő árajánlatot és az iroda számát amihez az ajánlat szól. Egy irodát több vevő is bérelhet de egy ajánlat csakis egy irodára vonatkozhat.
A vevőnek a következő lehetőségei vannak:

- hány négyzetmétert akar bérelni (minimum 5),
- hány hónapra akar bérelni,
- hányadik emeleten akar bérelni (ha a menedzser 0-t ad meg akkor az applikáció az egész épületet vizsgálja),
- igényel-e hozzáférést a meeting szobához,
- hány parkolóhelyet akar.

Egy iroda árajánlatának képlete:

`alap_ár * négyzetméterek_száma * hónapok_száma * (1 - emelet_telitettség_kedvezmény) * (1 - hónapok_száma_kedvezmény)`

Az applikáció a megadott emelet irodáiból mindig a legolcsóbb iroda ajánlatot adja vissza (ha az emeletnek 0 volt megadva akkor az applikáció az összes irodát végignézi). Ha a menedzser bejelölte, akkor ehhez az árhoz még hozzáadódik a `meeting_room_ár` és a `parkoló_ár`.

### Alapár

Az `alap_ár` felel meg annak az árnak, amibe alapvetően egy négyzetméternyi irodát egy hónapig lehet bérelni. Ezt az értéket a kezdeti konfigurációban adjuk meg, majd az applikáció a későbbiekben módosíthatja:

- Ha az `irodaház_telitettség > 0.9`, akkor a [következő hónap](#következő-hónap) meghívásakor az applikáció növel az `alap_ár`-on 5%-ot.
- Ha az `irodaház_telitettség < 0.4` és az `alap_ár` nagyobb, mint a kezdeti konfigurációban megadott érték fele, akkor a [következő hónap](#következő-hónap) meghívásakor az applikáció csökkent az `alap_ár`-on 5%-ot.

<a id="irodahaz-telitettseg"></a>Az `irodaház_telitettség` egyenlő a kibérelt négyzetméterek összege osztva az irodák négyzetmétereinek összegével:

`irodaház_telitettség = sum(bérleti_szerződés az irodaházban)(bérleti_szerződés.négyzetméterek_száma) / sum(iroda az irodaházban)(iroda.négyzetmérek_száma)`

### Négyzetméterek száma

Mivel a legkissebb kiadható hely 5 négyzetméter ezért ha egy irodában egy kiadás után 5 négyzetméternél kissebb kiadható hely marad akkor a megmaradt hely hasztalan marad. Ezt az applikáció úgy oldja meg, hogy megvizsgálja, hogy az adott irodában az igényelt nagyságú hely kiadása után marad-e meg hely és ha igen akkor a megmaradt hely kiadható-e. Ha maradna meg hely és az nem kiadható nagyságú akkor az applikáció az ajánlathoz hozzáadja a megmaradt helyet (pl.: ha a vevő 7 négyzetmétert akar bérelni akkor egy 10 négyzetméteres iroda esetén az ajánlat 10 négyzetméterről fog szólni, mivel a megmaradt 3 négyzetmétert már nem lehet kiadni). Tehát:

- Ha az irodában a szabad négyzetméterek száma egyenlő a `megadott_négyzetméterek_száma`-val akkor `négyzetméterek_száma = megadott_négyzetméterek_száma`
- Ha az irodában a szabad négyzetméterek száma legalább 5-el nagyobb mint a `megadott_négyzetméterek_száma` akkor `négyzetméterek_száma = megadott_négyzetméterek_száma`
- Különben a `négyzetméterek_száma` egyenlő az iroda szabad négyzetmétereinek számával

### Hónapok száma kedvezmény

- Ha a `hónapok_száma < 6`, akkor: `hónapok_száma_kedvezmény = 0`
- Ha 6 és 12 között van, akkor: `hónapok_száma_kedvezmény = 0.05`
- Ha 12 és 18 között van, akkor: `hónapok_száma_kedvezmény = 0.1`
- Ha 18 vagy annál nagyobb, akkor: `hónapok_száma_kedvezmény = 0.15`

### Emelet telítettség kedvezmény

Az `emelet_telitettség_kedvezmény` szerepe az, hogy ösztönözze a bérlőket, hogy a zsúfoltabb emeleteket is kibéreljék.

- Ha az `emelet_telitettség > 0.8`, akkor: `emelet_telitettség_kedvezmény = emelet_telitettség / 20`
- Különben: `emelet_telitettség_kedvezmény = 0`

Az `emelet_telitettség` egyenlő az adott emeleten lévő kibérelt négyzetméterek összege osztva az irodák négyzetmétereinek összegével:

`emelet_telitettség = sum(bérleti_szerződés az emeleten)(bérleti_szerződés.négyzetméterek_száma) / sum(iroda az emeleten)(iroda.négyzetmérek_száma)`

### Meeting room ár

`meeting_room_ár = 10 * (1 - emelet_meeting_room_telitettség_kedvezmény)`

Az `emelet_meeting_room_telitettség_kedvezmény` szerepe az, hogy ösztönözze a bérlőket, hogy akkor is használják a meeting roomot, ha azt már sokan használják.

- Ha az `emelet_meeting_room_telitettség > 0.8`, akkor: `emelet_meeting_room_telitettség_kedvezmény = emelet_meeting_room_telitettség / 20`
- Különben: `emelet_meeting_room_telitettség_kedvezmény = 0`

Az `emelet_meeting_room_telitettség` egyenlő az adott emeleten meeting roomot igénybe vevők számával osztva az emelet irodái számának kétszeresével.

### Parkoló ár

`parkoló_ár = parkolók_száma * 10 * (1 - parkoló_telitettség_kedvezmény)`

Az `parkoló_telitettség_kedvezmény` szerepe az, hogy ösztönözze a bérlőket, hogy akkor is használják a parkolót, ha az zsúfoltabb.

- Ha a `parkoló_telitettség > 0.8`, akkor: `parkoló_telitettség_kedvezmény = parkoló_telitettség / 20`
- Különben: `parkoló_kedvezmény = 0`

Az `parkoló_telitettség` egyenlő a kibérelt parkolók száma osztva az összes parkoló számával.

## Kimutatás

A menedzsernek lehetősége van bármikor lekérni egy kimutatást amivel a rendszer kigenerál egy táblázatot, hogy melyik hónapban mennyi bevételt termelt az irodaház. Emellett kigenerálja az [irodaház_telitettséget](#irodahaz-telitettseg).

## Árajánlat elfogadása

Ha a vevő elfogadja az árajánlatot akkor a menedzsernek lehetősége van felvinni a rendszerbe amivel rendszer letárolja az árajánlatban megfogalmazott iroda lefoglalását, hogy mennyiért bérli, és a többi adatot, ami az árajánlat generálásnál meg volt adva.

## Következő hónap

Ha az aktuális hónapban nincs több vevő akkor a menedzsernek lehetősége van átmenni a következő hónapra amivel a rendszer növeli az aktuális dátumot és frissíti a letárolt adatokat.