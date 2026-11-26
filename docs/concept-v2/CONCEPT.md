# Tune Timeline — concept v2 (definitief)

*Samengevoegd uit de concepten van Opus en Antigravity, 24 november 2026. Dit document is de bron van waarheid voor regels, schermen en gedrag. Het uiterlijk staat in `mockups/index.html`; keuzes die bij Josse liggen staan in `BESLISSINGEN.md` (hier is overal de aanbeveling ingevuld). Bronnen staan als [B1], [B2] enzovoort en zijn uitgeschreven in hoofdstuk 11.*

---

## 1. Samenvatting

1. De pc aan de tv is het **bord en de jukebox**: hij speelt via Spotify (Premium van de host) het nummer af en toont tijdlijnen, scores en de onthulling.
2. Iedereen, ook de host, speelt op de **eigen telefoon** via QR-code of 4-letterige roomcode: geen app, geen account, niets printen.
3. Regels volgen de Nederlandse **Hitster Original**: 1 open startkaart, plaatsen zonder jaartal te zien, **10 kaarten** wint, zelfde jaar mag aan beide kanten.
4. Tokens zoals in het echte spel: start met 2, max 5; **overslaan** (1), **stelen** (1), **kopen** (3, bij je beurtstart, daarna speel je gewoon) en **verdienen** (titel + artiest goed).
5. **Stelen** kan 10 seconden na het vastzetten: je telefoon toont direct de tijdlijn van de ander, je tikt een plek en "STEEL". Wie het eerst tikt, heeft die plek.
6. Titel + artiest beoordeelt de groep met het **bezwaarsysteem**: geldt als goed, tenzij de helft van de anderen binnen 6 s "Fout!" tikt.
7. Wie niet aan de beurt is doet mee via **stelen, stiekem meegokken** (prijs "Beste oor") en **emoji-reacties** op de tv.
8. Uiterlijk **"nachtradio"**: diep nachtpaars, crèmekleurige kaarten als concertkaartjes met een decenniumband, amber = aan de beurt, mint = goed, rood = fout, violet = stelen.
9. Een beurt duurt **±55–65 s**. Met 10 spelers en doel 10 duurt een partij ±1 u 45; de lobby toont de schatting en raadt bij 8+ spelers doel 8 aan.
10. De nummerlijst wordt vooraf **eenmalig omgezet** naar `songs.json` met het oorspronkelijke jaar (Spotify + MusicBrainz + correctielijst).
11. Techniek: statische site op Vercel, **Supabase Realtime (alleen Broadcast + Presence)** in het bestaande project, de tv is de enige bron van waarheid, telefoons krijgen het antwoord pas bij de onthulling.
12. Grootste risico: de Spotify-ontwikkelaarsregels verbieden spellen [B20]; daarnaast is de Web Playback SDK soms grillig, dus er is een terugvaloptie via de Spotify-app op de pc.

---

## 2. Spelregels (definitief)

Legenda: **[ECHT]** = uit het echte spel (Nederlandse regels [B1], tenzij anders vermeld). **[ONLINE]** = aanpassing voor de online versie. **[KEUZE]** = de regels zeggen het niet of verschillen per land; wij kiezen.

### 2.1 Spelers en voorbereiding
| Regel | Herkomst |
|---|---|
| 2 tot 10 spelers, ieder voor zich. | [ECHT] (teams bestaan ook; komen later, hoofdstuk 10) |
| Elke speler krijgt 1 willekeurige startkaart, open: jaartal, titel en artiest zichtbaar. | [ECHT] |
| Startkaarten: **geen twee spelers hetzelfde startjaar**, en alle startjaren tussen 1960 en 2015. | [ONLINE] eerlijker; niemand begint met een "gratis" randjaar |
| Iedereen start met **2 tokens**, maximum **5**. | [ECHT] |
| Speelvolgorde = volgorde van binnenkomst in de lobby. De host kan in de lobby spelers verslepen. | [ONLINE] vervangt "met de klok mee" |
| De speler met de **oudste startkaart** begint; daarna gaat het rondje verder vanaf die speler. | [ECHT] |

### 2.2 Doel en winnen
| Regel | Herkomst |
|---|---|
| Wie als eerste **10 kaarten** goed in zijn tijdlijn heeft, wint direct. De startkaart telt mee. | [ECHT] 10 kaarten; dat de startkaart meetelt staat nergens letterlijk [B1][B2] → [KEUZE] |
| Doel instelbaar in de lobby: **6, 8, 10** (standaard) of 12. Bij 8 of meer spelers toont de lobby het advies "doel 8". | [ONLINE] |
| Per beurt wordt hooguit één kaart uit de stapel verdeeld (actieve speler óf één steler), plus eventueel één gekochte kaart door de actieve speler. Twee spelers kunnen dus **nooit tegelijk** op het doel komen. | [ONLINE] logisch gevolg |
| Een steler die door een gestolen kaart op het doel komt, wint meteen. | [ECHT] |
| Wie door kopen op het doel komt, wint meteen; het nummer van die beurt wordt dan niet meer gespeeld. | [ECHT] |
| Raakt de stapel op, dan worden afgelegde en overgeslagen nummers opnieuw geschud (nooit kaarten die op een tijdlijn liggen). | [ONLINE] |

### 2.3 Een beurt
1. **Beurtstart (6 s).** Tv: "Daan is aan de beurt". Daans telefoon kleurt amber en trilt. Hij kan **kopen** (2.6) of "Start nummer" tikken. Doet hij niets, dan start het nummer na 6 s vanzelf. [ONLINE]
2. **Luisteren en plaatsen (45 s).** Het nummer speelt op de tv. Niemand ziet titel, artiest of jaar. Daan tikt een plek in zijn tijdlijn (ervoor, ertussen of erna) en mag wisselen zo vaak hij wil. De tv toont live waar de raadselkaart ligt. [ECHT] plaatsen zonder jaartal; live meekijken [ONLINE]
3. **Titel en artiest claimen (optioneel).** Vóór het vastzetten zet Daan het schuifje "Ik noem titel + artiest" aan en **zegt het hardop**. [ECHT] zeggen; schuifje [ONLINE]
4. **Overslaan (optioneel).** Zie 2.6. [ECHT]
5. **Vastzetten.** Daan tikt "Vastzetten". De kaart ligt vast. [ONLINE]
6. **Steelvenster (10 s).** Anderen kunnen stelen (2.5). [ECHT] stelen vóór het omdraaien
7. **Onthulling.** De kaart draait om: jaar, titel, artiest. Goed = Daan houdt hem. Fout = de kaart gaat weg, tenzij iemand hem goed gestolen heeft. [ECHT]
8. **Bezwaar (6 s, alleen bij een claim, of altijd in Pro/Expert).** Zie 2.7.
9. **Volgende speler.** Na elke volledige ronde: tussenstand (6 s). [ECHT] / tussenstand [ONLINE]

### 2.4 Goed of fout
| Regel | Herkomst |
|---|---|
| Goed als het jaar ≥ het jaar links en ≤ het jaar rechts is. | [ECHT] |
| **Zelfde jaar:** ligt er al een kaart met hetzelfde jaar, dan is direct ervoor én direct erna goed. Bij een reeks gelijke jaren is elke plek binnen, vóór en ná die reeks goed. | [ECHT] [B1]; reeks [ONLINE] logische uitbreiding |
| Het jaar is het jaar waarin **deze opname door deze artiest** voor het eerst publiek beschikbaar was, niet het jaar van een remaster of verzamelalbum. Het jaar in `songs.json` telt. | [ECHT] [B2] |
| Plaatstimer op 0 en een plek gekozen: die plek wordt vastgezet. Geen plek gekozen: telt als fout, het steelvenster opent gewoon (dan is elke plek stelbaar). | [ONLINE] |

### 2.5 Stelen
| Regel | Herkomst |
|---|---|
| Kost 1 token. Alleen voor spelers die niet aan de beurt zijn, ≥ 1 token hebben en online zijn. | [ECHT] |
| Opent **direct na het vastzetten** en duurt **10 s**. Het venster sluit eerder als iedereen die kan stelen al gestolen of "Pas" getikt heeft. | [ECHT] stelen vóór het omdraaien; 10 s en "Pas" [ONLINE] |
| Je kiest een **andere plek** dan de actieve speler (in Original is zijn plek niet stelbaar). | [ECHT] |
| **Wie het eerst tikt, heeft die plek.** Twee tokens op dezelfde plek kan niet; een bezette plek wordt grijs met de naam. Telt: de volgorde waarin de **tv** de tikken ontvangt. | [ECHT] [B1]; ontvangstvolgorde [ONLINE] |
| Elke speler mag **maximaal 1 keer** per beurt stelen. Een steal is definitief (niet terugdraaien). | [KEUZE] |
| Actieve speler **goed**: alle stelers verliezen hun token. Dat geldt ook als een steler door de zelfde-jaarregel óók op een goede plek stond. | [ECHT] [B1] |
| Actieve speler **fout** en één steler goed: die steler krijgt de kaart, automatisch op de juiste plek in **zijn eigen** tijdlijn. Zijn token is op (Original). | [ECHT] |
| Actieve speler fout en **twee stelers goed** (zelfde jaar): de eerste tikker wint de kaart; de ander krijgt zijn token terug. | [KEUZE] |
| **Niemand steelt goed**: de kaart gaat weg, alle steel-tokens ook. | [ECHT] |
| Pro/Expert: zie 2.8. | |

