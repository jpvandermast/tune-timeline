# Tune Timeline — concept (versie Opus)

*Werknaam: Tune Timeline. Een online feestspel naar het principe van het kaartspel Hitster, met eigen naam en eigen uiterlijk. Opgesteld op 24 november 2026.*

Bronnen staan tussen vierkante haken, bijvoorbeeld [S3], en zijn uitgeschreven in hoofdstuk 11. Waar ik iets niet kon vinden, staat dat er eerlijk bij.

---

## 1. Samenvatting

1. De pc aan de tv is het **centrale bord en de jukebox**: hij speelt via Spotify (Premium van de host) het nummer af en toont tijdlijnen, scores en de onthulling.
2. Iedereen, ook de host, speelt op de **eigen telefoon** via een QR-code of 4-letterige roomcode: geen app, geen account, niets printen.
3. De regels volgen Hitster Original: 1 open startkaart, plaatsen zonder jaartal te zien, **10 kaarten** in je tijdlijn wint, zelfde jaar mag aan beide kanten.
4. Tokens zitten erin zoals in het echte spel: start met 2, max 5; **overslaan** (1), **stelen** (1), **kopen** (3) en **verdienen** (titel + artiest goed).
5. Stelen gaat met een grote **"HITSTER!"-knop** na het vastzetten: 10 seconden, wie het eerst een plek tikt heeft die plek.
6. Of iemand titel en artiest goed had, beslist de groep met een snel **bezwaar-systeem**: geldt als goed, tenzij de helft van de anderen binnen 6 s "Fout!" tikt.
7. Spelers die niet aan de beurt zijn, doen mee via **stelen, stiekem meegokken** (telt niet voor de score, wel voor de prijs "Beste oor") en **reacties** die op de tv verschijnen.
8. Uiterlijk: **"nachtradio"**: diep nachtpaars, crèmekleurige kaarten als concertkaartjes met een gekleurde decenniumband, amber voor "aan de beurt", mint voor goed, rood voor fout, violet voor stelen.
9. Een beurt duurt ongeveer **60–75 seconden**. Met 10 spelers en doel 10 duurt een partij al snel 2 uur, dus de lobby toont een tijdschatting en biedt "Snelle avond" (7 kaarten) of duo-teams aan.
10. De nummerlijst wordt vooraf **eenmalig voorbereid** tot een vast bestand met per nummer het oorspronkelijke jaar (Spotify + MusicBrainz + correctielijst), zodat er tijdens het spel niets misgaat met heruitgave-jaren.
11. Techniek: statische site op Vercel, **Supabase Realtime (alleen Broadcast + Presence)** in het bestaande project, de tv is de enige bron van waarheid en telefoons krijgen het antwoord pas bij de onthulling.
12. Grootste risico's: de Spotify-ontwikkelaarsregels (spellen zijn daar officieel niet toegestaan, zie 8.1) en de grillige Web Playback SDK. Daarom is er een terugvaloptie via de Spotify-app op de pc.

---

## 2. Spelregels (definitief)

Legenda: **[ECHT]** = komt uit het echte spel. **[ONLINE]** = aanpassing voor de online versie. **[KEUZE]** = de echte regels verschillen per land of zeggen het niet, en ik heb gekozen.

### 2.1 Spelers en voorbereiding
| Regel | Bron |
|---|---|
| 2 tot 10 spelers, individueel. Duo-teams kunnen als instelling (zie 2.10). | [ECHT] 2–10 spelers, individueel of in teams [S1][S12] |
| Elke speler krijgt 1 willekeurige startkaart, open met jaartal, titel en artiest zichtbaar. Dat is het begin van de tijdlijn. | [ECHT] [S1][S7] |
| De startkaarten worden zo getrokken dat **geen twee spelers hetzelfde startjaar** hebben, en alle startjaren liggen tussen 1960 en 2015 (niet te makkelijk aan de randen). | [ONLINE] een computer kan dit eerlijk regelen; voorkomt dat iemand met 1932 of 2024 een gratis voordeel heeft |
| Iedereen start met **2 tokens**. Maximum is **5**. | [ECHT] 2 in de meeste versies, 3 in de Scandinavische [S2][S3][S6] |
| Spelersvolgorde = de volgorde waarin spelers de lobby binnenkwamen, getoond als een rondje op de tv. De host kan in de lobby spelers verslepen. | [ONLINE] vervangt "met de klok mee" |
| De speler met de **oudste startkaart** begint. Daarna gaat het rondje verder vanaf die speler. | [ECHT] volgens Bijlage A |

### 2.2 Doel en winnen
| Regel | Bron |
|---|---|
| Wie als eerste **10 kaarten** goed in zijn tijdlijn heeft, wint direct. De startkaart telt mee. | [ECHT] "first player to correctly position 10 cards on their timeline" [S3][S6]. Of de startkaart meetelt staat niet letterlijk in de regels die ik vond; omdat hij in de tijdlijn ligt, tel ik hem mee **[KEUZE]** |
| Doel instelbaar: 7, 8, 10 (standaard) of 12. | [ONLINE] (de officiële regels noemen zelf ook het spelen met minder tokens of een eigen doel als variant [S10]) |
| Er is per beurt maar één kaart te verdelen (de actieve speler óf één steler krijgt hem), dus **twee spelers kunnen nooit tegelijk op 10 komen**. Uitzondering: met "Kopen" (2.6) gebeurt het in de eigen beurt, dus ook dan is het maar één speler. | [ONLINE] logisch gevolg, expliciet vastgelegd |
| Een steler die door een gestolen kaart op 10 komt, wint meteen, ook al was het niet zijn beurt. | [ECHT] volgt uit de regels |
| Raakt de stapel op (alle nummers gespeeld), dan wint wie de meeste kaarten heeft; bij gelijkspel wie de meeste tokens heeft; daarna gedeelde winst. | [ONLINE] het echte spel noemt dit niet |

### 2.3 Een beurt
1. **Beurtstart (4 s).** De tv toont "Beurt voor Sanne". Sanne kan in deze 4 seconden **kopen** (2.6). Doet ze niets, dan start het nummer vanzelf. [ONLINE]
2. **Luisteren en plaatsen.** Het nummer speelt op de tv. Niemand ziet titel, artiest of jaar. Sanne tikt op haar telefoon een plek in haar tijdlijn (ervoor, ertussen of erna). De tv toont live waar ze de raadselkaart neerlegt. Ze mag wisselen zo vaak ze wil. [ECHT] plaatsen zonder jaartal [S1]; live meekijken [ONLINE]
3. **Titel en artiest claimen (optioneel).** Voor het vastzetten zet Sanne het schuifje "Ik noem titel + artiest" aan en **zegt ze het hardop** tegen de groep. [ECHT] tokens verdienen [S3]; het schuifje [ONLINE]
4. **Vastzetten.** Sanne tikt "Vastzetten". Vanaf nu ligt de kaart vast. [ONLINE] vervangt "de kaart neerleggen"
5. **HITSTER-venster (10 s).** Anderen kunnen stelen (2.5). [ECHT] stelen vóór het omdraaien [S5][S8]
6. **Onthulling.** De kaart draait om: jaar, titel, artiest. Goed = Sanne houdt hem. Fout = de kaart gaat weg, tenzij iemand hem goed gestolen heeft. [ECHT] [S7][S14]
7. **Bezwaar (6 s, alleen als er een claim was).** Zie 2.7.
8. **Beurt naar de volgende speler.** [ECHT]

### 2.4 Goed of fout
| Regel | Bron |
|---|---|
| De kaart is goed als zijn jaar ≥ het jaar links en ≤ het jaar rechts is. | [ECHT] |
| **Zelfde jaar:** ligt er al een kaart met hetzelfde jaar, dan is zowel direct ervoor als direct erna goed. | [ECHT] "Cards of the same year can be in either order" [S4] |
| Ligt er een **reeks** kaarten met hetzelfde jaar (bijv. 1985, 1985), dan is elke plek tussen, voor en na die reeks goed. | [ONLINE] logische uitbreiding van dezelfde regel |
| Het jaar is het jaar waarin het nummer **in zijn oorspronkelijke vorm door die artiest** werd uitgebracht of publiek uitgevoerd, niet het jaar van een heruitgave of remaster. | [ECHT] [S4][S11] |
| Niet vastgezet voordat de plaatstimer afloopt (2.11): de plek die op dat moment gekozen is wordt vastgezet. Was er nog geen plek gekozen, dan telt het als fout en mogen anderen gewoon stelen. | [ONLINE] |

