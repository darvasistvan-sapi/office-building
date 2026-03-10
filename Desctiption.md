# Irodaház-menedzsment

Az applikáció egy olyan irodaház menedzselését segíti elő, ahol irodákat adnak bérbe. Az applikáció tárolja, hogy az irodaházban milyen bérleti szerződések aktívak, árajánlatokat generál, illetve kimutatást készít.

## Árajánlat generálás

A menedzser megadhatja a vevő igényeit amikből az applikáció kigenerál az igényeknek megfelelő árajánlatot és az iroda számát amihez az ajánlat szól. Egy irodát több vevő is bérelhet de egy ajánlat csakis egy irodára vonatkozhat.
A vevőnek a következő lehetőségei vannak:

- hány négyzetmétert akar bérelni (minimum 5),
- a bérlés kezdeti dátuma,
- a bérlés végső dátuma,
- hányadik emeleten akar bérelni (ha a menedzser 0-t ad meg akkor az applikáció az egész épületet vizsgálja),
- mekkora zaj konfliktus lehet
- milyen meeting szoba prioritást választ: nem akar meeting hozzáférést, alacsony prioritású, közepes prioritású, magas prioritású
- hány parkolóhelyet akar.

Egy iroda árajánlatának képlete:

`alap_ár * négyzetméterek_száma * napok_száma * (1 + irodaház_telitettség_szorzó * irodaház_telítettség) * (1 - szerződés_hossza_kedvezmény) * (1 - zaj_konfliktus_szorzó * zaj_konfliktus)`

Az applikáció a megadott emelet irodáiból mindig a legolcsóbb iroda ajánlatot adja vissza (ha az emeletnek 0 volt megadva akkor az applikáció az összes irodát végignézi). Ha a menedzser bejelölte, akkor ehhez az árhoz még hozzáadódik a `meeting_room_ár` és a `parkoló_ár`.

### Alapár

Az `alap_ár` felel meg annak az árnak, amibe alapvetően egy négyzetméternyi irodát egy napig lehet bérelni. 

### Irodaház telítettség

<a id="irodahaz-telitettseg"></a>Az `irodaház_telitettség` megmutatja, hogy mennyire telített az irodaház egy adott napon. Egyenlő a kibérelt négyzetméterek összege osztva az irodák négyzetmétereinek összegével:

`irodaház_telitettség = sum(bérleti_szerződés az irodaházban)(bérleti_szerződés.négyzetméterek_száma) / sum(iroda az irodaházban)(iroda.négyzetméterek_száma)`

Az irodaház_telítettség egy időintervallumban egyenlő az irodaház_telítettségek átlagával az intervallum napjain. Az applikáció nagyobb árajánlatokat ad vissza, ha az irodaház telített és alacsonyabbakat, ha üres. Az irodaház_telitettség_szorzó azt mutatja meg, hogy hány százalékkal magasabb árajánlatot adjon vissza az applikáció, amikor az irodaház_telítettség maximális.

### Négyzetméterek száma

Mivel a legkissebb kiadható hely 5 négyzetméter ezért ha egy irodában egy kiadás után 5 négyzetméternél kissebb kiadható hely marad akkor a megmaradt hely hasztalanul marad. Ezt az applikáció úgy oldja meg, hogy megvizsgálja, hogy az adott irodában az igényelt nagyságú hely kiadása után marad-e meg hely és ha igen akkor a megmaradt hely kiadható-e. Ha maradna meg hely és az nem kiadható nagyságú akkor az applikáció az ajánlathoz hozzáadja a megmaradt helyet (pl.: ha a vevő 7 négyzetmétert akar bérelni akkor egy 10 négyzetméteres iroda esetén az ajánlat 10 négyzetméterről fog szólni, mivel a megmaradt 3 négyzetmétert már nem lehet kiadni). Tehát:

- Ha az irodában a szabad négyzetméterek száma egyenlő a `megadott_négyzetméterek_száma`-val akkor `négyzetméterek_száma = megadott_négyzetméterek_száma`
- Ha az irodában a szabad négyzetméterek száma legalább 5-el nagyobb mint a `megadott_négyzetméterek_száma` akkor `négyzetméterek_száma = megadott_négyzetméterek_száma`
- Különben a `négyzetméterek_száma` egyenlő az iroda szabad négyzetmétereinek számával

### Szerződés hossza kedvezmény

- Ha a `hónapok_száma < 6`, akkor: `szerződés_hossza_kedvezmény = 0`
- Ha 6 és 12 között van, akkor: `szerződés_hossza_kedvezmény = 0.05`
- Ha 12 és 18 között van, akkor: `szerződés_hossza_kedvezmény = 0.1`
- Ha 18 vagy annál nagyobb, akkor: `szerződés_hossza_kedvezmény = 0.15`

### Zaj konfliktus