### 2.6 Tokens op je eigen beurt
| Regel | Herkomst |
|---|---|
| **Overslaan:** 1 token, tijdens het luisteren, vóór het vastzetten. Het nummer stopt, een nieuw nummer start, de plaatstimer begint opnieuw. Het overgeslagen nummer wordt niet onthuld (wel in het eindoverzicht). Mag vaker per beurt zolang je tokens hebt. | [ECHT]; vaker en niet onthullen [KEUZE] |
| **Kopen:** 3 tokens, **alleen tijdens je beurtstart, vóór de muziek**. De bovenste kaart van de stapel wordt meteen goed in je tijdlijn gelegd (zonder raden). **Daarna speel je gewoon je beurt.** Eén keer per beurt. | [ECHT] kopen zonder raden, "je hoeft niet op je beurt te wachten" [B1]; alleen bij beurtstart [ONLINE] zodat er nooit iets midden in andermans beurt gebeurt |
| **Verdienen:** titel én artiest goed genoemd (claim + geen bezwaar) = +1 token, **ook als de plaatsing fout was**. Alleen in Original. | [ECHT] [B1] |
| Zit je op 5 tokens, dan krijg je er geen bij; de tv toont "Max 5". | [ECHT] |

### 2.7 Titel en artiest: het bezwaarsysteem
| Regel | Herkomst |
|---|---|
| De actieve speler zegt titel en artiest hardop vóór het vastzetten (schuifje aan). | [ECHT] / [ONLINE] |
| Na de onthulling verschijnt op de telefoons van de andere **online** spelers 6 s lang een grote rode knop "Fout!" en een kleine knop "Klopt". | [ONLINE] |
| Tikt **minstens de helft** (naar boven afgerond) van de andere online spelers "Fout!", dan telt het als fout. Anders als goed. Het venster sluit eerder als iedereen getikt heeft. | [KEUZE] het echte spel laat dit aan de groep [B1] |
| Wat telt als goed: de hoofdartiest + een herkenbare titel. Spelfouten, "feat."-artiesten en een ontbrekend "The" maken niet uit. Dit staat in de uitleg. | [KEUZE] |
| De host kan in het hostmenu de uitkomst omdraaien (tot de volgende beurt start). | [ONLINE] |

### 2.8 Moeilijkheidsniveaus (host kiest in de lobby)
| Niveau | Start-tokens | Verdienen | Om een kaart te houden of te stelen | Herkomst |
|---|---|---|---|---|
| **Original** (standaard) | 2 | ja | alleen de goede plek | [ECHT] |
| **Pro** | 5 | nee | goede plek + titel + artiest (claim + geen bezwaar). Een gelukte steal kost geen token. Omdat de actieve speler op titel/artiest kan verliezen, **mag een steler in Pro ook zijn plek kiezen**. | [ECHT] [B1][B2]; steel op eigen plek [ONLINE] |
| **Expert** | 3 | nee | goede plek + titel + artiest + **exact jaar**. Het jaar kies je vóór het vastzetten met een jaarwiel op de telefoon; de tv controleert het jaar zelf, titel + artiest via bezwaar. Gelukte steal = token terug. | [ECHT]; jaarwiel [ONLINE] |

In Pro en Expert is de claim verplicht (het schuifje staat vast aan). Een steler in Pro/Expert zegt titel + artiest hardop bij het stelen; het bezwaar geldt dan voor de actieve speler én de winnende steler tegelijk (twee knoppenrijen). Moeilijkheidsniveaus worden pas in fase 3 gebouwd.

### 2.9 Uitzonderingen en randgevallen
| Situatie | Wat er gebeurt |
|---|---|
| Nummer speelt na 6 s niet (geen "speelt"-signaal) | Gele strook 4 s: "Dit nummer wil niet. We pakken een ander. Niemand verliest iets." Het nummer gaat voor de rest van de avond op een "speelt niet"-lijst. De plaatstimer begint opnieuw. |
| Actieve speler offline bij zijn beurtstart | Tv: "Wachten op Sanne… 20". Komt ze niet terug, dan wordt de beurt overgeslagen. Tijdlijn en tokens blijven bewaard. De host kan ook meteen overslaan. |
| Actieve speler valt weg tijdens het plaatsen | De gekozen plek blijft staan, de timer loopt door. Bij 0 wordt die plek vastgezet (geen plek = fout). |
| Speler vertrekt definitief | Host: "Speler verwijderen". Zijn kaarten verdwijnen uit het spel. |
| Speler komt later binnen | Tot het einde van ronde 2: instappen met 1 startkaart en 2 tokens, achteraan in het rondje. Daarna alleen kijken (toeschouwer: meegokken en reacties). |
| Lege accu, verder op andere telefoon | Scan de QR, kies "Ik speelde al" en tik je naam. De host krijgt "Is dit Sanne?" en bevestigt met 1 tik. |
| Twee tikken tegelijk op dezelfde steelplek | Eerste ontvangen wint. De ander ziet "Net bezet door Mila, kies een andere plek"; token blijft. |
| Tik komt binnen na het sluiten van een fase | Genegeerd; telefoon krijgt "Te laat, het venster is dicht. Je token blijft van jou." |
| 0 tokens | Steelweergave verschijnt niet; tekst "0 tokens · verdien er een op je beurt". Overslaan-knop grijs. |
| Tv-pagina ververst | Spel gaat verder waar het was; host klikt één keer "Muziek hervatten"; het lopende nummer begint opnieuw vanaf het begin. |
| Overslaan bij een (bijna) lege stapel | Eerst opnieuw schudden (2.2); kan dat niet, dan is de knop grijs. |

### 2.10 Tijden (standaard; plaatstimer instelbaar in de lobby)
| Fase | Tijd |
|---|---|
| Beurtstart (kopen mogelijk) | 6 s, of korter via "Start nummer" |
| Plaatsen | **45 s** (instelbaar 30 / 45 / 60 / geen timer). Bij 10 s over: timer rood, telefoon trilt 1×. |
| Steelvenster | 10 s (sluit eerder als iedereen gepast of gestolen heeft) |
| Onthulling + resultaat | ±4 s |
| Bezwaar | 6 s (sluit eerder als iedereen getikt heeft) |
| Tussenstand | 6 s na elke ronde |
| Wachten op afwezige speler | 20 s |

---

## 3. Spelbeleving van begin tot eind

### 3.1 Vooraf (dagen ervoor)
- `songs.json` staat in de repo (±300 nummers, jaren gecontroleerd; hoofdstuk 6).
- De dag ervoor: één proefbeurt met de tv-pc en 2 telefoons; Supabase-dashboard even openen zodat het project niet gepauzeerd is (8.2).

### 3.2 De avond (voorbeeld: 9 gasten + host = 10)
| Tijd | Wat gebeurt er |
|---|---|
| 20:00 | Host opent `tune-timeline.vercel.app/tv` in Chrome op de tv-pc, F11 (volledig scherm). Scherm "Verbind Spotify" → eenmalig inloggen. |
| 20:01 | Scherm "Klik om te beginnen 🔊": de klik ontgrendelt het geluid (autoplay-regel), een kort geluidje bevestigt dat het werkt. Checklist op dat scherm: "Spotify-app op je telefoon afgesloten? Laptop op nooit slapen?" |
| 20:02 | **Lobby**: grote QR links, code "KWPX", rechts 10 stoelen. Gasten scannen, typen hun naam, kiezen een kleur, "Ik doe mee". Hun bordje ploft in een stoel. Wie zit, kan emoji's naar de tv sturen. |
| 20:08 | Host kiest instellingen in het hostmenu op zijn telefoon. Tv: "Geschatte speelduur ±1 u 45 · advies bij 10 spelers: doel 8 (±1 u 20)". |
| 20:09 | **Uitleg** op één tv-scherm (4 blokken), host tikt "Begrepen". |
| 20:10 | **Startkaarten**: in 6 s vliegt elke kaart naar een bordje en draait om. "Oudste kaart: Mila (1967). Mila begint!" |
| 20:10–21:30 | Beurten (3.3). Na elke ronde 6 s tussenstand met alle tijdlijnen in het klein. |
| ±21:10 | Iemand staat 1 kaart van het doel: bordje krijgt een rode "MATCH POINT"-vlag; bij zijn beurt een kort trommelroffeltje. |
| ±21:30 | **Winnaar** (3.6), daarna "Nog een potje?" |