### 2.5 Stelen ("HITSTER!")
| Regel | Bron |
|---|---|
| Kost 1 token. Alleen spelers met ≥ 1 token en die niet aan de beurt zijn. | [ECHT] [S8][S14] |
| Kan pas **nadat de actieve speler heeft vastgezet** en duurt 10 seconden. | [ECHT] in het echte spel leg je je token op de tijdlijn waar de kaart al ligt, vóór het omdraaien [S8]. De 10-secondentimer is [ONLINE] |
| Je kiest een **andere plek** dan de actieve speler. De plek van de actieve speler is niet stelbaar (dat zou nooit iets opleveren). | [ECHT] je zet in op een plek waar jij denkt dat het hoort, omdat je denkt dat de speler het fout heeft [S5] |
| **Wie het eerst tikt, heeft die plek.** Twee tokens op dezelfde plek kan niet; een bezette plek wordt grijs. | [ECHT] "No two tokens can be placed on the same spot" en wie het eerst roept mag eerst [S6][S9] |
| De tijd telt zoals de **tv** de tikken ontvangt (niet de klok van de telefoon). | [ONLINE] eerlijk, want telefoonklokken lopen verschillend |
| Wordt er in de laatste 4 seconden een plek geclaimd, dan gaat het venster terug naar 4 seconden (zodat anderen nog kunnen reageren), maximaal tot in totaal 20 seconden. | [ONLINE] |
| Elke speler mag **maximaal 1 keer** per beurt stelen. | [KEUZE] het echte spel zegt dit niet expliciet; 1 token per speler per beurt is hoe het aan tafel gaat |
| Had de actieve speler het **goed**: alle stelers verliezen hun token. | [ECHT] |
| Had de actieve speler het **fout** en zat een steler goed: de steler krijgt de kaart, op de juiste plek in **zijn eigen** tijdlijn. Zijn token gaat weg (Original). | [ECHT] [S8][S14] |
| Zaten er door de zelfde-jaarregel **twee stelers goed**: de eerste die tikte wint. De andere krijgt zijn token **terug**. | [KEUZE] zeldzaam randgeval; teruggeven voelt eerlijk omdat hij niet fout zat |
| **Niemand steelt goed**: de kaart gaat weg en alle gebruikte steel-tokens ook. | [ECHT] [S14] |
| Een steler die door de kaart op 10 komt, wint meteen. | [ECHT] |
| Pro/Expert: wie steelt moet ook titel + artiest (Pro) of titel + artiest + exact jaar (Expert) weten; een gelukte steal kost dan geen token. | [ECHT] [S2][S9] |

### 2.6 Tokens gebruiken op je eigen beurt
| Regel | Bron |
|---|---|
| **Overslaan:** 1 token, tijdens het luisteren, vóór het vastzetten. Het huidige nummer stopt, een nieuw nummer start, de timer begint opnieuw. Het overgeslagen nummer wordt niet onthuld (je ziet het in het overzicht na afloop). Je mag meerdere keren per beurt overslaan zolang je tokens hebt. | [ECHT] [S14]; "meerdere keren" en "niet onthullen" zijn [KEUZE] |
| **Kopen:** 3 tokens, **alleen in de 4 seconden beurtstart, vóór de muziek begint**. Je krijgt de bovenste kaart en die wordt meteen goed in je tijdlijn gezet. **Daarmee is je beurt voorbij.** | [ECHT] kopen vóór het luisteren [S3][S13]. Het echte spel zegt "altijd" en in de VS-versie sla je daarna je volgende beurt over [S5]. Online laat ik het je **huidige** beurt kosten **[KEUZE]**: zelfde effect (je speelt een beurt niet), maar geen onderbrekingen tijdens andermans beurt en niemand hoeft een overgeslagen beurt te onthouden |
| **Verdienen:** titel én artiest goed genoemd (claim + geen bezwaar) = +1 token, ook als je de kaart fout plaatste. Maximaal 5. | [ECHT] [S3][S15] |
| Je zit op 5 en verdient er een: je krijgt hem niet, de tv toont "Max 5". | [ECHT] |

### 2.7 Titel en artiest beoordelen: het bezwaar-systeem
| Regel | Bron |
|---|---|
| Zet de actieve speler het schuifje "Ik noem titel + artiest" aan, dan zegt hij het hardop vóór de onthulling. | [ECHT] zeggen; [ONLINE] schuifje |
| Na de onthulling ziet iedereen titel en artiest op de tv. Op de telefoons van de andere spelers verschijnt **6 seconden** een knop "Fout!" (en een kleine knop "Klopt"). | [ONLINE] |
| Tikt **minstens de helft** van de andere aanwezige spelers "Fout!", dan telt het als fout. Anders telt het als goed. | [KEUZE] het echte spel laat dit aan de groep over [S15 in Bijlage A]; standaard "goed" houdt het vlot, want meestal is het duidelijk |
| Wat telt als goed: hoofdartiest + herkenbare titel. Spelfouten, "feat."-artiesten en een ontbrekend "The" maken niet uit. Dit staat in de uitleg vóór het spel. | [KEUZE] |
| De host kan in het hostmenu op zijn telefoon de uitkomst omdraaien (voor ruzie). | [ONLINE] |

### 2.8 Moeilijkheidsniveaus (host kiest in de lobby)
| Niveau | Start-tokens | Tokens verdienen | Om een kaart te houden of te stelen | Bron |
|---|---|---|---|---|
| **Original** (standaard) | 2 | ja | alleen goede plek | [ECHT] [S3] |
| **Pro** | 5 | nee | goede plek + titel + artiest (claim + geen bezwaar) | [ECHT] [S2][S9] |
| **Expert** | 3 | nee | goede plek + titel + artiest + **exact jaar**. Het jaar typ je op de telefoon met een jaarwieltje vóór het vastzetten; de tv controleert het zelf. Gelukte steal = token terug. | [ECHT] [S2][S9]; jaarwieltje [ONLINE] |
| Coöperatief | — | — | Komt later (hoofdstuk 10) | [ECHT] [S1] |

In Pro/Expert is de claim verplicht: zonder claim is de kaart altijd weg.

### 2.9 Uitzonderingen en randgevallen
| Situatie | Wat er gebeurt | Bron |
|---|---|---|
| Nummer start niet of is niet afspeelbaar | Na 6 s zonder geluid trekt de tv automatisch een nieuw nummer. Niemand verliest iets. Melding: "Dit nummer wil niet. We pakken een ander." | [ONLINE] |
| Actieve speler is weg (telefoon offline) bij zijn beurtstart | Tv toont 20 s "Wachten op Daan…". Komt hij niet terug, dan wordt zijn beurt overgeslagen. Zijn tijdlijn en tokens blijven bewaard. | [ONLINE] |
| Actieve speler valt weg tijdens het plaatsen | Zijn gekozen plek blijft staan; de plaatstimer loopt door. Bij 0 wordt die plek vastgezet (of fout als hij niets koos). | [ONLINE] |
| Speler vertrekt definitief | Host tikt "Speler verwijderen". Zijn kaarten gaan weg uit het spel. | [ONLINE] |
| Speler komt later binnen | Mag tot het einde van ronde 2 instappen met 1 startkaart en 2 tokens, en schuift achteraan in het rondje. Daarna alleen nog als toeschouwer. | [KEUZE] |
| Twee spelers tikken tegelijk dezelfde steelplek | Wie de tv het eerst ontvangt, heeft hem. De ander ziet "Te laat, die plek is bezet" en kan meteen een andere kiezen. | [ONLINE] |
| Steler heeft 0 tokens | HITSTER-knop is grijs met tekst "Geen tokens". | [ECHT] |
| Iemand haalt 10 terwijl de stapel bijna leeg is | Gewoon winst. | — |
| Tv-pagina ververst per ongeluk | Spel gaat verder waar het was (opgeslagen op de pc). Het lopende nummer start opnieuw vanaf het begin. | [ONLINE] |
| Overslaan als er nog maar 1 nummer in de stapel zit | Knop grijs. | [ONLINE] |

### 2.10 Duo-teams (instelling)
Bij 8–10 spelers kun je kiezen voor teams van 2 [ECHT: teams zijn toegestaan, S1]. Elk teamlid speelt op de eigen telefoon; beide telefoons tonen dezelfde knoppen en **de eerste tik telt**. Teams delen tijdlijn en tokens. Dit halveert de speeltijd.

### 2.11 Tijden (standaard, instelbaar in de lobby)
| Fase | Tijd |
|---|---|
| Beurtstart (kopen mogelijk) | 4 s |
| Plaatsen | 60 s. Bij 15 s over wordt de timerring rood en trilt de telefoon één keer. Instelbaar: 45 / 60 / 90 s / geen timer |
| HITSTER-venster | 10 s (kan oplopen tot max 20 s, zie 2.5) |
| Bezwaar | 6 s |
| Wachten op afwezige speler | 20 s |

---

## 3. Spelbeleving van begin tot eind

### 3.1 Vooraf (eenmalig, dagen ervoor)
- De nummerlijst is voorbereid (hoofdstuk 6): `songs.json` staat in de repo met ±300 nummers en gecontroleerde jaren.
- De host controleert de dag ervoor of de Supabase-studiewebsite-database niet gepauzeerd is (zie 8.2) en speelt één proefbeurt.

### 3.2 De avond, minuut voor minuut (voorbeeld: 9 spelers + host = 10)
| Tijd | Wat gebeurt er |
|---|---|
| 20:00 | Host zet de pc aan, opent `tunetimeline.vercel.app/tv` in Chrome, tikt F11 (volledig scherm). Het scherm vraagt "Verbind Spotify". Host logt (eenmalig per avond) in met Spotify. |
| 20:01 | Tv: "Klik hier om het geluid aan te zetten" (verplicht door de browser, zie 6.2). Host klikt. Een kort testgeluidje en een testnummer van 3 s bevestigen dat het werkt. |
| 20:02 | **Lobby** op de tv: grote QR-code links, roomcode "KWPX" eronder, rechts een rondje lege stoelen. Op de achtergrond speelt zacht een "lobby-lus": de tv speelt willekeurige fragmenten uit de playlist **niet** af (spoilers!), maar een eigen synthesizer-loopje van 8 tellen via de browser. |
| 20:02–20:08 | Gasten scannen de QR. Op hun telefoon: naam typen, kleur kiezen, "Ik doe mee". Op de tv springt hun naambordje in een stoel met een "plop" en hun kleur. Wie al zit, kan op de telefoon een emoji-reactie sturen die over de tv zweeft (lekker druk tijdens het wachten). |
| 20:08 | Host kiest instellingen op zijn telefoon (hostmenu): Original, 10 kaarten, 60 s. De tv toont onderaan: "Geschatte speelduur: ±2 uur 10 min. Tip: Snelle avond (7 kaarten) ±1 uur 15 min of duo's ±1 uur 10 min." De groep kiest 8 kaarten. |
| 20:09 | **Uitleg** (75 s, overslaanbaar door de host): 5 kaarten van 15 s op de tv met tekst en mini-animaties: 1) Bouw je tijdlijn, 2) Plaatsen en vastzetten, 3) HITSTER! stelen, 4) Tokens: overslaan, kopen, verdienen, 5) Wat telt als titel + artiest goed. Telefoons tonen tegelijk dezelfde tekst kort. |
| 20:10 | **Startkaarten**: de tv deelt in 6 s de kaarten uit (elke kaart vliegt naar een naambordje en draait om). Iedereen ziet zijn startkaart ook op zijn telefoon. "Oudste kaart: Mila (1967). Mila begint!" |
| 20:10–22:00 | De beurten (zie 3.3). Elk 10e nummer verschijnt een **tussenstand** van 8 s. |
| ±21:15 | **Spanningsmoment**: zodra iemand 1 kaart van het doel af is, krijgt zijn naambordje een pulserende amber rand en een vlammetje "Match point". Bij zijn beurt klinkt een kort trommelroffeltje voordat het nummer start. |
| ±22:00 | **Winnaar** (zie 3.5). |

