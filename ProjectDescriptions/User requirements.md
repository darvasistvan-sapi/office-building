## Általános

- **UR-001**: Az applikáció tárolja az irodaház aktív bérleti szerződéseit.
- **UR-002**: Az applikáció rendelkezik egy árajánlat generáló funkcióval
- **UR-003**: Az applikáció rendelkezik egy kimutatás funkcióval

## Árajánlat-generálás

- **UR-004**: Az árajánlat-generálás során megadható: vevő neve, igényelt négyzetméter (minimum 5), kezdő dátum, záró dátum, emelet (0 esetén teljes épület), zaj konfliktus tűrés, meeting room prioritás (nincs/alacsony/közepes/magas), parkolóhelyek száma.
- **UR-005**: Egy iroda több vevő által is bérelhető, de egy árajánlat pontosan egy irodára vonatkozik.
- **UR-006**: A rendszer mindig a vizsgált irodák közül a legolcsóbb érvényes ajánlatot adja vissza.
- **UR-007**: Ha a megadott emelet 0, akkor a rendszer az összes iroda közül választ.
- **UR-008**: Az iroda árajánlatát a rendszer az alábbi képlettel számolja:

`alap_ár * négyzetméterek_száma * napok_száma * (1 + irodaház_telitettség_szorzó * irodaház_telítettség) * (1 - szerződés_hossza_kedvezmény) * (1 - zaj_konfliktus_szorzó * zaj_konfliktus)`

- **UR-009**: Ha meeting room igény be van jelölve, a rendszer az ajánlathoz hozzáadja a `meeting_room_ár` értékét.
- **UR-010**: Ha parkolóigény be van jelölve, a rendszer az ajánlathoz hozzáadja a `parkoló_ár` értékét.

## Irodaház telítettség

- **UR-011**: A rendszer az `irodaház_telitettség` értékét így számolja:

`sum(bérleti_szerződés az irodaházban)(bérleti_szerződés.négyzetméterek_száma) / sum(iroda az irodaházban)(iroda.négyzetméterek_száma)`

- **UR-012**: Időintervallumra számolt `irodaház_telítettség` értéke az intervallum napjaira számolt napi telítettségek átlaga.

## Négyzetméter-számítás

- **UR-013**: A legkisebb kiadható terület 5 négyzetméter.
- **UR-015**: A rendszer ajánlatkészítéskor ellenőrzi, hogy az igényelt terület kiosztása után maradó terület kiadható-e és ha a maradó terület kisebb mint 5 négyzetméter, akkor a rendszer a maradékot is az ajánlati területhez adja.
- **UR-016**: Ha a szabad terület pontosan egyenlő a `megadott_négyzetméterek_száma` értékkel, akkor `négyzetméterek_száma = megadott_négyzetméterek_száma`.
- **UR-017**: Ha a szabad terület legalább 5-tel nagyobb a `megadott_négyzetméterek_száma` értéknél, akkor `négyzetméterek_száma = megadott_négyzetméterek_száma`.
- **UR-018**: Egyéb esetben `négyzetméterek_száma = iroda_szabad_négyzetméter`.

## Szerződés hossza kedvezmény

- **UR-019**: Ha `hónapok_száma < 6`, akkor `szerződés_hossza_kedvezmény = 0`.
- **UR-020**: Ha `6 <= hónapok_száma < 12`, akkor `szerződés_hossza_kedvezmény = 0.05`.
- **UR-021**: Ha `12 <= hónapok_száma < 18`, akkor `szerződés_hossza_kedvezmény = 0.1`.
- **UR-022**: Ha `hónapok_száma >= 18`, akkor `szerződés_hossza_kedvezmény = 0.15`.

## Zaj konfliktus

- **UR-023**: A rendszer az alacsonyabb zaj konfliktusú irodákra magasabb, a magasabb zaj konfliktusú irodákra alacsonyabb árajánlatot ad.
- **UR-024**: A rendszer a folyosó pozíciót az alábbi logika szerint számolja:

`ha iroda_szám <= irodák_száma_egy_emeleten / 2: folyosó_pozíció = iroda_szám`  
`különben: folyosó_pozíció = irodák_száma_egy_emeleten - iroda_szám + 1`

- **UR-025**: A rendszer a `zaj_konfliktus` értéket az alábbi képlettel számolja:

`zaj_konfliktus = sin(π * (folyosó_pozíció - 0.5) / (irodák_száma_egy_emeleten / 2 + 0.5))`

- **UR-026**: A `zaj_konfliktus_szorzó` azt adja meg, hogy maximális zaj konfliktusnál hány százalékkal módosuljon az ajánlat.

## Fizikai szeparáció

- **UR-027**: Több elszigetelt részből álló iroda esetén részleges bérlés csak akkor engedélyezett, ha minden üresen maradó elszigetelt rész területe legalább 5 négyzetméter vagy 0.

## Shared infrastructure (coworking)

- **UR-028**: A rendszer támogat coworking irodákat, ahol több bérlő bérelhet egyszerre nem kizárólagos használattal.
- **UR-029**: Coworking irodához is igényelhető parkoló és meeting room használat.
- **UR-030**: Minden coworking irodához tartozik `max_bérlő_száma`, amit a rendszer nem léphet túl.
- **UR-031**: Coworking árajánlat számítása:

`coworking_alap_ár * napok_száma * (1 + irodaház_telitettség_szorzó * irodaház_telítettség) * (1 - szerződés_hossza_kedvezmény)`

## Meeting room árképzés

- **UR-032**: A rendszer a `meeting_room_ár` értékét az alábbi képlettel számolja:

`meeting_room_ár = meeting_room_alap_ár * (1 + emelet_meeting_room_telitettségi_szorzó * emelet_meeting_room_telitettség)`

- **UR-033**: Az `emelet_meeting_room_telitettség` értéke:

`(adott emeleten meeting roomot igénybe vevők száma) / (adott emelet irodáinak száma * 2)`

- **UR-034**: Közepes prioritás esetén a meeting room ár 20%-kal magasabb az alacsony prioritáshoz képest.
- **UR-035**: Magas prioritás esetén a meeting room ár 40%-kal magasabb az alacsony prioritáshoz képest.

## Parkoló árképzés

- **UR-036**: A rendszer a `parkoló_ár` értékét az alábbi képlettel számolja:

`parkoló_ár = parkolók_száma * parkoló_alap_ár * (1 - parkoló_telitettségi_szorzó * parkoló_telitettség)`

- **UR-037**: A `parkoló_telitettség` értéke:

`kibérelt_parkolók_száma / összes_parkolók_száma`

## Kimutatás

- **UR-038**: A kimutatás táblázata napi bontásban tartalmazza, hogy az irodaház melyik napon mennyi bevételt termelt.
- **UR-039**: A kimutatás tartalmazza az `irodaház_telitettség` értéket is.

## Árajánlat státuszok és elfogadás

- **UR-040**: Frissen generált árajánlat státusza `proposed`.
- **UR-041**: Ha az ügyfél elutasítja az ajánlatot, vagy 1 hónapig nem válaszol, a státusz `rejected`.
- **UR-042**: Ha az ügyfél elfogadja az ajánlatot, a státusz `reserved`.
- **UR-043**: Szerződéskötéskor a státusz `contracted`.
- **UR-044**: A telítettséggel kapcsolatos mutatók számításánál a rendszer kizárólag `contracted` ajánlatokat vesz figyelembe.
- **UR-045**: Elfogadott ajánlat esetén a menedzser rögzítheti a rendszerben a lefoglalást, a bérleti árat és az ajánlat generáláskor megadott további adatokat.
- **UR-046**: A rendszer az `Offer` rekordot csak a legolcsóbb érvényes ajánlat kiszámítása és kiválasztása után rögzíti – az árkalkuláció során közbülső rekord nem jön létre.