Az applikáció nagyobb árajánlatokat ad vissza, ha az iroda csendesebb és alacsonyabbakat, ha zajosabb. A zaj_konfliktus_szorzó azt mutatja meg, hogy hány százalékkal magasabb árajánlatot adjon vissza az applikáció, amikor a zaj konfliktus maximális.
Minden irodának más a zaj_konfliktus értéke, ez az applikáció egy olyan iroda menedzselésére hivatott ahol az irodák minden emeleten egyetlen egy hosszú folyosón helyezkednek el, a folyosó pedig egyetlen egy hosszú vonal, ezért a folyosó közepén lévő irodáknak a legnagyobb a zaj szennyezettsége, a széleken lévő irodáknak pedig a legkissebb. Az irodák számozása a folyosó egyik végétől kezdődnek és haladnak a másik végéig majd vissza, így a legkevésbé zajos irodák a sor elején, közepén és végén vannak, a legzajosabbak pedig a sor negyedénél és háromnegyedénél.

ha iroda_szám <= irodák_száma_egy_emeleten / 2:
    folyosó_pozíció = iroda_szám
különben:
    folyosó_pozíció = irodák_száma_egy_emeleten - iroda_szám + 1

- A zaj_konfliktus értéke a folyosó pozíciója alapján (0 = csendes, 1 = zajos)

zaj_konfliktus = sin(π * (folyosó_pozíció - 0.5) / (irodák_száma_egy_emeleten / 2 + 0.5))

### Fizikai szeparáció

Egyes irodák több elszigetelt részből állnak, ebben az esetben az irodát csak úgy lehet részlegesen kibérelni, hogy egy az üresen maradt rész legalább 5 négyzetméter vagy 0 kell legyen bármelyik elszigetelt részről is beszéljünk

### Shared infrastructure

Az irodaházban vannak coworking irodák is amik közösségi irodaként működnek, tehát a bérlő nem kizárólagos használatért fizet hanem többen is bérelhetik egyszerre. Ezek az irodák mellé ugyanúgy bérelhető parkoló és meeting room használat. Minden coworking irodának van egy max_bérlő_száma aminél nem lehet az irodának több bérlője

`coworking_alap_ár * napok_száma * (1 + irodaház_telitettség_szorzó * irodaház_telítettség) * (1 - szerződés_hossza_kedvezmény)`

### Meeting room ár

`meeting_room_ár = meeting_room_alap_ár * (1 + emelet_meeting_room_telitettségi_szorzó * emelet_meeting_room_telitettség)`

Az applikáció nagyobb árajánlatokat ad vissza a meeting roomra, ha az emeleten már sokan használják azt és alacsonyabbakat, ha kevesen. Az irodaház_telitettség_szorzó azt mutatja meg, hogy hány százalékkal magasabb árajánlatot adjon vissza az applikáció, amikor az emeleten a meeting room teljesen telített.

Az `emelet_meeting_room_telitettség` egyenlő az adott emeleten meeting roomot igénybe vevők számával osztva az emelet irodái számának kétszeresével.

A meeting_room_alap_ár az az érték amibe alap esetben a meeting room egy napi bérlése kerül alacsony prioritással. A közepes prioritás 20%-al drágább, a magas prioritás pedig 40%-al.

### Parkoló ár

`parkoló_ár = parkolók_száma * parkoló_alap_ár * (1 - parkoló_telitettségi_szorzó * parkoló_telitettség)`

Az applikáció nagyobb árajánlatokat ad vissza a parkolókra, ha a parkoló telített és alacsonyabbakat, ha üres. A parkoló_telitettségi_szorzó azt mutatja meg, hogy hány százalékkal magasabb árajánlatot adjon vissza az applikáció, amikor a parkoló teljesen telített.

A `parkoló_telitettség` egyenlő a kibérelt parkolók száma osztva az összes parkoló számával.

A parkoló_alap_ár az az érték amibe alap esetben egy parkoló egy napi bérlése kerül

## Kimutatás

A menedzsernek lehetősége van bármikor lekérni egy kimutatást amivel a rendszer kigenerál egy táblázatot, hogy melyik napon mennyi bevételt termelt az irodaház. Emellett kigenerálja az [irodaház_telitettséget](#irodahaz-telitettseg).

## Árajánlat elfogadása

Amikor az applikáció kigenerál egy árajánlatot akkor a rendszerben letárolja azt proposed státuszal. Ha az ügyfél ezt elutasítja vagy nem ad rá választ egy hónapig akkor az ajánlat státusza rejected lesz. Ha az ügyfél elfogadja az árajánlatot akkor az ajánlat státusza reserved lesz, ha pedig megkötődik a szerződést akkor contracted. A telitettséggel kapcsolatos mutatóknál az applikáció kizárólag a contracted ajánlatokkal számol.
Ha a vevő elfogadja az árajánlatot akkor a menedzsernek lehetősége van felvinni a rendszerbe amivel rendszer letárolja az árajánlatban megfogalmazott iroda lefoglalását, hogy mennyiért bérli, és a többi adatot, ami az árajánlat generálásnál meg volt adva.