### 3.3 Eén beurt, met tijden
| s | Tv | Telefoon actieve speler | Telefoons anderen |
|---|---|---|---|
| 0–4 | "Beurt voor Daan" groot in zijn kleur, zijn tijdlijn schuift naar het midden. Kleine regel: "Daan kan nu kopen (3 tokens)". | Trilt 2× kort. "Jij bent!" + knop "Start nu" + knop "Kaart kopen" (grijs bij < 3 tokens). | "Daan is aan de beurt" + Daans tijdlijn klein. |
| 4 | Nummer start (fade-in 1 s). Raadselkaart met bewegende equalizer zweeft boven Daans tijdlijn. Timerring 60 s. | Eigen tijdlijn verticaal, gaten tussen kaarten zijn tikbaar. Onderin: "Overslaan (1)" en "Vastzetten" (grijs tot je een plek koos). | **Meegokken**: dezelfde tijdlijn van Daan, ze tikken stiekem waar zij denken dat het hoort (geen effect op de score). Reactieknoppen 🔥😂😱🎶. |
| 4–40 | Raadselkaart schuift live naar elke plek die Daan aantikt. De groep roept mee. | Daan tikt een gat, de raadselkaart schuift erin. Schuifje "Ik noem titel + artiest". | Meegokken kan tot Daan vastzet. |
| 40 | "VASTGEZET" stempel (0,3 s), kaart klikt vast. Daarna groot: **"HITSTER?" 10** met aftelbalk in violet. | "Vastgezet. Nu duimen." | Trilt 1× lang. Grote violette knop **"HITSTER!"** met 10 s balk. |
| 40–50 | Elke steelpoging verschijnt meteen als gekleurd fiche met naam op het gat in Daans tijdlijn, met "zwoesj". | Ziet de fiches ook verschijnen. | Na tik op HITSTER! kies je een vrij gat → "Steel op 1985–1991?" → "Ja, steel!". |
| 50–51,5 | Muziek zakt naar 30% volume. Trommelroffel 1,2 s. | — | — |
| 51,5–52,2 | Kaart draait om (0,7 s). Jaar groot, titel en artiest eronder. | Zelfde kaart verschijnt. | Zelfde. |
| 52,2–55 | **Goed**: mint gloed, kaart zakt in de tijdlijn, "+1 kaart". **Fout**: rode schok, kaart valt en vervaagt. **Gestolen**: kaart vliegt naar het naambordje van de steler, "Gestolen door Mila!". Teller "Meegokkers goed: 4 van 8". | Resultaat + nieuw aantal kaarten. | Resultaat; stelers zien "Token kwijt" of "Kaart is van jou!". Meegokkers zien "Jij zat goed 👂". |
| 55–61 | Alleen bij claim: "Had Daan titel + artiest goed?" + 6 s balk + teller "bezwaren: 2 van 8". | "Even afwachten…" | Grote rode knop "Fout!" + kleine "Klopt". |
| 61–63 | Resultaat bezwaar, eventueel "+1 token". Muziek fadet uit in 2 s. | — | — |
| 63 | Volgende beurt. | | |

**Duur:** ±60–75 s per beurt, ±10–12 min per ronde met 10 spelers.

### 3.4 Hoe lang duurt een partij? (schatting)
Mijn schatting, geen gemeten gegeven: een speler plaatst in het begin ±70% goed, met 7+ kaarten ±50%. De leider haalt het doel als hij gemiddeld ±60% goed doet, plus af en toe een steal of een gekochte kaart.

| Spelers | Doel 7 | Doel 8 | Doel 10 |
|---|---|---|---|
| 4 | 25 min | 30 min | 40 min |
| 6 | 40 min | 45 min | 1 u 05 |
| 8 | 55 min | 1 u 05 | 1 u 30 |
| 10 | 1 u 10 | 1 u 25 | 1 u 55 |
| 10 als 5 duo's | 35 min | 40 min | 1 u |

Ter vergelijking: de doos van Hitster noemt 30 minuten [S12], maar dat is met minder spelers en zonder online wachtmomenten. Met 10 mensen is 2 uur echt te lang voor één spel; daarom de schatting in de lobby en de keuze voor een lager doel of duo's.

### 3.5 Betrokken blijven als je pas na 9 anderen weer aan de beurt bent
- **Stelen** is het belangrijkste: elke beurt heb je een reden om op te letten. De violette knop verschijnt op ieders telefoon, met trillen.
- **Meegokken**: tijdens elke beurt kun je gratis stiekem een plek aantikken. Het telt niet voor de winst (zodat de echte regels zuiver blijven), maar levert de prijs **"Beste oor van de avond"** op in het eindoverzicht en een teller op de tv ("4 van 8 zaten goed").
- **Reacties**: 4 emoji-knoppen. Ze zweven 2 s over de tv naast het naambordje van de afzender. Maximaal 1 per 2 s per speler (anders spam).
- **Bezwaar** geeft iedereen een stem bij elke claim.
- **Kijkwaarde op de tv**: de live-schuivende raadselkaart is het "kijk wat hij doet!"-moment, net als aan tafel.
- **Match point**: spanning als iemand bijna wint, zichtbaar voor iedereen.
- **Pauze**: de host kan in het hostmenu op "Pauze" tikken (drankjes halen); de muziek stopt, de tv toont "Pauze ☕" met de tussenstand.

### 3.6 Na het einde
1. **Winnaar** (8 s): tv wordt amber, de laatste kaart van de winnaar vliegt in zijn tijdlijn, confetti in de 10 spelerskleuren, naam in 160 px, fanfare van 3 s. De telefoon van de winnaar toont een gouden kroon en trilt 3×.
2. **Eindoverzicht** (blijft staan): ranglijst (kaarten, tokens), en vier prijzen: *Beste oor* (meeste meegokken goed), *Meesterdief* (meeste gelukte steals), *Tijdreiziger* (oudste goed geplaatste kaart), *Bijna!* (fout met het kleinste jaarverschil).
3. Knoppen voor de host: **"Nog een potje"** (zelfde spelers, nieuwe startkaarten, gebruikte nummers gaan achteraan de stapel) en **"Terug naar lobby"** (instellingen wijzigen, mensen erbij of eraf). Telefoons blijven verbonden.

---

## 4. Uiterlijk en gevoel

### 4.1 Visuele identiteit

**Naam en logo-idee.** "Tune Timeline", geschreven als **TUNE·TIMELINE** in zware hoofdletters. Het beeldmerk is een horizontale lijn met vijf stippen (de tijdlijn); de middelste stip is groter en amber, en de lijn golft rond die stip als een geluidsgolf. Geen QR-blokjes, geen neon-gradiënt, geen platenhoes: bewust anders dan Hitster.

**Sfeer: "nachtradio".** Alsof je om middernacht naar een radiostation luistert: donker, warm, met crèmekleurige "concertkaartjes" als kaarten. Rustige achtergrond, felle accenten alleen voor wat er nú toe doet.

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
| Aan de beurt / focus | Amber | `#FFB23F` |
| Goed | Mint | `#34E08F` |
| Fout | Signaalrood | `#FF4D5E` |
| Stelen / HITSTER-moment | Violet | `#7A5CFF` |

**Decenniumband op de kaarten** (helpt om een tijdlijn in één oogopslag te lezen):
`≤1959 #9A8C7A` · `60s #E9A23B` · `70s #D9653B` · `80s #E0457B` · `90s #7A5CFF` · `00s #2FA7E0` · `10s #20BFA0` · `20s #8BCF3F`

**Spelerskleuren (10)**, gekozen zodat ze los staan van goed/fout/stelen en op donker goed zichtbaar zijn:
Zon `#FFD23F` · Mandarijn `#FF8C42` · Framboos `#FF4F8B` · Orchidee `#E07BFF` · Kobalt `#4D7CFF` · Hemel `#3BC9F5` · Turkoois `#2ED3B7` · Limoen `#A6E35A` · Zalm `#FFAD9E` · Zilver `#C9CED8`.
Elke speler heeft naast een kleur ook een **letter-avatar** (eerste letter van de naam), zodat kleur nooit het enige herkenningsteken is (kleurenblinde vrienden).

**Lettertypes.** In de mockups: systeemletters (`system-ui`, Segoe UI op Windows, SF Pro op iPhone, Roboto op Android), gewicht 800 voor koppen en jaartallen, 500 voor tekst, cijfers altijd met gelijke breedte (`tabular-nums`) zodat aftellende timers niet verspringen. Voor de echte bouw stel ik voor: **Space Grotesk** (gratis, open licentie) mee te leveren in de site voor koppen en jaartallen; dat geeft een eigen gezicht en werkt zonder internet-afhankelijkheid tijdens het spel.