### 3.3 Eén beurt, met tijden
| s | Tv | Telefoon actieve speler | Telefoons anderen |
|---|---|---|---|
| 0–6 | "Daan is aan de beurt" in zijn kleur, tijdlijn schuift naar het midden. "Muziek start over 6 · Daan kan eerst een kaart kopen." | Amber scherm, trilt 2×: "Jij bent!" + "▶ Start nummer" + "Kaart kopen · 3 tokens" (grijs bij < 3: "3 tokens nodig (je hebt er 2)"). | "Daan is aan de beurt" + zijn tijdlijn. |
| ±3 | Nummer start (1 s fade-in). Raadselkaart met bewegende equalizer zweeft boven de tijdlijn. Timerring 45. | Verticale tijdlijn met tikbare gaten. Onder: "Overslaan · 1" en "Vastzetten" (grijs tot een plek gekozen is). | **Meegokken**: dezelfde tijdlijn; stiekem een gat tikken. Reactieknoppen 🔥😂😱🎶. |
| ±3–35 | Raadselkaart schuift live mee met "Daan legt hier". | Tik = raadselkaart schuift in dat gat; schuifje "Ik noem titel + artiest". | Meegokken kan tot het vastzetten. |
| ±35 | Stempel "VASTGEZET" (0,3 s). "Wie steelt?" + violette ring 10. | "Vastgezet ✓ Nu duimen…" | Trilt 1× lang. Violette rand; Daans tijdlijn staat open; vrije gaten violet gestippeld. |
| 35–45 | Elke steal verschijnt als fiche met letter en naam in het gat ("zwoesj"). | Ziet de fiches binnenkomen. | Tik gat → knop "STEEL hier · 1 token" → tik. Of "Pas". |
| 45–46,5 | Muziek naar 30%. Trommelroffel 1,2 s. | — | — |
| 46,5–47,2 | Kaart draait om (0,7 s): jaar, titel, artiest. | Zelfde kaart. | Zelfde kaart. |
| 47,2–50 | **Goed**: mint gloed, "+1 kaart". **Mis**: rode rand + streep, "hoorde tussen 1967 en 1985", kaart valt weg. **Gestolen**: kaart vliegt naar het bordje van de steler. "Meegokkers goed: 4 van 8". | Resultaat + nieuw aantal. | Stelers: "Token kwijt" of "Jij stal 'm!". Meegokkers: "Jij zat goed 👂". |
| 50–56 | Alleen bij claim: "Had Daan titel + artiest goed?" + titel/artiest + "Bezwaren: 0 van 8 (4 nodig)". | "Even afwachten…" | Rode "Fout!" + kleine "Klopt", 6 s balk. |
| 56–58 | Uitkomst, eventueel "+1 token". Muziek fadet uit in 2 s. | | |
| 58 | Volgende beurt. | | |

### 3.4 Hoe lang duurt een partij? (schatting)
Aanname (geen meting): ±70% goed met weinig kaarten, ±50% bij 7+ kaarten; de winnaar haalt ±60% plus af en toe een steal of gekochte kaart, dus ±13 eigen beurten voor 9 extra kaarten. Een beurt duurt gemiddeld ±60 s.

| Spelers | Doel 6 | Doel 8 | Doel 10 |
|---|---|---|---|
| 4 | 15 min | 25 min | 35 min |
| 6 | 25 min | 40 min | 55 min |
| 8 | 35 min | 55 min | 1 u 20 |
| 10 | 45 min | 1 u 10 | 1 u 45 |

De doos noemt 30 minuten, maar met minder spelers en zonder online wachtmomenten [B4]. Daarom toont de lobby de schatting en het advies.

### 3.5 Betrokken blijven als je pas na 9 anderen weer aan de beurt bent
- **Stelen** bij elke beurt, met trillen en een violette rand.
- **Meegokken**: gratis een gat tikken; telt niet voor de winst, wel voor de prijs "Beste oor" en de teller op de tv.
- **Reacties**: 4 emoji's zweven 2 s naast je bordje op de tv; max 1 per 3 s per speler.
- **Bezwaar** geeft iedereen een stem.
- **Live meekijken** naar de schuivende raadselkaart.
- **Match point**: zichtbaar voor iedereen.
- **Pauze**: host tikt "Pauze"; muziek stopt, tv toont "Pauze ☕" en de tussenstand.

### 3.6 Na het einde
1. **Winnaar** (8 s): amber scherm, confetti in de spelerskleuren, naam in 160 px, tijdlijn van de winnaar, fanfare 3 s. Telefoon van de winnaar: kroon, "Jij bent de Tune Master!", trilt 3×.
2. **Eindoverzicht** (blijft staan): ranglijst en 4 prijzen: *Beste oor* (meeste meegokken goed), *Meesterdief* (meeste gelukte steals), *Tijdreiziger* (oudste goed geplaatste kaart), *Bijna!* (fout met het kleinste jaarverschil).
3. Host: **"Nog een potje"** (zelfde spelers, nieuwe startkaarten, gespeelde nummers komen pas terug als de rest op is) of **"Terug naar lobby"**. Telefoons blijven verbonden.

---

## 4. Uiterlijk en gevoel

### 4.1 Visuele identiteit
**Naam en logo.** "Tune Timeline", geschreven als **TUNE·TIMELINE** in zware hoofdletters. Beeldmerk: een horizontale lijn met vijf stippen (de tijdlijn); de middelste stip is groter en amber en de lijn golft eromheen als een geluidsgolf. Geen QR-blokjes, geen neon, geen platenhoes, niets van Hitster. Het woord "Hitster" komt **nergens** in de interface voor.

**Sfeer "nachtradio".** Donker en warm, met crèmekleurige "concertkaartjes". Rustige achtergrond; felle kleur alleen voor wat er nú toe doet.

**Kleurpalet**
| Rol | Naam | Hex |
|---|---|---|
| Achtergrond | Nacht | `#120E24` |
| Paneel | Pruim | `#1E1838` |
| Paneel licht | Pruim licht | `#2A2350` |
| Lijnen | Schemer | `#3A3266` |
| Tekst | Crème | `#F6F1E7` |
| Tekst gedempt | Lavendelgrijs | `#A99FC9` |
| Kaartpapier | Kaartje | `#F4EBDD` |
| Kaartinkt | Inkt | `#1A1530` |
| Aan de beurt / focus / tokens | Amber | `#FFB23F` |
| Goed | Mint | `#34E08F` |
| Fout | Signaalrood | `#FF4D5E` |
| Stelen | Violet | `#7A5CFF` |
| Waarschuwing (strook) | Geel | `#FFD23F` |

**Decenniumband:** `≤1959 #9A8C7A` · `60s #E9A23B` · `70s #D9653B` · `80s #E0457B` · `90s #7A5CFF` · `00s #2FA7E0` · `10s #20BFA0` · `20s #8BCF3F`. Een raadselkaart toont nooit een decenniumkleur.

**Spelerskleuren (10):** Zon `#FFD23F` · Mandarijn `#FF8C42` · Framboos `#FF4F8B` · Orchidee `#E07BFF` · Kobalt `#4D7CFF` · Hemel `#3BC9F5` · Turkoois `#2ED3B7` · Limoen `#A6E35A` · Zalm `#FFAD9E` · Zilver `#C9CED8`. Elke speler heeft ook een **letter-avatar** (eerste letter; bij dubbele beginletters de eerste twee letters), zodat kleur nooit het enige kenmerk is.

**Lettertype.** **Space Grotesk** (open licentie) meegeleverd in de site voor koppen, jaartallen en cijfers (600–700); systeemletter (`system-ui`) voor lopende tekst. Cijfers altijd `tabular-nums`. De mockup gebruikt alleen systeemletters.

**Vormtaal.** Afgeronde hoeken (kaarten 14 px tv / 12 px telefoon, knoppen 18 px, pillen rond), dikke lijnen (3 px), cirkels voor spelers en tokens. Tokens: amber munten met een lichte glans. Schaduw alleen onder kaarten.

**Kaartontwerp**
- **Muziekkaart (open):** crème kaartje 3:4 (tv 200×266 px; bij 7+ kaarten 150×200, bij 10 spelers-steelvenster 140×200), bovenaan een decenniumband (18% van de hoogte, met "80s"), twee halve inkepingen aan de zijkanten, in het midden het **jaartal** (68 px; klein 50 px; nooit < 48 px), daaronder titel (max 2 regels, dan "…") en artiest in gedempte inkt. Geen albumhoes.
- **Raadselkaart:** zelfde vorm, nachtkleurig `#2A2350`, violet-amber rand die pulseert (1,6 s), vijf bewegende equalizerstaafjes en een groot "?".
- **Omgedraaide kaart:** muziekkaart met mint rand (goed) of rode rand + diagonale streep (fout).
- **Flip:** 3D-draai om de verticale as, 700 ms, `cubic-bezier(.2,.8,.2,1)`; halverwege wisselt de voorkant en is de kaart 12% groter.

### 4.2 Geluid en animatie
Alle effecten worden in de browser van de tv gemaakt (Web Audio): geen geluidsbestanden. Telefoons maken geen geluid; ze trillen (Android) en kleuren (iPhone en Android).

| Moment | Geluid | Animatie | Duur |
|---|---|---|---|
| Speler komt binnen | "plop" (660 Hz) | bordje schaalt 0 → 1 met kleine stuiter | 300 ms |
| Beurtstart | 2 tonen omhoog | tijdlijn schuift naar het midden | 500 ms |
| Raadselkaart verschuift | zachte tik | kaart glijdt naar het gat, buren schuiven | 180 ms |
| Vastzetten | "klak" | stempel "VASTGEZET" | 300 ms |
| Steelvenster open | korte opwaartse toon | violette gloed aan de randen, ring loopt leeg | 10 s |
| Laatste 3 s van een timer | zachte tik per seconde | cijfer pulseert | 3 × 200 ms |
| Steal geplaatst | "zwoesj" | fiche valt in het gat | 250 ms |
| Onthulling | trommelroffel | — | 1,2 s |
| Flip | "swish" | zie kaartontwerp | 700 ms |
| Goed | majeur-akkoord (3 tonen) | mint gloed, "+1" stijgt op | 900 ms |
| Fout | lage zoem | kaart schudt 2× en zakt weg | 600 ms |
| Gestolen | "kassa"-klank | kaart vliegt in een boog naar het bordje van de steler | 800 ms |
| Token erbij/eraf | "ting" | munt rolt naar/van het bordje, "+1"/"−1" | 500 ms |
| Match point | lage puls | rode vlag "MATCH POINT" op het bordje | blijvend |
| Winnaar | fanfare | confetti 4 s, naam schaalt in | 8 s |

Muziekvolume: tijdens de onthulling 30%, daarna 100%, aan het eind van de beurt 2 s fade-out. Staat op de pc "minder beweging" aan, dan worden vlieg- en schuifanimaties korte fades.

### 4.3 Tv-schermen (1920×1080)
Vaste indeling tijdens het spel:
- **Bovenbalk** (±180 px): alle spelers als bordjes naast elkaar (240 px breed bij ≤ 6 spelers, 184 px bij 7–10). Per bordje: letter-avatar 44 px, naam 26 px (max 10 tekens, anders "…"), kaartenaantal 38 px ("6/10"), tokens als één munt + getal (30 px), daaronder 10 streepjes in de spelerskleur. Actieve speler: amber rand en 8 px hoger. Offline: 45% doorzichtig met 📶✕.
- **Midden**: fasetitel (84–110 px) + subregel (34 px), timerring rechtsboven (170 px), de grote tijdlijn van de actieve speler.
- **Onderbalk** (110 px): fase + subregel links, voortgangsbalk midden, rechts "Instappen?" + code (40 px) + mini-QR (120 px).

| Toestand | Wat je ziet |
|---|---|
| **Spotify verbinden** | Logo, knop "Verbind Spotify", regel "Alleen de host. Eén keer per avond." (24 px). |
| **Geluid aan** | Grote amber knop "Klik om te beginnen 🔊" + checklist (Spotify-app op telefoon dicht, pc niet laten slapen). |
| **Lobby** | Links logo, QR 420 px op crème, "Scan of ga naar **tune-timeline.vercel.app**", code **KWPX** (108 px, amber). Rechts aantal spelers (110 px), 10 stoelen in 2 rijen van 5 in speelvolgorde, onderaan pillen: niveau, doel, plaatstimer, geschatte speelduur. |
| **Uitleg** | 4 blokken naast elkaar: Luister · Leg 'm neer · Steel! · 10 wint. Kop 44 px, tekst 30 px. Onderaan "Shazam = je bent af". |
| **Startkaarten** | Kaarten vliegen naar de bordjes; "Oudste kaart: Mila (1967). Mila begint!" |
| **Beurtstart** | Naam 110 px in spelerskleur + "is aan de beurt" (44 px), tijdlijn, "Muziek start over 6 · Daan kan eerst een kaart kopen". |
| **Nummer speelt** | "Luister…" + "Daan kiest een plek · meegokkers: 2"; raadselkaart zweeft boven de tijdlijn; ring 45. |
| **Plaatsen (live)** | Raadselkaart in het gekozen gat met amber label "Daan legt hier"; regel "Tussen 1985 en 1991? · Meegokkers: 3 · titel + artiest geclaimd 🎤". |
| **Steelvenster** | Violette gloed aan de randen, "Wie steelt?" (96 px, lichtviolet), ring 10 (violet). Vrije gaten violet gestippeld; geclaimde gaten met letter-avatar + naam. Regel "Stelen: Mila (1967–1985) · Sanne (na 2004) · Josse past". |
| **Onthulling goed** | Flip, mint rand, "GOED!" (96 px mint), "Daan houdt de kaart · 5 van 10", vlag "+1 kaart". |
| **Onthulling mis** | Rode rand + streep, "MIS!", "Dit nummer is uit 1979 en hoorde tussen 1967 en 1985 · niemand stal goed", kaart valt weg. |
| **Steal-resultaat** | "GESTOLEN DOOR MILA!" in Mila's kleur, kaart vliegt naar haar bordje; vlaggen "+1 kaart" en bij mislukte stelers "−1 token". |
| **Bezwaar** | "Had Daan titel + artiest goed?" + wat hij zei + de kaart + "Bezwaren: 0 van 3 · 2 nodig" + "Geen bezwaar = +1 token voor Daan". |
| **Tokens** | Overslaan: strook 2 s "Daan slaat dit nummer over (−1 token)". Kopen: "Josse koopt een kaart" + de gekochte kaart met mint rand in zijn tijdlijn, vlag "−3 tokens", "het nummer voor deze beurt start over 3". Verdienen: munt rolt naar het bordje. "Max 5" als je vol zit. |
| **Tussenstand** | 6 s na elke ronde: **2×5 raster**, per speler plaats, avatar, naam, "6/10 · ●3" en de jaartallen als mini-kaartjes ('64 '72 …) met decenniumband. Leider amber omrand. |
| **Winnaar** | Amber achtergrond, confetti, kroon, "Mila wint!" (160 px), tijdlijn van 10 kaarten, prijzen + "Nog een potje?". |
| **Pauze** | "Pauze ☕" + tussenstand, muziek uit. |
| **Nummer speelt niet** | Gele strook 4 s "⚠ Dit nummer wil niet. We pakken een ander. Niemand verliest iets." |
| **Spotify weg** | Scherm 60% donker, kaart: "Spotify is even weg. Bezig met opnieuw verbinden… (3)". Na 3 pogingen: "Opnieuw verbinden" en "Gebruik de Spotify-app op deze pc". |
| **Speler offline** | Bordje doorzichtig + 📶✕. Bij zijn beurt: "Sanne is even offline" + "Wachten op Sanne… 20 · daarna slaan we haar beurt over". |
| **Realtime/internet weg** | Kaart: "Geen verbinding met de spelers. Bezig…". Spel staat stil, er gaat niets verloren. |
| **Tweede tv** | "Er is al een tv actief voor deze kamer." |

### 4.4 Telefoonschermen (390×844, staand)
Vaste indeling: **bovenbalk 56 px** (avatar, naam, "6/10", munten; host ook een tandwiel ⚙︎), **inhoud**, **actiebalk onderaan** met de hoofdknop (64 px hoog) binnen bereik van de duim.