**Vormtaal.** Afgeronde hoeken (kaarten 14 px op tv, 12 px op telefoon), dikke lijnen (3 px), cirkels voor spelers en tokens. Tokens zijn **kleine amber munten met een golflijn** erin (niet het Hitster-fiche). Schaduwen alleen onder kaarten.

**Kaartontwerp**
- **Muziekkaart (open):** crème "concertkaartje", verhouding 3:4, met bovenaan een decenniumband van 18% van de hoogte en twee halve inkepingen aan de zijkanten (zoals een afscheurbaar kaartje). In het midden het **jaartal** in 800-gewicht. Eronder titel (2 regels max, daarna "…") en artiest in gedempte inkt. Geen albumhoes.
- **Raadselkaart:** dezelfde vorm, maar nachtkleurig (`#2A2350`) met een violet-amber rand die zacht pulseert (1,6 s per puls), in het midden vijf equalizerstaafjes die op de maat bewegen en een groot "?".
- **Omgedraaide kaart (na onthulling):** de muziekkaart; bij goed een mint rand van 4 px die 1 s nagloeit, bij fout een rode rand + diagonale streep.
- **De flip:** 3D-draai om de verticale as, 700 ms, `cubic-bezier(.2,.8,.2,1)`. Op 350 ms (kaart staat op zijn kant) wisselt de voorkant. De kaart wordt tijdens de draai 12% groter en zakt daarna terug.

### 4.2 Geluid en animatie
Alle geluidseffecten worden in de browser gemaakt (Web Audio), dus geen geluidsbestanden en geen auteursrecht. Effecten klinken alleen op de **tv**; telefoons trillen in plaats van geluid (anders 10 telefoons door elkaar).

| Moment | Geluid | Animatie | Duur |
|---|---|---|---|
| Speler komt binnen | "plop" (sinus 660 Hz, 80 ms) | naambordje schaalt van 0 naar 1 met kleine stuiter | 300 ms |
| Beurtstart | 2 tonen omhoog | tijdlijn schuift naar het midden, naam in spelerskleur | 500 ms |
| Raadselkaart verplaatst | zacht "tik" | kaart glijdt naar het nieuwe gat, buren schuiven opzij | 180 ms |
| Vastzetten | "klak" | stempel "VASTGEZET", kaart zakt 4 px | 300 ms |
| HITSTER-venster open | korte "wieuw" + tikkende klok (zacht) | violette balk loopt leeg, scherm krijgt een violette gloed aan de randen | 10 s |
| Steelfiche geplaatst | "zwoesj" | fiche valt van boven in het gat met naam | 250 ms |
| Onthulling | trommelroffel | — | 1,2 s |
| Flip | "swish" | zie kaartontwerp | 700 ms |
| Goed | majeur-akkoord (3 tonen) | mint gloed, "+1" stijgt op | 900 ms |
| Fout | lage zoem 150 ms | kaart schudt 2× en vervaagt naar beneden | 600 ms |
| Gestolen | "kassa"-klank | kaart vliegt in een boog naar het naambordje van de steler | 800 ms |
| Token verdiend | muntje "ting" | munt rolt naar het naambordje | 500 ms |
| Match point | lage puls | amber rand rond naambordje pulseert | blijvend |
| Winnaar | fanfare 3 s | confetti 4 s, naam schaalt in | 8 s |

**Muziekvolume:** tijdens onthulling zakt Spotify naar 30%, na het resultaat terug naar 100%, aan het einde van de beurt fade-out van 2 s.

**Minder beweging:** staat op de pc "minder beweging" aan, dan worden schuif- en vlieganimaties vervangen door korte fades.

### 4.3 TV-schermen per toestand (1920×1080)

Vaste indeling tijdens het spel:
- **Bovenbalk (hoogte 150 px):** alle spelers als naambordjes naast elkaar. Elk bordje (184 px breed): letter-avatar (44 px), naam (26 px, max 10 tekens), groot kaartenaantal (38 px, bijv. "6/10"), tokens als één munt met getal (30 px, bijv. "● 2"; losse muntjes bleken op 3 m te klein), en eronder een rij van 10 streepjes in de spelerskleur. Actieve speler: amber rand + 8 px hoger.
- **Midden (±700 px):** de tijdlijn van de actieve speler, groot.
- **Onderbalk (90 px):** links de fase ("Luisteren & plaatsen", "HITSTER?"), midden een voortgangsbalk/timer, rechts klein de roomcode + mini-QR (120 px) om later in te stappen.

| Toestand | Wat je ziet |
|---|---|
| **Spotify verbinden** | Logo groot, knop "Verbind Spotify", daaronder in 24 px: "Alleen de host. Eén keer per avond." |
| **Geluid aan** | Grote amber knop "Klik om te beginnen 🔊". Waarom: browsers spelen geen geluid af voordat iemand klikt. |
| **Lobby** | Links: QR-code 420×420 px op een crème vlak, eronder "Ga naar **tunetimeline.vercel.app**" en de code **KWPX** in 96 px. Rechts: 10 stoelen in 2 rijen van 5, genummerd in speelvolgorde, gevuld met naambordjes (een cirkel bleek in de mockup rommelig te lezen). Onder: instellingen (niveau, doel, timer) en de speeltijdschatting. |
| **Uitleg** | 5 kaarten van 15 s, elk met één zin van max 12 woorden in 48 px en een mini-animatie. Onderin "Volgende" (host) en bolletjes 1/5. |
| **Startkaarten** | Kaarten vliegen naar de naambordjes. Daarna "Oudste kaart: Mila (1967). Mila begint!" |
| **Beurtstart** | Naam in 96 px in spelerskleur, "is aan de beurt". Tijdlijn schuift in. Klein: "Kopen kan nu (3 tokens)". |
| **Nummer speelt / plaatsen (live)** | Raadselkaart zweeft boven het gat dat de speler nu kiest, met een amber pijl. Rechts boven de timerring (180 px). Onder: "Daan plaatst… — meegokkers: 6". |
| **Steal-venster** | Violette gloed aan schermranden. Midden boven: "HITSTER?" 72 px + balk. De vrije gaten in de tijdlijn krijgen een gestippelde violette rand; geplaatste steelfiches tonen letter-avatar + naam. |
| **Onthulling goed** | Kaart draait, mint rand, "GOED!" 80 px, "+1" bij het naambordje. Onder: "Meegokkers goed: 4 van 8". |
| **Onthulling fout** | Rode rand, "MIS!" 80 px, regel "Hoorde tussen 1979 en 1983". Kaart valt weg. |
| **Steal-resultaat** | "GESTOLEN DOOR MILA!" in Mila's kleur, kaart vliegt naar haar bordje. Mislukte stelers: hun fiche wordt grijs met "−1". |
| **Bezwaar** | "Had Daan titel + artiest goed?" + titel en artiest groot + 6 s balk + "Bezwaren: 2 van 8 (4 nodig)". |
| **Tokens** | Bij elke tokenwijziging rolt een muntje naar of van een naambordje, met "+1"/"−1". "Max 5" als je vol zit. |
| **Tussenstand** | Elk 10e nummer, 8 s: ranglijst met horizontale balken (kaarten tot doel) in spelerskleur, tokens erachter. |
| **Winnaar** | Amber achtergrond, confetti, naam 160 px, tijdlijn van de winnaar eronder, daarna eindoverzicht met de 4 prijzen. |
| **Pauze** | "Pauze ☕" + tussenstand, muziek uit. |
| **Foutmelding: nummer speelt niet** | Gele strook bovenaan 4 s: "Dit nummer wil niet. We pakken een ander." |
| **Foutmelding: Spotify verbinding kwijt** | Spel bevriest, scherm 50% donker, kaart in het midden: "Spotify is even weg. Bezig met opnieuw verbinden… (3)". Na 3 mislukte pogingen: knop "Opnieuw verbinden" en "Gebruik de Spotify-app op deze pc" (terugvaloptie, 6.2). |
| **Speler verbinding kwijt** | Zijn naambordje wordt 50% doorzichtig met een klein "📶✕"-icoon. Bij zijn beurt: "Wachten op Daan… 20". |
| **Internet weg (tv)** | Kaart in het midden: "Geen verbinding met de spelers. Bezig…". Het spel staat stil tot het terug is; er gaat niets verloren. |

### 4.4 Telefoonschermen per toestand (390×844, staand)

Vaste indeling: **bovenbalk 56 px** (letter-avatar in eigen kleur, naam, "6/10" kaarten, tokens als munten), **inhoud**, **actiebalk onderaan 96 px** met de hoofdknop (hoogte 64 px, volle breedte min 32 px marge) binnen bereik van de duim.

| Toestand | Wat je ziet |
|---|---|
| **Aanmelden** | Opent via QR al met de code ingevuld. Anders: veld "Roomcode" (4 grote vakjes, alleen hoofdletters, geen 0/O/1/I). Knop "Verder". |
| **Naam en kleur** | Veld "Jouw naam" (max 10 tekens), daaronder een raster van 10 kleurrondjes van 56 px; bezette kleuren zijn doorgestreept. Knop "Ik doe mee". |
| **Wachten (lobby)** | "Je zit erin, Mila!" + je naambordje groot + "Wacht op de host…" + lijst van wie er al is + 4 reactieknoppen. |
| **Uitleg** | Dezelfde 5 uitlegkaarten, zelf doorbladeren. |
| **Andermans beurt (meegokken)** | Boven: "Daan is aan de beurt". Daaronder Daans tijdlijn verticaal; tik een gat om stiekem mee te gokken (je gok heeft een stippelrand in jouw kleur). Onder: 4 reactieknoppen. |
| **Jouw beurt (beurtstart)** | Volledig amber scherm 1 s: "Jij bent!", trilt 2×. Dan knoppen "Start nu" en "Kaart kopen" met 4 s balk. Met minder dan 3 tokens is de koopknop grijs met de tekst "3 tokens nodig (je hebt er 2)", zodat iedereen leert dat kopen bestaat. |
| **Jouw beurt (plaatsen)** | Je eigen tijdlijn verticaal, oud boven, nieuw onder. Tussen elke kaart een gat van 56 px hoog met tekst "hier?" Tik = raadselkaart schuift erin. Boven de actiebalk het schuifje "Ik noem titel + artiest". Actiebalk: kleine knop "Overslaan (1)" links (40% breed) en grote knop "Vastzetten" rechts (60%), grijs tot je een plek koos. Timerring klein rechtsboven. |
| **Bevestigd** | "Vastgezet tussen 1985 en 1991. Nu duimen…" + de violette steel-fiches die binnenkomen. |
| **Steal kiezen** | Bij het openen van het venster: trilt 1× lang, scherm krijgt violette rand, grote knop **"HITSTER!"** (hoogte 120 px) + 10 s balk. Na tik: Daans tijdlijn met vrije gaten (violet gestippeld), zijn eigen plek met amber "Daan" (niet tikbaar), bezette gaten grijs met naam. Tik een gat → onderblad "Steel op 1985–1991? Kost 1 token" met "Ja, steel!" en "Andere plek". |
| **Resultaat** | Groot: "GOED! +1 kaart" (mint) of "MIS!" (rood) of "Gestolen door Mila" of "Jij stal 'm! 🎉" + de kaart met jaar, titel, artiest. |
| **Bezwaar** | Voor anderen: titel en artiest + grote rode knop "Fout!" + kleine knop "Klopt" + 6 s balk. |
| **Tokens** | In de bovenbalk; bij verandering springt de munt en verschijnt "+1"/"−1" 1 s. Tik op de bovenbalk opent "Mijn tijdlijn" en uitleg van tokens. |
| **Winnaar** | Winnaar: gouden kroon, "Jij bent de Tune Master!". Anderen: "Mila wint!" + jouw plek en jouw prijs als je er een hebt. |
| **Verbinding kwijt** | Strook bovenaan in rood: "Verbinding kwijt, bezig…". Knoppen grijs. Na herstel: strook groen "Terug!" 1,5 s. |
| **Te laat / dubbel** | Toast onderaan: "Te laat, het venster is dicht" of "Die plek is net bezet". |
| **Host extra** | Een tandwiel in de bovenbalk opent het hostmenu: Pauze, Beurt overslaan, Speler verwijderen, Uitslag bezwaar omdraaien, Volume tv, Spel stoppen. |

### 4.5 De tv met 8–10 spelers leesbaar houden
- Bovenbalk met **10 naambordjes van 184 px breed** past op 1920 px (10×184 + 9×8 px tussenruimte = 1912 px). Bij 6 of minder spelers worden de bordjes 240 px breed. Namen worden afgekapt als ze niet passen (in de mockup bijvoorbeeld "Daan…" naast het offline-icoon); de lobby raadt korte namen aan.
- Alleen de tijdlijn van de **actieve** speler is groot. Van de anderen zie je het aantal kaarten (groot getal) en een rij van 10 kleine streepjes die zich vullen. Hun hele tijdlijn verschijnt alleen als je hem nodig hebt (bij een steal-resultaat).
- De grote tijdlijn schaalt mee: tot 6 kaarten zijn kaarten 200 px breed; bij 7–12 kaarten 132–150 px. Het jaartal blijft altijd minimaal 48 px.
- Op de tv staat nooit meer dan één ding te knipperen.

### 4.6 Leesbaarheid op 3 meter en bediening met één hand
- **Tv** (1080p, gecontroleerd met schermafdrukken van de mockups op 1920×1080): minimale tekst 24 px (roomcode-regel), gewone tekst 28–36 px, namen 26 px, jaartallen 48–72 px, fase-titels 72–96 px. Contrast tekst op achtergrond minstens 7:1 (crème `#F6F1E7` op `#120E24` haalt ruim 15:1).
- **Telefoon** (gecontroleerd op 390×844): gewone tekst minimaal 17 px, labels en artiestnamen 15 px, tikdoelen minimaal **48×48 px** (Apple adviseert 44 pt, WCAG 2.2 noemt 24 px als ondergrens [S24][S25]; ik kies ruimer omdat er drank in de andere hand zit). Hoofdknop 64 px hoog en altijd onderaan, binnen bereik van de duim. Belangrijke knoppen staan nooit bovenaan het scherm.
- Geen "veeg"-gebaren als enige manier: alles is tikken.

---

## 5. Interactiedetails

### 5.1 Een kaart plaatsen
1. Je tijdlijn staat verticaal: oudste boven. Bij meer kaarten dan op het scherm passen, scroll je, en het scherm scrolt vanzelf naar het gat dat je koos.
2. Tik op een gat ("hier?"). De raadselkaart schuift in 180 ms in dat gat, de telefoon geeft een heel korte tik-trilling (10 ms). De tv volgt binnen ±0,3 s.
3. Tik een ander gat om te wisselen. Tik op de raadselkaart zelf om hem weer weg te halen.
4. "Vastzetten" wordt actief (amber). Eén tik = vast. Daarna 1,5 s een kleine knop "Oeps, terug" (alleen zolang het HITSTER-venster nog niet geopend is; het venster opent pas na die 1,5 s). Dit vangt een verkeerde duim op zonder het spel te vertragen.
5. Waarom tikken en niet slepen: slepen met één hand en een glas is foutgevoelig, en tikken werkt hetzelfde op alle telefoons.

### 5.2 Stelen
- Wie: iedereen behalve de actieve speler, met ≥ 1 token en nog niet gestolen deze beurt.
- Wanneer: 10 s na het vastzetten (+1,5 s "oeps"-tijd).
- Volgorde: de tv bewaart per gat wie het eerst binnenkwam. Een gat is pas van jou na "Ja, steel!", niet al bij het openen van het onderblad.
- Wat je ziet: de violette knop, daarna Daans tijdlijn met vrije en bezette gaten. Bezette gaten tonen de naam van de steler.
- Tijdslimiet: zie 2.5 (verlenging tot max 20 s).

### 5.3 Timers en trillen
| Moment | Trillen (Android; iPhone trilt niet via de browser, daar alleen beeld) |
|---|---|
| Jouw beurt | 2× 150 ms |
| Nog 15 s plaatsen | 1× 80 ms |
| HITSTER-venster open (niet-actieven) | 1× 300 ms |
| Kaart gewonnen / gestolen | 3× 80 ms |
| Gat tikken | 10 ms |

Let op: de trilfunctie (`navigator.vibrate`) werkt op Android in Chrome, maar Safari op de iPhone ondersteunt hem niet. Daarom is elk trilmoment ook een duidelijk beeldmoment (volledig gekleurd scherm 1 s).

### 5.4 Dubbel tikken, te laat tikken
- Elke knop wordt na de eerste tik direct grijs tot de tv antwoordt.
- Elk bericht van een telefoon heeft een uniek nummer; de tv verwerkt elk nummer maar één keer (dubbele berichten door slecht wifi worden genegeerd).
- Komt een tik binnen nadat een fase gesloten is: de tv negeert hem en stuurt "Te laat" terug; er gaat niets af (geen token weg).
- Komt "Ja, steel!" binnen op een gat dat net bezet is: "Die plek is net bezet", token blijft, je kunt opnieuw kiezen zolang het venster open is.

### 5.5 Scherm aan houden
De telefoonpagina vraagt bij "Ik doe mee" om het scherm aan te laten (Screen Wake Lock API). Dat werkt inmiddels in alle grote browsers, op de iPhone vanaf iOS 16.4, al melden ontwikkelaars dat het op de iPhone niet werkt als je de site op het beginscherm zet [S21][S22][S23]. Daarom: niet op het beginscherm zetten, gewoon in Safari/Chrome laten. De wake lock vervalt als je van app wisselt; de pagina vraagt hem opnieuw zodra je terugkomt.

---

## 6. Muziek en data

### 6.1 De Spotify-playlist
- De officiële Hitster-playlists staan op Spotify; de Hitster-FAQ linkt er zelf naar (bijv. Hitster Original) [S16][S17].
- **Belangrijk (nieuw sinds 2026):** in Spotify's "Development Mode" krijg je via de API de nummers van een playlist **alleen nog als jij die playlist bezit of er samenwerker van bent**. Van andermans playlists krijg je alleen de naam en omschrijving [S18][S19]. Je kunt de officiële Hitster-playlist dus niet rechtstreeks inlezen.
- **Oplossing:** in de Spotify-app op de pc: open de Hitster-playlist, Ctrl+A (alle nummers), rechtermuisklik → "Toevoegen aan playlist" → "Nieuwe playlist" ("Tune Timeline – bron"). Die kopie is van jou en is wel leesbaar. Dit hoeft maar één keer.
- Welke editie: kies de Nederlandse/Original-editie die bij jou in Spotify werkt. Hitster zegt zelf dat de nummers per land zijn uitgekozen op wat daar beschikbaar is [S17].

### 6.2 Hoe het afspelen werkt
**Standaard: Spotify Web Playback SDK in de tv-browser.** De tv-pagina wordt zelf een Spotify-apparaat ("Tune Timeline TV"). De tv start een nummer door de Web API te vragen "speel dit nummer op apparaat Tune Timeline TV". Dit vereist Premium van de host [S26] en de host moet eenmalig op de pagina klikken voordat er geluid mag komen; dat is de autoplay-regel van browsers, en de SDK heeft er een aparte melding (`autoplay_failed`) voor [S27][S28]. Daarom het scherm "Klik om te beginnen".