| Toestand | Wat je ziet |
|---|---|
| **Aanmelden** | Via QR al ingevuld. Anders 4 grote vakjes (alleen hoofdletters, zonder 0/O/1/I) + "Verder". |
| **Naam en kleur** | Veld "Hoe heet je?" (max 10 tekens), 10 kleurrondjes van 56 px (bezet = doorgestreept), "Ik doe mee". Bestaande naam? Knop "Ik speelde al" (lege accu, 2.9). |
| **Wachten** | "Je zit erin, Josse!", lijst van spelers, 4 reactieknoppen. |
| **Uitleg** | De 4 stappen als lijst + "Begrepen". |
| **Andermans beurt / meegokken** | "Daan is aan de beurt" + zijn tijdlijn; tik een gat = "jouw gok" (gele stippelrand). Reactieknoppen onderaan. |
| **Jouw beurt: start** | Volledig amber: "Jij bent!", trilt 2×, balk 6 s, "▶ Start nummer", "Kaart kopen · 3 tokens" (violet als het kan, anders grijs met uitleg). |
| **Jouw beurt: plaatsen** | "Waar hoort dit nummer?" + ring (45). Verticale tijdlijn, oud boven; gaten 52 px hoog met "hier?". Tik = raadselkaart "Dit nummer" in dat gat. Boven de knoppen het schuifje "🎤 Ik noem titel + artiest". Knoppen "Overslaan · 1" (40%) en "Vastzetten" (60%, grijs tot een plek gekozen is). |
| **Vastgezet** | "Vastgezet ✓ Tussen 1985 en 1991. Nu duimen…" + binnenkomende steelfiches. |
| **Stelen** | Trilt 1× lang, violette rand, "STEEL? Kies de goede plek · nog 6 s · kost 1 token" + balk. De tijdlijn van de ander staat direct open: vrije gaten violet ("vrij · 1991 – 2004"), zijn plek amber "🔒 Daan legde hier" (niet tikbaar), bezette gaten grijs ("bezet door Sanne"). Tik een gat → "✓ jij: 1967 – 1985". Knoppen "Pas" en "STEEL hier · 1 token". |
| **Resultaat** | "GOED! +1 kaart" (mint), "MIS!" (rood, met waar hij hoorde), "Jij stal 'm! 🎉" (in je kleur) of "Token kwijt" + de kaart. |
| **Bezwaar** | "Had Daan het goed?" + wat hij zei + "Alleen tikken als het fout was. Niets doen = goed." + balk + "Klopt" / grote rode "Fout!". |
| **Tokens** | Tik op de bovenbalk: uitleg van de 4 token-acties + je eigen tijdlijn. Bij verandering springt de munt met "+1"/"−1". |
| **Tussenstand** | Je plek, wie er volgt, over hoeveel beurten jij bent, top 6. |
| **Winnaar** | Winnaar: amber, kroon, "Jij bent de Tune Master!". Anderen: "Mila wint!" + je plek en eventuele prijs. |
| **Verbinding kwijt** | Rode strook "Verbinding kwijt, bezig…", knoppen grijs. Na herstel groene strook "Terug!" 1,5 s. |
| **Te laat / bezet** | Melding onderaan: "Te laat, het venster is dicht. Je token blijft van jou." of "Net bezet door Mila, kies een andere plek". |
| **Hostmenu** | Pauze · Beurt van [naam] overslaan · Uitslag omdraaien · Nummer opnieuw starten · Tussenstand op tv · Speler verwijderen… · Instellingen (alleen in de lobby) · Spel stoppen. |

### 4.5 Tv met 8–10 spelers
- Bovenbalk: 10 bordjes van 184 px (10 × 184 + 9 × 8 = 1912 px).
- Alleen de tijdlijn van de **actieve** speler is groot. Van de anderen zie je het kaartenaantal (38 px) en de streepjes. Alle tijdlijnen samen staan in de tussenstand (2×5).
- Tot 6 kaarten zijn kaarten 200 px breed; vanaf 7 kaarten 150 px; in het steelvenster met 10+ elementen 140 px met smallere steelgaten (40 px). Het jaartal blijft ≥ 48 px.
- Er knippert nooit meer dan één ding tegelijk.

### 4.6 Leesbaarheid en bediening
- **Tv:** kleinste tekst 24 px (alleen "Instappen?"), gewone tekst 28–36 px, namen 26 px, jaartallen 48–68 px, fasetitels 72–110 px. Contrast crème op nacht > 15:1. Gecontroleerd met screenshots op 1920×1080.
- **Telefoon:** tekst ≥ 17 px, labels ≥ 15 px, tikdoelen ≥ 48×48 px (gaten 52 px hoog), hoofdknop 64 px onderaan. Belangrijke knoppen nooit bovenaan. Geen vegen als enige manier: alles is tikken. Apple adviseert 44 pt, WCAG 2.2 minimaal 24 px [B26][B27]; wij kiezen ruimer.

---

## 5. Interactiedetails

### 5.1 Een kaart plaatsen
1. Verticale tijdlijn, oudste boven. Bij veel kaarten scrol je; na een tik scrolt het scherm naar je keuze.
2. Tik een gat: de raadselkaart schuift er in 180 ms in, korte tik-trilling (10 ms, Android). De tv volgt binnen ±0,3 s.
3. Tik een ander gat om te wisselen; tik de raadselkaart om hem weg te halen.
4. "Vastzetten" wordt amber. Eén tik = vast, niet terug te draaien. De tweestaps-aanpak (eerst gat, dan knop) voorkomt fouten tijdens het scrollen.
5. Tikken, niet slepen: werkt met één hand en een glas in de andere.

### 5.2 Stelen
- **Wie:** iedereen behalve de actieve speler, met ≥ 1 token, online, nog niet gestolen deze beurt.
- **Wanneer:** direct na het vastzetten, 10 s.
- **Hoe (2 tikken):** de telefoon springt zelf naar de steelweergave met de tijdlijn open. Tik een vrij gat, dan "STEEL hier · 1 token". Of "Pas".
- **Volgorde:** de tv bewaart per gat wie het eerst binnenkwam. Een gat is pas van jou na "STEEL hier", niet bij het selecteren.
- **Zichtbaar:** fiches met naam verschijnen live op tv en telefoons.

### 5.3 Timers en trillen
| Moment | Android (`navigator.vibrate`) | iPhone (geen trillen via browser [B28]) |
|---|---|---|
| Jouw beurt | 2× 150 ms | 1 s volledig amber scherm |
| Nog 10 s plaatsen | 1× 80 ms | timer wordt rood |
| Steelvenster open (anderen) | 1× 300 ms | violette rand |
| Kaart gewonnen / gestolen | 3× 80 ms | resultaatscherm |
| Gat tikken | 10 ms | raadselkaart schuift |

### 5.4 Dubbel en te laat tikken
- Elke knop wordt na de eerste tik direct grijs met "Bezig…" tot de tv antwoordt (max 3 s; daarna weer actief).
- Elk bericht heeft een uniek `actieId`; de tv verwerkt elk ID één keer.
- Te laat binnen: genegeerd, "Te laat"-melding, niets afgeschreven.
- "STEEL hier" op een net bezet gat: "Net bezet door Mila", token blijft, opnieuw kiezen kan zolang het venster open is.

### 5.5 Scherm aan houden
Na "Ik doe mee" vraagt de pagina de Screen Wake Lock aan (iOS vanaf 16.4 [B29]) en opnieuw zodra de pagina weer zichtbaar wordt. Advies in de uitleg: niet op het beginscherm zetten, gewoon in Safari/Chrome spelen.

---

## 6. Muziek en data

### 6.1 De Spotify-playlist
- De officiële Hitster-playlists staan op Spotify (de Hitster-FAQ linkt ernaar).
- Sinds februari 2026 geeft de API de nummers van een playlist **alleen als je eigenaar of samenwerker bent** [B10]. Daarom: in de Spotify-app de gekozen playlist openen, alles selecteren (Ctrl/Cmd+A), "Toevoegen aan playlist" → "Nieuwe playlist" **"Tune Timeline – bron"**. Die kopie is van jou.
- Het playlist-ID (het stuk na `/playlist/` in de link) is geen geheim en gaat in `.env.local` als `SPOTIFY_PLAYLIST_ID`.

### 6.2 Afspelen
**Standaard: Spotify Web Playback SDK op de tv-pagina.** De pagina wordt een Spotify-apparaat "Tune Timeline TV". Afspelen gaat via de Web API ("speel dit nummer op dat apparaat"). Vereist Premium [B13]. Scopes [B14]: de site vraagt `streaming`, `user-read-email`, `user-read-private`, `user-read-playback-state`, `user-modify-playback-state`; het voorbereidingsscript vraagt `playlist-read-private` en `playlist-read-collaborative`. De klik op "Klik om te beginnen" roept `activateElement()` aan; de SDK meldt `autoplay_failed` als de browser toch blokkeert [B15], dan verschijnt "Klik om muziek te hervatten".

Bouwregels: precies **één** speler per pagina (meerdere spelers per pagina gaven in 2026 een speler die nooit "ready" werd [B16]); wachten op "ready" met een limiet van 15 s; na "ready" 1 s wachten vóór het eerste afspelen. Tv-pc: **Chrome of Edge**, geen adblocker op die pagina.