**Bekende haperingen** (uit ontwikkelaarsfora en projecten, 2022–2026):
- De eerste afspeelopdracht direct na het verbinden faalt soms; een korte wachttijd na "ready" helpt [S29].
- In 2026 zijn er meldingen dat de speler in Development Mode niet "ready" wordt. Eén project vond als oorzaak dat er meerdere spelers per pagina werden aangemaakt; met één speler per pagina werkte het weer (oktober 2026) [S30][S31]. Bouwregel dus: precies één speler per tv-pagina, en wachten met een tijdslimiet van 15 s.
- Safari is lastig met de SDK [S32]. **De tv-pc gebruikt daarom Chrome of Edge.**

**Terugvaloptie: de Spotify-app op de pc.** Lukt de SDK niet binnen 15 s, dan biedt de tv aan: "Gebruik de Spotify-app op deze pc". De host opent de gewone Spotify-desktopapp (geminimaliseerd, achter de browser), en de tv-pagina stuurt die app aan via de Web API (Spotify Connect). Nadeel: de app toont de titel als je hem bekijkt, dus hij moet geminimaliseerd blijven.

**Begin van het nummer.** Het nummer start op 0:00. In `songs.json` kan per nummer een `startMs` staan (bijv. 15 000) voor nummers met een heel lange stille intro; dat zet je bij de voorbereiding.

**Spoilers via Spotify zelf.** Omdat de tv een Spotify Connect-apparaat is, kan de **Spotify-app op de telefoon van de host** (en het vergrendelscherm) laten zien wat er speelt. Daarom: host sluit de Spotify-app op zijn telefoon helemaal af vóór het spel. Hetzelfde geldt voor andere apparaten die op hetzelfde Spotify-account zijn ingelogd.

### 6.3 Het juiste oorspronkelijke jaar bepalen
**Het probleem.** Spotify geeft de releasedatum van het **album** waar het nummer op staat. Staat het nummer op een verzamelalbum of remaster, dan krijg je bijvoorbeeld 2011 voor een nummer uit 1975. Hitster gebruikt het jaar waarin het nummer in zijn oorspronkelijke vorm door die artiest is uitgebracht [S4][S11].

**Aanpak in drie lagen (eenmalig, vóór het feest, door een voorbereidingsscript):**
1. **Spotify:** per nummer: Spotify-ID, titel, artiesten, duur, album-releasedatum en de **ISRC** (de unieke code van een opname). De ISRC zat even op de lijst van verwijderde velden in februari 2026, maar die verwijdering is in maart 2026 teruggedraaid [S19]. Met `market=NL` geeft Spotify ook `is_playable` [S20].
2. **MusicBrainz** (gratis, open muziekdatabase): opzoeken via `/ws/2/isrc/{isrc}` levert de opname(s); elke opname heeft een `first-release-date` (de vroegste release waarop die opname staat) [S33][S34]. Lukt dat niet (geen ISRC-match), dan zoeken op artiest + titel en alleen treffers nemen met dezelfde artiest en een duur die maximaal 10 s afwijkt. MusicBrainz staat **1 verzoek per seconde** toe en vraagt een herkenbare User-Agent [S35][S36]. 300 nummers × ±2 verzoeken ≈ 10 minuten.
3. **Beslisregel:**
   - Zijn Spotify-jaar en MusicBrainz-jaar gelijk (of 1 jaar verschil): neem het vroegste. Status `ok`.
   - Is MusicBrainz eerder dan Spotify (typisch: verzamelalbum): neem MusicBrainz. Status `ok-mb`.
   - Is MusicBrainz **later** dan Spotify, of meer dan 15 jaar eerder (kans op verkeerde match, cover of live-versie): status **`controleren`**.
   - Geen MusicBrainz-gegevens: Spotify-jaar, status `controleren`.
4. **Correctielijst** `corrections.csv` (Spotify-ID; jaar; notitie). Alles wat hierin staat wint altijd. De host loopt de nummers met `controleren` na (verwachting: 30–60 van de 300; dat is een schatting) via Wikipedia of Discogs, ±1 minuut per nummer. Heb je de echte Hitster-kaarten bij de hand: het jaartal op de kaart wint, want dat is de "officiële" waarheid van het spel.

Eerlijk: ik heb **geen openbare, betrouwbare lijst** gevonden met alle Hitster-kaarten en hun jaartallen; die laag moet dus uit de eigen controle komen.

### 6.4 Niet-afspeelbare nummers
- **Vooraf:** het script vraagt de playlist op met `market=NL` en zet nummers met `is_playable: false` in een aparte lijst. Spotify past dan soms "track relinking" toe (een andere uitgave van hetzelfde nummer die wél speelt) [S20]; het script bewaart dan het speelbare ID. Let op: `available_markets` is in 2026 uit de API gehaald [S19], dus `is_playable` is wat overblijft, en ontwikkelaars melden dat het niet altijd klopt [S37].
- **Tijdens het spel:** speelt een nummer na 6 s niet (geen "aan het spelen"-signaal van de speler), dan trekt de tv het volgende nummer, zonder strafpunten, en onthoudt het ID in een lokale "speelt niet"-lijst zodat het niet terugkomt.

### 6.5 Het bestand `songs.json`
Per nummer: `id` (Spotify), `title`, `artist`, `year`, `yearSource` (`spotify`/`musicbrainz`/`correctie`/`kaart`), `status`, `startMs` (optioneel), `durationMs`. Geen albumhoezen (die zijn niet nodig en leveren alleen auteursrechtvragen op). Het bestand wordt **alleen door de tv** geladen.

---

## 7. Technisch concept op hoofdlijnen

### 7.1 Onderdelen
| Onderdeel | Keuze |
|---|---|
| Website | Eén statische site (React + TypeScript met Vite), gehost op Vercel Hobby. Twee pagina's: `/tv` en `/speel` (ook `/speel/KWPX` vanuit de QR). Geen eigen server. |
| Realtime | Supabase Realtime in het bestaande project, alleen **Broadcast** (berichten) en **Presence** (wie is er), **geen tabellen, geen opslag**. |
| Muziek | Spotify Web API + Web Playback SDK, inloggen met Authorization Code + PKCE (geen geheim in de browser). |
| Data | `songs.json` in de repo, gemaakt door een los voorbereidingsscript dat lokaal draait. |

### 7.2 De tv is de baas
- De **tv-pagina houdt de hele spelstatus bij** (spelers, tijdlijnen, tokens, stapel, fase, timers) en is de enige die regels toepast.
- Telefoons sturen alleen **intenties**: `join`, `pickSlot`, `lock`, `undoLock`, `skip`, `buy`, `claimToggle`, `steal`, `objection`, `react`, `guess`, en host-acties.
- De tv controleert elke intentie (mag dit nu? van deze speler? heeft hij tokens?), past hem toe en stuurt een **nieuwe publieke status** naar iedereen, met een oplopend versienummer.
- Telefoons tonen alleen wat in de laatste status staat. Komt er een status met een lager versienummer binnen, dan wordt die genegeerd.

### 7.3 Realtime-opzet
- Eén kanaal per spel: `tt:KWPX:<6 willekeurige tekens>`. De 6 extra tekens staan in de QR-link, zodat raden van alleen de 4 letters niet genoeg is.
- **Presence**: elke telefoon meldt `{spelerId, naam}`; de tv ziet zo wie er online is (grijs naambordje als iemand wegvalt).
- **Broadcast tv → allen**: `state` (volledige publieke status, ±2–5 kB) bij elke wijziging; bij live plaatsen hooguit 4 keer per seconde.
- **Broadcast telefoon → tv**: intenties, elk met `spelerId`, `geheim` en `berichtNr`.
- **Spelersgeheim:** bij aanmelden maakt de telefoon een willekeurig geheim (bewaard in de telefoon). De tv onthoudt welk geheim bij welke speler hoort en accepteert alleen intenties met het juiste geheim. Het geheim wordt nooit in de publieke status gezet. Zo kan niemand namens een ander tikken.
- **Limieten (Free-plan)**: 200 gelijktijdige verbindingen, 100 berichten per seconde, 100 kanaal-joins per seconde, 20 Presence-berichten per seconde, broadcast tot 256 kB per bericht, 2 miljoen berichten per maand [S38][S39][S40][S41]. Een spel heeft 11 verbindingen. Hoe Supabase een broadcast naar 11 ontvangers precies telt heb ik niet zwart op wit gevonden; reken voorzichtig met 11 berichten per status. Met maximaal 4 statussen per seconde zit je op ±44/s, onder de 100. Een avond van 3 uur blijft ruim onder de maandlimiet (schatting: 100–200 duizend berichten). Dit deel je wel met je studiewebsite.
- **Openbaar kanaal:** Supabase raadt voor productie "private channels" met inlog en databaseregels aan [S42][S43]. Dat vraagt tabellen en inloggen, wat buiten de afspraak "geen tabellen" valt. Voor een privéavond met een moeilijk te raden kanaalnaam en het spelersgeheim vind ik een openbaar kanaal acceptabel (zie hoofdstuk 9).

### 7.4 Geen spoilers op telefoons
- De publieke status bevat tijdens een beurt alleen: wie aan de beurt is, de jaartallen van de **al omgedraaide** kaarten, de gekozen plek (index), steelfiches en timers.
- Titel, artiest, jaar en Spotify-ID van het lopende nummer staan **alleen in het geheugen van de tv** en gaan pas in de status bij de onthulling.
- `songs.json` is een openbaar bestand, maar telefoons laden het niet en weten niet welk nummer speelt. Iemand die echt wil valsspelen kan het nummer ook met Shazam opzoeken; dat is hetzelfde als aan tafel stiekem op je telefoon kijken. Huisregel in de uitleg: "Shazam = je bent af".

### 7.5 Herverbinden
- **Telefoon:** `spelerId` + `geheim` staan in de opslag van de telefoonbrowser. Bij terugkomen (scherm aan, ander netwerk, pagina herladen) verbindt de pagina opnieuw met hetzelfde kanaal en stuurt `hello`; de tv antwoordt met de volledige status. De speler zit direct weer op zijn plek. iPhones verbreken websockets op de achtergrond vaak stil; daarom forceert de pagina bij elke terugkeer naar de voorgrond een nieuwe verbinding [S44].
- **Tv:** de volledige spelstatus (inclusief geheimen en de stapel) wordt na elke wijziging in de browseropslag van de pc bewaard. Bij herladen: status terugzetten, zelfde kanaal openen, Spotify opnieuw verbinden, lopend nummer opnieuw starten. Telefoons merken alleen een paar seconden "Verbinding kwijt".
- **Spotify-token** (1 uur geldig) wordt elke 50 minuten stil vernieuwd.

### 7.6 Wat bewust níet gebouwd wordt
Geen database, geen accounts, geen eigen server, geen opslag van spelgeschiedenis buiten de pc.

---

## 8. Risico's en oplossingen

### 8.1 Spotify-regels: spellen zijn officieel niet toegestaan
De Spotify Developer Policy zegt onder "prohibited applications": maak geen spel, ook geen trivia-quiz [S45]; op het Spotify-forum wordt dat voor Hitster-achtige spellen herhaald [S46][S47]. Dit is het grootste risico, en het is een beslissing voor jou, niet voor mij. Wat het in de praktijk betekent: Spotify kan je ontwikkelaarsapp (Client ID) blokkeren. Het gaat om een niet-commerciële, privé-avond met jouw eigen Premium, maar het blijft buiten hun regels. Alternatieven als je dit niet wilt: (a) een "DJ-modus" waarbij de tv alleen aangeeft *welk nummer* (een nummer uit de lijst) een vrijwillige DJ op zijn eigen Spotify moet afspelen, zonder Spotify-koppeling in de site; (b) de muziek handmatig vanuit de Spotify-app laten spelen terwijl de site alleen het bord is. Beide zijn omslachtiger.

### 8.2 Overige risico's
| Wat kan misgaan | Oplossing |
|---|---|
| Spotify Web Playback SDK wordt niet "ready" | Eén speler per pagina, 15 s tijdslimiet, dan terugvaloptie "Spotify-app op deze pc" (6.2). Proefbeurt de dag ervoor. |
| Development Mode: max 5 gebruikers per Client ID [S18] | Alleen de host logt in met Spotify; spelers niet. Geen probleem. |
| Host-telefoon toont wat er speelt | Spotify-app op host-telefoon afsluiten (6.2). Staat in de checklist op het "Geluid aan"-scherm. |
| Spotify-token verloopt midden in het spel | Stil vernieuwen elke 50 min; bij fout het scherm "Spotify is even weg". |
| Nummer niet afspeelbaar | Vooraf filteren, tijdens spel na 6 s automatisch volgende (6.4). |
| Verkeerd jaartal → ruzie | Driedelige jaarbepaling + controlelijst (6.3). Host kan in het hostmenu een uitslag corrigeren. |
| Supabase-project is gepauzeerd (Free-projecten pauzeren na een week zonder database-activiteit [S48][S49]) | Dag ervoor het studieproject openen in het Supabase-dashboard; studiewebsite gebruikt de database toch regelmatig. Tv toont bij geen verbinding: "Realtime niet bereikbaar". |
| Wifi hapert | Elke telefoon herverbindt zelf; de tv is de baas en mist niets. Tip: gasten mogen ook 4G gebruiken, dat werkt net zo goed. |
| Telefoon valt in slaap | Wake Lock (5.5) + herverbinden. |
| Lege accu | Pagina is licht (donker thema, geen video). Speler zonder accu: host verwijdert hem of hij speelt verder op de telefoon van een ander (opnieuw aanmelden met dezelfde naam → de tv vraagt de host "Is dit Daan?" en zet hem terug). |
| Iemand loopt weg tijdens zijn beurt | 20 s wachten, dan beurt overslaan (2.9). |
| Twee mensen steel-tikken tegelijk | Volgorde zoals de tv ontvangt (2.5). |
| Dubbele tikken / dubbele berichten | Knoppen direct grijs, berichtnummers (5.4). |
| Host ververst per ongeluk de tv | Status uit browseropslag (7.5). |
| Iemand opent de tv-pagina op een tweede apparaat | De tv-pagina claimt het kanaal; een tweede tv krijgt "Er is al een tv actief" en kan alleen meekijken. |
| Iemand probeert in te breken in het kanaal | Lange kanaalnaam + spelersgeheim (7.3). |
| Valsspelen met Shazam | Huisregel; als echt nodig: tv-volume lager en mensen verder van de speakers. |
| Partij duurt te lang | Speeltijdschatting in lobby, Snelle avond, duo's (3.4). |
| Tv-letters onleesbaar van 3 m | Minimale maten (4.6), getest op 1920×1080 in de mockups. |
| Browser blokkeert geluid | Verplicht "Klik om te beginnen" (6.2). |
| Kleurenblinde spelers | Letter-avatar + iconen (✓ ✗) naast elke kleur. |
| Spotify beperkt de API verder | Speelbaar houden zonder extra endpoints: alleen afspelen, playlist inlezen gebeurt al vooraf. |

---

## 9. Keuzes en aannames