**Terugvaloptie: Spotify-app op de pc.** Lukt de SDK niet binnen 15 s, dan biedt de tv aan: "Gebruik de Spotify-app op deze pc". De host opent de desktop-app, minimaliseert hem, en de tv stuurt die app aan via de Web API (Spotify Connect, apparaat kiezen uit `GET /me/player/devices`).

**Start van het nummer:** op 0:00; per nummer kan in `songs.json` een `startMs` staan (lange stille intro).

**Spoilers via Spotify zelf:** de Spotify-app op de telefoon van de host (en elk ander apparaat op dat account) kan tonen wat er speelt. Checklist: die app volledig afsluiten.

### 6.3 Het oorspronkelijke jaar bepalen
Spotify geeft de datum van het **album**; staat een nummer op een verzamelalbum of remaster, dan klopt het jaar niet. Het voorbereidingsscript (lokaal, eenmalig) doet:
1. **Spotify:** eigen playlist ophalen via `GET /playlists/{id}/items?market=NL`: ID, titel, artiesten, duur, albumdatum, ISRC (`external_ids.isrc`, in maart 2026 teruggezet [B11]) en `is_playable`. Bij "track relinking" het speelbare ID bewaren.
2. **MusicBrainz:** `GET /ws/2/isrc/{isrc}?inc=artist-credits&fmt=json` → vroegste `first-release-date` van de opnames. Geen treffer: zoeken op opgeschoonde artiest + titel (zonder "- 2011 Remaster", "(Radio Edit)"), alleen treffers met dezelfde artiest en een duur die ≤ 10 s afwijkt, geen live-versies of covers. Max **1 verzoek per seconde** en een User-Agent met contactgegevens [B17]. ±300 nummers ≈ 10 minuten.
3. **Beslisregel:**
   - Spotify en MusicBrainz gelijk of 1 jaar verschil: vroegste nemen → `ok`.
   - MusicBrainz eerder (typisch verzamelalbum): MusicBrainz → `ok-mb`.
   - MusicBrainz later dan Spotify, of > 15 jaar eerder, of geen gegevens: → `controleren`.
4. **Correctielijst** `data/corrections.csv` (kolommen `spotifyId;year;note`, ook `startMs` optioneel): wint altijd. De host loopt de `controleren`-nummers na via Wikipedia/Discogs (verwachting 30–60 van 300, schatting). Heb je echte Hitster-kaarten: het jaartal op de kaart wint.

Er is **geen openbare, betrouwbare lijst** met alle Hitster-kaarten en hun jaartallen gevonden; die laag komt uit eigen controle.

### 6.4 Niet-afspeelbare nummers
- **Vooraf:** `is_playable: false` → apart rapport `data/rapport.md` met wat eruit is gehaald. `available_markets` bestaat niet meer [B10]; `is_playable` is niet altijd juist, dus ook tijdens het spel controleren.
- **Tijdens het spel:** na 6 s geen "speelt"-signaal (positie > 0) → volgend nummer, geen straf, ID op een lokale "speelt niet"-lijst.

### 6.5 `songs.json`
Per nummer: `id`, `uri`, `title`, `artist`, `year`, `yearSource` (`spotify` / `musicbrainz` / `correctie`), `status`, `startMs` (optioneel), `durationMs`. Geen albumhoezen. Het bestand wordt **alleen door de tv-pagina** opgehaald (op het moment dat `/tv` laadt), niet meegebundeld in de telefooncode.

---

## 7. Technisch concept op hoofdlijnen

### 7.1 Onderdelen
| Onderdeel | Keuze |
|---|---|
| Website | Eén statische site: **Vite + React + TypeScript**, op Vercel Hobby. Routes: `/` (kies tv of speler), `/tv`, `/speel` en `/speel/KWPX#<kanaalgeheim>` (uit de QR), `/callback` (Spotify-inlog). Een `vercel.json` stuurt alle routes naar `index.html`. Geen eigen server. |
| Spelregels | Losse, pure TypeScript-module (`src/game/`) zonder scherm, met eenheidstests (Vitest). |
| Realtime | Supabase Realtime in het bestaande project, alleen **Broadcast** en **Presence**, geen tabellen, geen opslag. |
| Muziek | Spotify Web API + Web Playback SDK, inloggen met **Authorization Code + PKCE** (geen geheim in de browser). |
| Data | `public/songs.json` (alleen door `/tv` opgehaald), gemaakt door `scripts/build-songs.ts`. |

### 7.2 De tv is de baas
- De tv-pagina houdt de **volledige spelstatus** bij (spelers, tijdlijnen, tokens, stapel, fase, timers) en is de enige die regels toepast. Alle timers lopen op de klok van de tv.
- Telefoons sturen alleen **intenties**: `hello`, `join`, `pickSlot`, `lock`, `claimToggle`, `skip`, `buy`, `startSong`, `steal`, `pass`, `objection`, `guess`, `react`, `yearPick` (Expert), en host-acties (`pause`, `skipTurn`, `removePlayer`, `flipVerdict`, `restartSong`, `showStandings`, `settings`, `start`, `rematch`).
- De tv controleert elke intentie (juiste fase, juiste speler, genoeg tokens, juist geheim), past hem toe en stuurt een nieuwe **publieke status** met een oplopend versienummer. Telefoons negeren een status met een lager versienummer.

### 7.3 Realtime-opzet
- Kanaal per spel: `tt:<CODE>:<kanaalgeheim van 6 tekens>`. Het kanaalgeheim staat in de QR-link (na `#`, zodat het niet in serverlogboeken komt). Wie de code met de hand typt, vraagt het geheim op via een tussenkanaal `tt:<CODE>:lobby` dat alleen tijdens de lobby open is.
- **Presence**: elke telefoon meldt één keer `{spelerId}` bij het verbinden (Presence is beperkt tot 5 aanroepen per client per 30 s en 20 berichten/s [B21]); de tv ziet zo wie online is.
- **Broadcast tv → allen**: `state` (publieke status, ±2–5 kB) bij elke wijziging, bij live plaatsen hooguit 4× per seconde.
- **Broadcast telefoon → tv**: intenties met `spelerId`, `spelerGeheim`, `actieId`.
- **Spelersgeheim**: bij aanmelden maakt de telefoon een willekeurig geheim (in `localStorage`). De tv onthoudt welk geheim bij welke speler hoort en accepteert alleen intenties met het juiste geheim. Het geheim staat nooit in de publieke status.
- **Limieten Free-plan** [B21][B22]: 200 verbindingen, 100 berichten/s, 256 kB per bericht, 2 miljoen berichten per maand; een broadcast naar N ontvangers telt als N + 1. Een spel heeft 11 verbindingen; ±4 statussen/s × 12 = ±48 berichten/s op het drukste moment; ±65–120 duizend berichten per avond. Dit quotum deel je met de studiewebsite.
- **Openbaar kanaal**: Supabase raadt privékanalen met databaseregels aan [B23], maar dat vraagt tabellen. Voor een privéavond is een openbaar kanaal met geheime naam + spelersgeheim acceptabel. De Realtime-instelling **"Allow public access"** moet aan staan.
- **Sleutel**: de **publishable key** (`sb_publishable_…`), de opvolger van de anon key, die eind 2026 verdwijnt [B24]. Veilig in de browser.

### 7.4 Geen spoilers op telefoons
- De publieke status bevat tijdens een beurt alleen: wie aan de beurt is, de jaartallen/titels van de **al open** kaarten, de gekozen plek (index), steelfiches, timers.
- Titel, artiest, jaar en Spotify-ID van het lopende nummer staan alleen in het geheugen van de tv en gaan pas bij de onthulling in de status.
- Telefoons laden `songs.json` niet. Shazam blijft mogelijk; huisregel "Shazam = je bent af".

### 7.5 Herverbinden en opslaan
- **Telefoon:** `spelerId`, `spelerGeheim`, code en kanaalgeheim in `localStorage`. Bij terugkeer (scherm aan, netwerkwissel, herladen) verbindt de pagina opnieuw en stuurt `hello`; de tv antwoordt met de volledige status. iPhones verbreken websockets op de achtergrond vaak stil; daarom bij `visibilitychange` → zichtbaar altijd opnieuw abonneren.
- **Tv:** volledige status (inclusief stapel en geheimen) na elke wijziging in `localStorage`. Bij herladen: status terugzetten, zelfde kanaal openen, Spotify opnieuw verbinden, één klik "Muziek hervatten", nummer opnieuw vanaf het begin.
- **Tweede tv:** de tv stuurt elke 5 s een `tvHeartbeat` met een tv-ID; een tweede tv-pagina voor dezelfde code ziet die en toont "Er is al een tv actief".
- **Spotify-token** (1 uur geldig): elke 45 minuten stil vernieuwen met het refresh token.