### 9.1 Mijn keuzes (met het alternatief)
| Keuze | Alternatief dat ik overwoog | Waarom deze |
|---|---|---|
| Stelen pas **na** het vastzetten | Stelen al tijdens het plaatsen (Bijlage B) | Zo werkt het aan tafel: je zet in op een kaart die al ligt. Tijdens het plaatsen is er nog niets om op te stelen, en dan gaat de actieve speler zich aanpassen aan de stelers. |
| Bezwaar-systeem voor titel/artiest | Host beslist (Bijlage B) of stemmen met meerderheid | Host speelt zelf mee (belangenconflict). Gewoon stemmen kost iedere keer iedereen een tik; met "goed tenzij bezwaar" tik je alleen als het echt fout was. |
| Kopen = je huidige beurt | "Altijd" + volgende beurt overslaan (VS-regels) | Zelfde effect, maar geen onderbrekingen en niets om te onthouden. |
| Startkaart telt mee voor de 10 | Startkaart telt niet mee | De regels spreken over 10 kaarten in de tijdlijn; de startkaart ligt in de tijdlijn. |
| Geen dubbele startjaren, startjaren 1960–2015 | Volledig willekeurig | Eerlijker, en de computer kan het. |
| Spelersvolgorde = volgorde van binnenkomst, aanpasbaar | Gelote volgorde met animatie (Bijlage B noemde dit) | Snel en voorspelbaar; vrienden gaan vaak in een kring zitten in de volgorde waarin ze scannen. |
| Telefoon-tijdlijn **verticaal** | Horizontaal scrollen | Verticaal scrollen is natuurlijker met de duim en past 10+ kaarten met grote tikdoelen. |
| Tikken i.p.v. slepen | Slepen | Werkt met één hand en een drankje. |
| Plaatstimer 60 s, instelbaar | Geen timer | Bij 10 spelers is wachten het grootste probleem. |
| Meegokken zonder invloed op de score | Punten voor meegokken | Houdt de echte regels zuiver, maar geeft iedereen elke beurt iets te doen. |
| Speeltijdschatting + Snelle avond/duo's | Altijd 10 kaarten | 10 spelers × 10 kaarten ≈ 2 uur; eerlijk tonen en laten kiezen. |
| Host speelt mee met eigen telefoon; hostmenu op telefoon | Hostbediening via toetsenbord pc | De host zit tussen de vrienden, niet achter de pc. |
| Vite + React + TypeScript | Next.js | Geen server nodig; Vite is eenvoudiger voor een statische site. |
| Web Playback SDK + terugval Spotify-app | Alleen de SDK | De SDK is in 2026 grillig (6.2). |
| Playlist eerst kopiëren naar eigen playlist | Direct de Hitster-playlist lezen | Kan niet meer in Development Mode (6.1). |
| Openbaar Realtime-kanaal met lang kanaalnaamdeel + spelersgeheim | Private channels met RLS | Private channels vragen databaseregels en inloggen; dat botst met "geen tabellen". |
| Geen albumhoezen | Hoezen tonen bij onthulling (Bijlage B) | Gevraagd: geen beschermd beeld. Ook in het spel zelf is het niet nodig; het kaartje met jaar en titel is genoeg. (Kanttekening: Spotify's eigen regels vragen bij afspelen eigenlijk om hoes en metadata te tonen [S45]; als je dat wilt volgen, kun je bij de onthulling de hoes laten zien.) |
| Geluidseffecten zelf gemaakt in de browser | Geluidsbestanden | Geen bestanden, geen rechten, klein. |
| Nummers starten op 0:00 met optionele `startMs` | Altijd vanaf het refrein | Zoals het echte spel; per nummer aanpasbaar. |
| Overgeslagen nummers niet onthullen tijdens het spel | Wel onthullen | Zo gaat het in het echte spel; in het eindoverzicht wel te zien. |
| Late instappers tot einde ronde 2 | Nooit / altijd | Mensen komen later binnen op een feest; na ronde 2 is het oneerlijk. |
| Max 1 steal per speler per beurt | Onbeperkt | Zoals aan tafel; voorkomt dat iemand met 5 tokens alle gaten dichtzet. |

### 9.2 Antwoorden op de open vragen uit Bijlage B
| Vraag | Antwoord |
|---|---|
| Eén playlist of per decennium/genre? | Eén playlist (de Hitster-kopie). Decennium-filter komt later (hoofdstuk 10). |
| Timer per beurt? | Ja: 60 s plaatsen, instelbaar of uit. |
| Wie beoordeelt titel en artiest? | De groep via het bezwaar-systeem; host kan corrigeren. |
| Speelt de host mee? | Ja, met eigen telefoon en een hostmenu. |
| Teams bij 10 personen? | Ja, als instelling "duo's"; de lobby raadt het aan bij 8+ spelers. |
| Stijl/kleuren/sfeer? | "Nachtradio" (hoofdstuk 4). |

### 9.3 Aannames
- De tv-pc heeft Chrome of Edge en speakers/geluid via de tv.
- Gasten hebben een smartphone met een moderne browser (iOS 16.4+ of recente Android).
- Er is wifi of 4G/5G in huis.
- Er zijn ±300 nummers; een avond gebruikt er hooguit ±250.
- De speeltijdschattingen in 3.4 zijn gissingen op basis van een aangenomen trefkans, geen metingen.

---

## 10. Mogelijke uitbreidingen
- **Coöperatief:** één gedeelde tijdlijn op de tv, team start met 5 tokens, fout = −1 token, 10 kaarten halen voor de tokens op zijn [S1].
- **Decennium- of genrefilter** bij het starten (vraagt alleen een kolom in `songs.json`).
- **Eerlijke laatste ronde:** wie het doel haalt, wint pas als iedereen in die ronde nog geweest is.
- **Meerdere playlists** (Guilty Pleasures, 100% NL) als keuze in de lobby.
- **Statistieken** na afloop als deelbaar plaatje: moeilijkste nummer, beste decennium per speler.
- **Toeschouwers** die alleen meegokken en reageren (al voorbereid in de opzet).
- **Themakleuren** (zomer, kerst) met hetzelfde ontwerp.
- **Bingo-variant** of "raad het decennium"-snelronde als opwarmer.
- **Spraakherkenning** voor titel/artiest (twijfelachtig in een druk feest; lage prioriteit).

---

## 11. Bronnen
Geraadpleegd op 24 november 2026.

**Hitster-regels**
- [S1] Hitster, regels (en-lb), coöperatief en teams: https://hitstergame.com/en-lb/?p=156662
- [S2] Hitster, regels (en-za), Pro en Expert: https://hitstergame.com/en-za/?p=156581
- [S3] Hitster, regels (en-ph/en-za), tokens, 10 kaarten, max 5, kopen vóór luisteren: https://hitstergame.com/en-ph/?p=169442 en https://hitstergame.com/en-za/?p=156581
- [S4] Hitster, regels (en-nz), zelfde jaar en jaartaldefinitie: https://hitstergame.com/en-nz/?p=11906
- [S5] Hitster, regels (en-us), kopen en daarna beurt overslaan: https://hitstergame.com/en-us/?p=80391
- [S6] Hitster, regels (en-au), wie het eerst roept: https://hitstergame.com/en-au/?p=156678
- [S7] Hitster, regels (en-au), startopstelling en omdraaien: https://hitstergame.com/en-au/?p=5919
- [S8] Hitster, regels (en-us), stelen: https://hitstergame.com/en-us/?p=5927
- [S9] Hitster, regels (en-au), niet twee tokens op één plek, Pro/Expert steal: https://hitstergame.com/en-au/?p=5917
- [S10] Hitster, tip minder tokens/eigen doel (en-au): https://hitstergame.com/en-au/?p=5917
- [S11] Hitster Nordics, jaartal bij heruitgave/remaster: https://nordics.hitstergame.com/how-to-play/
- [S12] Bol.com, Hitster Original NL (2–10 spelers, 30 min): https://www.bol.com/nl/nl/p/jumbo-hitster-partyspel-actiespel/9300000101253647/ en https://www.bol.com/nl/nl/p/jumbo-hitster-guilty-pleasures-partyspel-actiespel/9300000150893944/
- [S13] RulesPal, Summer Party, kopen vóór luisteren: https://rulespal.com/hitster-summer-party/rulebook
- [S14] RulesPal, Hitster rulebook: https://rulespal.com/hitster/rulebook
- [S15] RulesPal, Hitster Magyar (token verdienen ook bij foute plaatsing): https://rulespal.com/hitster-magyar-kiadas/rulebook
- [S16] Hitster FAQ (en-us) met playlistlinks: https://hitstergame.com/en-us/faq-v3/
- [S17] Hitster FAQ (en-ae), editie per land: https://hitstergame.com/en-ae/faq-v3/

**Spotify**
- [S18] Spotify, Update on Developer Access and Platform Security (6 feb 2026): https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security
- [S19] Spotify, February 2026 Migration Guide en changelog: https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide en https://developer.spotify.com/documentation/web-api/references/changes/february-2026
- [S20] Spotify, Track Relinking / Get Playlist Items (`is_playable`): https://developer.spotify.com/documentation/web-api/concepts/track-relinking en https://developer.spotify.com/documentation/web-api/reference/get-playlists-items
- [S26] Spotify, Web Playback SDK (Premium vereist, browsers): https://developer.spotify.com/documentation/web-playback-sdk
- [S27] Spotify, Web Playback SDK uit bèta, `autoplay_failed`: https://developer.spotify.com/blog/2021-09-13-web-playback-sdk-out-of-beta
- [S28] MDN, Autoplay guide: https://developer.mozilla.org/en-US/Web/Media/Autoplay_guide
- [S29] Spotify Community, eerste afspeelopdracht faalt: https://community.spotify.com/t5/Spotify-for-Developers/Spotify-Web-Playback-SDK-Initial-playback-not-working-Player-not/td-p/5464378
- [S30] Spotify Community, connect() blijft hangen in Development Mode (2026): https://community.spotify.com/t5/Spotify-for-Developers/Web-Playback-SDK-player-connect-never-resolves-in-Development/td-p/7392190
- [S31] GitHub, laurentChin/blind-test issue #78 (oorzaak en oplossing, okt 2026): https://github.com/laurentChin/blind-test/issues/78
- [S32] Spotify Community, Web Playback SDK en Safari: https://community.spotify.com/t5/Spotify-for-Developers/Web-Playback-SDK-Playing-song-directly-in-browser-issues-IOS/td-p/5538195
- [S37] Spotify Community, `is_playable` niet altijd juist: https://community.spotify.com/t5/Spotify-for-Developers/is-playable-field-returns-incorrect-result/m-p/5512092/highlight/true
- [S45] Spotify Developer Policy (o.a. III "Some prohibited applications"): https://developer.spotify.com/policy/
- [S46] Spotify Community, games/quizzes niet toegestaan: https://community.spotify.com/t5/Spotify-for-Developers/Game-development-similar-to-Hitster/td-p/6554648
- [S47] Spotify Community, gebruik API voor bordspel: https://community.spotify.com/t5/Spotify-for-Developers/use-of-the-API-for-a-board-game/m-p/6731152

**MusicBrainz**
- [S33] MusicBrainz API: https://musicbrainz.org/doc/MusicBrainz_API
- [S34] MetaBrainz forum, `first-release-date` per opname: https://community.metabrainz.org/t/obtaining-the-year-of-release-for-a-specific-track/813702
- [S35] MusicBrainz, Rate Limiting: https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting
- [S36] MusicBrainz wiki, max 1 verzoek per seconde: https://wiki.musicbrainz.org/ws/2

**Supabase**
- [S38] Supabase Realtime Limits: https://supabase.com/docs/guides/realtime/limits
- [S39] Supabase Realtime Quotas: https://supabase.com/docs/guides/realtime/quotas
- [S40] Supabase Realtime Reports (payload 256 kB Free): https://www.supabase.com/docs/guides/realtime/reports
- [S41] Supabase Realtime Pricing (2 miljoen berichten Free): https://supabase.com/docs/guides/realtime/pricing.md
- [S42] Supabase Realtime Authorization: https://supabase.com/docs/guides/realtime/authorization
- [S43] Supabase Getting Started with Realtime (private channels aanbevolen): https://supabase.com/docs/guides/realtime/getting_started
- [S44] Supabase, project gepauzeerd/stille verbroken verbindingen op de achtergrond: https://supabase.com/docs/guides/troubleshooting/realtime-project-suspended-for-exceeding-quotas
- [S48] Supabase, Project Pausing: https://supabase.com/docs/guides/platform/pausing
- [S49] Supabase, prijzen (pauze na 1 week, max 2 actieve projecten): https://supabase.com/docs/pricing

**Browser en toegankelijkheid**
- [S21] web.dev, Screen Wake Lock in alle browsers: https://web.dev/blog/screen-wake-lock-supported-in-all-browsers
- [S22] Can I use, Screen Wake Lock: https://caniuse.com/wake-lock
- [S23] WebKit bug 254545, wake lock werkt niet als beginscherm-app: https://bugs.webkit.org/show_bug.cgi?id=254545
- [S24] Apple Human Interface Guidelines, Accessibility (min. 44×44 pt): https://developer.apple.com/design/human-interface-guidelines/accessibility
- [S25] W3C, WCAG 2.2, 2.5.8 Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

*Niet gevonden / niet zeker:* een officiële lijst met alle Hitster-kaarten en jaartallen; of de startkaart officieel meetelt voor de 10; hoe Supabase een broadcast naar meerdere ontvangers precies meetelt voor het quotum; of Spotify een privé-feestspel zou handhaven onder hun spelverbod. Over trillen: dat Safari op iPhone `navigator.vibrate` niet ondersteunt is algemeen bekend uit de browserdocumentatie, maar heb ik in dit onderzoek niet apart nageslagen.