### 7.6 Environment variables
| Naam | Waar vandaan | Waar gebruikt | Geheim? |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Supabase-dashboard → Project Settings → Data API / API: Project URL | site | nee |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase-dashboard → Project Settings → API Keys: Publishable key (`sb_publishable_…`) | site | nee (publiek bedoeld) |
| `VITE_SPOTIFY_CLIENT_ID` | Spotify Developer Dashboard → je app → Basic Information: Client ID | site + script | nee |
| `SPOTIFY_PLAYLIST_ID` | link van je eigen bron-playlist | alleen het voorbereidingsscript (lokaal) | nee |
| `MUSICBRAINZ_CONTACT` | je e-mailadres, voor de User-Agent | alleen het script (lokaal) | privé, niet in de repo |

Er is **geen** Spotify Client Secret en **geen** Supabase secret key nodig. De redirect-URI wordt in de code afgeleid van het adres (`window.location.origin + '/callback'`).

### 7.7 Wat bewust níet gebouwd wordt
Geen database, geen tabellen, geen accounts, geen eigen server, geen opslag buiten de pc en de telefoons.

---

## 8. Risico's en oplossingen

### 8.1 Spotify-regels
De Spotify Developer Policy zegt: "Do not create a game, including trivia quizzes", en vraagt bij afspelen hoes en metadata te tonen [B20]. Dit spel doet beide niet. Gevolg in het ergste geval: Spotify blokkeert je Client ID. Het gaat om een niet-commerciële privéavond met je eigen Premium, maar het valt buiten hun regels. Dit is jouw beslissing (`BESLISSINGEN.md` B1). Alternatief zonder koppeling: "DJ-modus" waarin de tv het volgende nummer niet afspeelt maar een vrijwillige DJ het op zijn eigen Spotify zet (later, hoofdstuk 10).

### 8.2 Overige risico's
| Wat kan misgaan | Oplossing |
|---|---|
| Web Playback SDK wordt niet "ready" | Eén speler per pagina, 15 s limiet, terugvaloptie Spotify-app op de pc. Proefbeurt de dag ervoor. |
| Development Mode: max 5 gebruikers | Alleen de host logt in; hij staat op de lijst. |
| Host-telefoon toont wat er speelt | Spotify-app op die telefoon afsluiten (checklist op het "Geluid aan"-scherm). |
| Spotify-token verloopt | Elke 45 min vernieuwen; lukt dat niet: spel pauzeert met "Opnieuw inloggen", status blijft bewaard. |
| Nummer niet afspeelbaar | Vooraf filteren; tijdens het spel na 6 s automatisch volgende. |
| Verkeerd jaartal → ruzie | Jaarbepaling + controlelijst; regel "het jaar op de kaart telt"; host kan een uitslag omdraaien. |
| Supabase-project gepauzeerd (7 dagen weinig activiteit [B25]) | Dag ervoor het dashboard openen; de tv toont "Realtime niet bereikbaar" als het niet lukt. |
| Supabase legacy anon key verdwijnt eind 2026 | Meteen de publishable key gebruiken. |
| "Allow public access" staat uit | Controlepunt in `VOORBEREIDING.md`; anders melding "Kanaal geweigerd". |
| Wifi hapert / 4G-wissel | Automatisch herverbinden; de tv mist niets. Gasten mogen 4G gebruiken. |
| Telefoon valt in slaap | Wake Lock + herverbinden bij terugkeer. |
| Lege accu | "Ik speelde al" op een andere telefoon; host bevestigt. |
| Laptop van de tv gaat slapen | Energie-instelling op "nooit"; checklist. |
| Iemand loopt weg tijdens zijn beurt | 20 s wachten, dan overslaan; host kan direct overslaan. |
| Tegelijk stelen / dubbele tikken | Ontvangstvolgorde, `actieId`, knoppen direct grijs. |
| Tv ververst per ongeluk | Status in `localStorage`. |
| Tweede tv-pagina | Heartbeat; tweede tv toont melding. |
| Iemand anders probeert in het kanaal | Geheime kanaalnaam + spelersgeheim. |
| Valsspelen met Shazam | Huisregel. |
| Partij te lang | Speelduur in lobby, advies doel 8. |
| Tv onleesbaar op 3 m | Minimale maten, gecontroleerd in de mockup. |
| Browser blokkeert geluid | "Klik om te beginnen" + `activateElement()` + `autoplay_failed`. |
| Kleurenblinde spelers | Letter-avatar en ✓/✕ naast elke kleur. |

---

## 9. Keuzes en aannames

### 9.1 Keuzes (met alternatief)
| Keuze | Alternatief | Waarom |
|---|---|---|
| Stelen pas ná het vastzetten | Stelen tijdens het plaatsen (eerste schets) | Zo werkt het aan tafel; de actieve speler kan zich anders aanpassen aan de stelers. |
| Steelvenster 10 s + "Pas" | 8 s (Antigravity), 10 s met verlenging (Opus) | Tijd genoeg om de telefoon te pakken, simpel uit te leggen; "Pas" houdt het tempo. |
| Steelflow in 2 tikken, tijdlijn direct open | Eerst een grote knop, dan gat, dan bevestigen | Sneller in een spel waar snelheid telt; nog steeds een bevestiging tegen per ongeluk tikken. |
| Kopen bij beurtstart, beurt gaat door | Kopen kost je beurt (Opus/VS-regels); kopen op elk moment (NL-regels) | Volgt de NL-regels (geen beurtverlies); de beperking tot de beurtstart voorkomt verstoringen midden in andermans beurt. |
| Bezwaarsysteem (groep) | Volgende speler als scheidsrechter; host beslist | Het echte spel laat de groep beslissen; meestal hoeft niemand te tikken. |
| Plaatstimer 45 s | 60 s; geen timer | Met 10 spelers is wachten het grootste probleem; instelbaar. |
| Beurtstart 6 s met "Start nummer" | 4 s vast; 8 s | Genoeg om te kopen, speler kan zelf versnellen. |
| Startkaart telt mee | Telt niet mee | Hij ligt in de tijdlijn; de regels zeggen niets anders. |
| Startjaren uniek, 1960–2015 | Willekeurig | Eerlijker. |
| Volgorde van binnenkomst | Loting | Lijkt op met de klok mee. |
| Max 1 steal per speler per beurt | Onbeperkt | Zoals aan tafel. |
| Twee goede stelers: eerste wint, ander token terug | Beide token kwijt | De tweede zat niet fout. |
| Stapel op → opnieuw schudden | Meeste kaarten wint | Spel gaat gewoon door. |
| Geen "Oeps, terug" na vastzetten | 1,5 s terugknop (Opus) | Tweestaps-plaatsen is al genoeg bescherming; scheelt een toestand. |
| Tussenstand 2×5 met mini-jaartallen na elke ronde | Balkjes elke 10 nummers | Iedereen ziet zijn eigen tijdlijn terug; past op 3 m. |
| Telefoon-tijdlijn verticaal | Horizontaal | Duimvriendelijk, ruimte voor 10+ kaarten. |
| Host speelt mee, hostmenu op telefoon | Host achter de pc | De host zit tussen de vrienden. |
| Vite + React + TypeScript | Next.js | Geen server nodig. |
| Web Playback SDK + terugval Spotify-app | Alleen SDK | SDK is grillig. |
| Playlist kopiëren naar eigen playlist | Direct inlezen | Kan niet meer sinds februari 2026. |
| Openbaar kanaal met geheime naam | Privékanalen met databaseregels | Geen tabellen toegestaan. |
| Publishable key | Anon key (opdracht) | Anon key verdwijnt eind 2026; zelfde rechten. |
| `corrections.csv` | `overrides.json` | Makkelijker in een spreadsheet. |
| Geen albumhoezen | Hoezen bij onthulling | Geen beschermd beeld; kaartje is leesbaarder. |
| Geluid zelf gemaakt (Web Audio) | Geluidsbestanden | Geen rechten, klein. |
| Woord "STEEL" i.p.v. "HITSTER!" | De roep uit het echte spel | Geen merknaam in de interface. |
| Stijl "nachtradio" met crème kaarten | "Midnight Vinyl" met donkere kaarten | Beter leesbaar op 3 m. |
| Moeilijkheidsniveaus pas in fase 3 | Meteen | Eerst het kernspel betrouwbaar. |

### 9.2 Afwijkingen van de eerste schets (`02-ontwerp-online-versie.md`)
- Stelen pas na vastzetten (was: tijdens plaatsen).
- Titel/artiest door de groep via bezwaar (was: host beslist).
- Geen strips van alle tijdlijnen onderaan de tv, wel 2×5-tussenstand na elke ronde.
- Kopen: alleen bij beurtstart, geen beurt overslaan (schets liet dit open).
- Playlist eerst kopiëren (nieuwe Spotify-regel).
- Publishable key in plaats van anon key.
- Geen albumhoes bij de onthulling.

### 9.3 Antwoorden op de open vragen uit de schets
| Vraag | Antwoord |
|---|---|
| Eén playlist of per decennium/genre? | Eén playlist (kopie van de Hitster-playlist). Filter later. |
| Timer per beurt? | Ja, 45 s, instelbaar of uit. |
| Wie beoordeelt titel en artiest? | De groep via bezwaar; host kan omdraaien. |
| Speelt de host mee? | Ja, met eigen telefoon + hostmenu. |
| Teams bij 10 personen? | Later (fase 4); voor nu het advies doel 8. |
| Stijl? | "Nachtradio" (4.1). |

### 9.4 Aannames
- Tv-pc met Chrome of Edge, geluid via de tv.
- Gasten met een moderne smartphone (iOS 16.4+ of recente Android).
- Wifi of 4G/5G in huis.
- ±300 nummers; een avond gebruikt er ±150–250.
- De speelduurschattingen zijn gissingen op basis van een aangenomen trefkans.

---

## 10. Mogelijke uitbreidingen
- **Coöperatief:** één gedeelde tijdlijn, 5 tokens, fout = −1 token, 10 kaarten halen voor de tokens op zijn.
- **Duo-teams:** twee telefoons per team, gedeelde tijdlijn en tokens, eerste tik telt.
- **Niveau per speler:** de muziekkenner op Expert, de rest op Original (bestaat in de Scandinavische regels [B2]).
- **Eerlijke laatste ronde:** winnen pas als iedereen in die ronde geweest is.
- **Decennium- of genrefilter, meerdere playlists** (`songs-*.json`).
- **DJ-modus** zonder Spotify-koppeling (8.1).
- **Refreinmodus:** nummers starten rond 0:45 voor extra tempo.
- **Statistieken** als deelbaar plaatje na afloop.
- **Thema's** (kerst, zomer) in dezelfde vormtaal.

---

## 11. Bronnen
Geraadpleegd op 24 november 2026.

**Spelregels**
- [B1] Hitster Original, spelregels (Nederland): https://hitstergame.com/nl-nl/pages/spelregels-original
- [B2] Hitster Nordics, how to play (3 tokens, Pro/Expert, gelijktijdige claim, jaartaldefinitie): https://nordics.hitstergame.com/sv-en/how-to-play/
- [B3] Hitster, regels VS (kopen en volgende beurt overslaan): https://hitstergame.com/en-us/?p=80391
- [B4] Bol.com, Hitster Original (2–10 spelers, 30 min): https://www.bol.com/nl/nl/p/jumbo-hitster-partyspel-actiespel/9300000101253647/
- [B5] Hitster FAQ met playlistlinks: https://hitstergame.com/en-us/faq-v3/

**Spotify**
- [B10] Web API changelog februari 2026 (`/items`, alleen eigen playlists, verwijderde velden): https://developer.spotify.com/documentation/web-api/references/changes/february-2026
- [B11] Web API changelog maart 2026 (`external_ids` terug): https://developer.spotify.com/documentation/web-api/references/changes/march-2026
- [B12] Update on Developer Access and Platform Security (Premium, 5 gebruikers): https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security
- [B12b] Web API changelog juli 2026 (25 apps, quota per account): https://developer.spotify.com/documentation/web-api/references/changes/july-2026
- [B13] Web Playback SDK (Premium, browsers): https://developer.spotify.com/documentation/web-playback-sdk
- [B14] Scopes: https://developer.spotify.com/documentation/web-api/concepts/scopes
- [B15] Web Playback SDK reference (`activateElement`, `autoplay_failed`): https://developer.spotify.com/documentation/web-playback-sdk/reference
- [B16] GitHub laurentChin/blind-test issue #78 (één speler per pagina, okt 2026): https://github.com/laurentChin/blind-test/issues/78
- [B18] Redirect URI's (`127.0.0.1`, geen `localhost`): https://developer.spotify.com/documentation/web-api/concepts/redirect_uri
- [B19] Authorization Code met PKCE: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
- [B19b] Track relinking: https://developer.spotify.com/documentation/web-api/concepts/track-relinking
- [B20] Spotify Developer Policy (o.a. "Do not create a game"): https://developer.spotify.com/policy

**MusicBrainz**
- [B17] Rate limiting (1 verzoek/s, User-Agent): https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting
- [B17b] API (ISRC-lookup): https://musicbrainz.org/doc/MusicBrainz_API

**Supabase**
- [B21] Realtime limits (bijgewerkt 29 okt 2026): https://supabase.com/docs/guides/realtime/limits
- [B22] Realtime-berichten tellen (N + 1, 2 miljoen Free): https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages
- [B23] Realtime authorization ("Allow public access"): https://supabase.com/docs/guides/realtime/authorization
- [B24] API keys (publishable key, anon key verdwijnt eind 2026): https://supabase.com/docs/guides/api/api-keys
- [B25] Project pausing: https://supabase.com/docs/guides/platform/pausing

**Browser en toegankelijkheid**
- [B26] Apple Human Interface Guidelines, Accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility
- [B27] WCAG 2.2, 2.5.8 Target Size: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- [B28] Can I use: Vibration API: https://caniuse.com/vibration
- [B29] Can I use: Screen Wake Lock: https://caniuse.com/wake-lock

*Niet gevonden / niet zeker:* een officiële lijst van alle Hitster-kaarten met jaartal; of de startkaart officieel meetelt; of Realtime-verkeer telt als activiteit tegen het pauzeren van een Supabase-project; of Spotify een privé-feestspel zou handhaven onder het spelverbod.

---

## 12. Herkomst

| Onderdeel | Opus | Antigravity | Nieuw in v2 |
|---|---|---|---|
| Samenvatting-opbouw | ✓ | | |
| Startopstelling (uniek startjaar, 1960–2015), volgorde van binnenkomst | ✓ | | |
| Startkaart telt mee | ✓ (eerlijk als keuze) | ✓ (ten onrechte "bevestigd") | |
| Stelen na vastzetten, eerste tik wint, max 1 per speler | ✓ | ✓ (deels) | |
| Steelvenster 10 s | ✓ | | sluit eerder via "Pas" (idee Antigravity), zonder verlengregel |
| "Pas"-knop en 2-tikken-steelflow | | ✓ | |
| Twee goede stelers: eerste wint, token terug | ✓ | ✓ | |
| Actieve speler goed → stelers op een andere goede plek verliezen token | | | ✓ (uit NL-regels) |
| Pro: steel op de plek van de actieve speler | | ✓ | |
| Kopen bij beurtstart, beurt gaat door | | ✓ | |
| Overslaan mag vaker, niet onthullen | ✓ | ✓ | |
| Bezwaarsysteem | ✓ | | sluit eerder als iedereen tikte |
| Plaatstimer 45 s | | ✓ (zonder extra 10 s) | |
| Beurtstart met "Start nummer" + 6 s | | ✓ (knop) | 6 s |
| Stapel op → opnieuw schudden | | ✓ | |
| Late instappers, "Ik speelde al" bij lege accu | ✓ | ✓ | |
| Speelduurtabel | ✓ | | herberekend voor 45 s |
| Meegokken via gat tikken + "Beste oor" | ✓ | (slider) | |
| Prijzen eindoverzicht | ✓ | ✓ | |
| Stijl "nachtradio", palet, crème kaarten, logo | ✓ | | |
| Tussenstand 2×5 met mini-jaartallen | | ✓ | in nachtradio-stijl |
| Tv-indeling bovenbalk / midden / onderbalk | ✓ | ✓ | |
| Uitleg op één scherm met 4 blokken | | ✓ | |
| Gat-labels met jaartallen op de telefoon | | ✓ | |
| Geen "HITSTER" in de interface, knop "STEEL" | | | ✓ |
| Geen "Oeps, terug" | | | ✓ |
| Playlist kopiëren, PKCE, SDK, `songs.json` | ✓ | ✓ | |
| Terugvaloptie Spotify-app, spoiler via host-telefoon | ✓ | | |
| `activateElement()`, redirect `127.0.0.1` | | ✓ | |
| Jaarbepaling 3 lagen + `corrections.csv` | ✓ | (ook titelopschoning) | combinatie |
| Geheime kanaalnaam + spelersgeheim | ✓ | | geheim na `#` in de URL |
| `songs.json` niet in telefooncode | | ✓ | |
| Presence alleen bij verbinden | | ✓ (5/30 s) | beide limieten |
| Publishable key, "Allow public access", tweede-tv-heartbeat | | | ✓ |
| Risico Spotify-policy | ✓ | | |
| Niveau per speler (uitbreiding) | | ✓ | |
