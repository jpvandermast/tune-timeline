# Tune Timeline — Definitief Concept & Visueel Ontwerp

> **Project:** Tune Timeline (online muziektijdlijn-partyspel voor 8–10 spelers)  
> **Opzet:** TV als centraal spelbord en muziekspeler (via pc met Spotify Premium), eigen telefoons als controllers zonder app of account.  
> **Datum:** November 2026

---

## 1. Samenvatting

**Tune Timeline** is een gratis online muziektijdlijn-spel voor 8 tot 10 vrienden op een feestavond, trouw aan de spelregels van Hitster maar met een volledig eigen naam, uiterlijk (*Midnight Vinyl & Amber Brass*) en online ritme. De pc aan de tv toont het centrale spelbord en speelt muziek af via het Spotify Premium-account van de host; spelers scannen een QR-code en spelen direct op hun eigen telefoon zonder app of account. Iedereen start met 1 open muziekkaart en 2 tokens en probeert als eerste 10 hits in chronologische volgorde te verzamelen. Op de telefoon plaats je kaarten met één duim op een verticale tijdlijn, terwijl medespelers na het vastzetten 8 seconden krijgen om via een grote **STEAL!**-knop een fout geplaatste kaart voor 1 token weg te kapen. De volgende speler fungeert automatisch als 1-tik scheidsrechter voor titel en artiest, zodat de host zelf vanaf de bank kan meespelen. Op de 1920×1080 tv houdt een compacte 10-speler-rail bovenin alle scores scherp leesbaar op 3 meter, terwijl het midden volledig focust op de grote tijdlijn van de actieve speler met decennium-gekleurde kaarten. Omdat Spotify sinds februari 2026 strengere API-regels hanteert en remasters foute jaartallen geven, wordt de playlist vooraf via MusicBrainz omgezet naar één vast `songs.json`-bestand. Het spel draait gratis op Vercel Hobby en gebruikt alleen Supabase Realtime Broadcast/Presence zonder tabellen, waarbij de host-pc alle antwoorden verborgen houdt tot de onthulling.

---

## 2. Spelregels (definitief)

Bij elke regel staat aangegeven of deze rechtstreeks uit het fysieke spel komt (`[Echt spel]`) of bewust is aangepast voor een soepele online avond (`[Online aanpassing]`). Regionale verschillen zijn gecontroleerd op de officiële Nederlandse (`hitstergame.com/nl-nl`) en Scandinavische (`nordics.hitstergame.com`) regelpagina's.

### Startopstelling & doel
- **Aantal spelers:** 2 tot 10 actieve spelers; extra vrienden kunnen als toeschouwer meekijken zonder mee te spelen. `[Echt spel: 2–10 spelers]` `[Online aanpassing: toeschouwersmodus]`
- **Startkaart:** Elke speler krijgt 1 willekeurige muziekkaart open op zijn tijdlijn met het jaartal zichtbaar. Deze startkaart **telt mee** als kaart 1 van de 10 (je moet dus nog 9 kaarten winnen). `[Echt spel — bevestigd op hitstergame.com/nl-nl en nordics.hitstergame.com]`
- **Win-conditie:** De eerste speler met **10 correct geplaatste kaarten** op zijn tijdlijn wint direct. In de lobby is het doel instelbaar op **8 kaarten** (snelle ronde met 10 man, ±45 min) of **10 kaarten** (standaard, ±60 min). `[Echt spel: 10 kaarten]` `[Online aanpassing: optioneel 8 kaarten voor grote groepen]`
- **Definitie van jaartal:** Het jaar waarin die uitvoering van het nummer door die artiest voor het eerst publiekelijk beschikbaar was (fysiek als single/album of digitaal via download/stream, op welke markt dan ook) — dus nooit het jaar van een latere remaster of verzamelalbum. `[Echt spel — nordics.hitstergame.com]`
- **Starttokens:**
  - *Original:* **2 tokens** per speler (conform de Nederlandse en internationale editie; de Scandinavische versie geeft 3 starttokens — dat is optioneel instelbaar in de lobby). Maximum is altijd **5 tokens**. `[Echt spel — hitstergame.com/nl-nl]`
  - *Pro:* **5 tokens**, geen nieuwe tokens te verdienen. `[Echt spel]`
  - *Expert:* **3 tokens**, geen nieuwe tokens te verdienen. `[Echt spel]`

### Beurtvolgorde
- **Wie begint:** De speler met het **oudste jaartal** op zijn startkaart begint. Bij gelijke startjaren wint de vroegste volledige releasedatum (als die bekend is), anders een korte loting op de tv. `[Echt spel]`
- **Volgorde daarna:** De overige spelers krijgen bij de start een willekeurig gelote vaste rondgang (met een korte 2-seconden volgorde-animatie op de tv), zodat niemand de hele avond direct achter de grootste muziekkenner zit. `[Online aanpassing — vervangt fysiek met de klok mee zitten]`

### Verloop van een normale beurt (Original)
1. **Beurtstart (optioneel kaart kopen):** De actieve speler ziet op zijn telefoon *"Jouw beurt!"* met één grote knop **"Start nummer"** (en als hij ≥3 tokens heeft een secundaire knop **"Koop kaart (3 tokens)"**). Tikt hij binnen 8 seconden niet, dan start de muziek automatisch zodat de avond niet stilvalt. `[Online aanpassing]`
2. **Luisteren & plaatsen:** De tv speelt het nummer af zonder titel, artiest, jaar of hoes te tonen. De actieve speler kiest op zijn telefoon een plek op zijn eigen tijdlijn (vóór de oudste kaart, tussen twee kaarten of ná de nieuwste kaart) en tikt op **"Vastzetten"**. Op de tv glijdt de raadselkaart live mee naar de gekozen plek zodat de hele kamer meekijkt. `[Echt spel + online live-preview]`
3. **Optioneel tijdens het luisteren (vóór vastzetten):**
   - **Overslaan (1 token):** Nummer te vaag? Betaal 1 token; het nummer gaat weg en direct start een nieuw nummer. Je mag dit meerdere keren doen zolang je tokens hebt. `[Echt spel]`
   - **Titel & artiest claimen (Original):** Tik de schakelaar **"Ik weet titel & artiest (+1 token)"** aan en noem ze **hardop in de kamer** vóórdat je op Vastzetten drukt. `[Echt spel, online vertaald naar een aan/uit-vinkje + hardop zeggen]`
4. **Steal-venster (8 seconden ná vastzetten):** Zodra de actieve speler vastzet, gaat er een scherp aftelvenster van **8 seconden** open voor medespelers met ≥1 token. Zij tikken op **"STEAL! (1 token)"** en kiezen een nog vrije plek in de tijdlijn van de actieve speler. De plek van de actieve speler zelf is in *Original* niet kiesbaar (als die goed is wint hij toch). Zodra niemand tokens heeft, of iedereen op "Pas" tikt, sluit het venster direct. `[Online aanpassing — in het echte spel roep je "HITSTER!" vóór het omdraaien; een vaste 8-secondenklok voorkomt eindeloos wachten én voorkomt dat de actieve speler nog snel schuift]`
5. **Onthulling:** De raadselkaart flipt op de tv om en toont jaartal, artiest, titel en een decennium-kleur. `[Echt spel]`
6. **Beoordeling titel & artiest (indien geclaimd, of altijd in Pro/Expert):** De **beurt-scheidsrechter** — automatisch de speler die hierna aan de beurt is — ziet titel en artiest op zijn telefoon en tikt **"✓ Klopt"** of **"✕ Niet goed"** (met de groep in de kamer als back-up). De host kan altijd overrulen via zijn telefoon of het pc-toetsenbord (`Y`/`N`). `[Online aanpassing]`
7. **Kaart & tokens afhandelen:**
   - **Actieve speler goed:** Houdt de kaart op die plek. Alle ingezette steal-tokens van tegenstanders zijn verloren. `[Echt spel]`
   - **Actieve speler fout, één stealer goed:** Die stealer wint de kaart; de kaart wordt automatisch chronologisch in de eigen tijdlijn van de stealer gezet. In *Original* is zijn gebruikte token opgebruikt; in *Pro* en *Expert* houdt hij zijn token terug. Overige stealers zijn hun token kwijt. `[Echt spel]`
   - **Actieve speler fout, geen stealer goed:** Kaart wordt afgelegd (verdwijnt uit het spel); alle ingezette steal-tokens zijn verloren. `[Echt spel]`
   - **Token verdiend (Original):** Had de actieve speler titel én artiest goed genoemd, dan krijgt hij +1 token (tot maximaal 5), **ook als zijn jaartalplaatsing fout was**. `[Echt spel — hitstergame.com/nl-nl]`

### Hetzelfde jaartal
- Heeft het nieuwe nummer exact hetzelfde jaartal als een kaart die al in de tijdlijn ligt, dan tellen **alle direct aangrenzende plekken** (ervoor én erna, en bij twee kaarten uit hetzelfde jaar ook ertussen) als **goed**. `[Echt spel]`

### Tokens: alle 4 acties samengevat
| Actie | Kosten | Wanneer | Effect | Bron |
|---|---|---|---|---|
| **Overslaan** | 1 token | Eigen beurt, vóór vastzetten | Kaart weg, direct nieuw nummer | `[Echt spel]` |
| **Stelen** | 1 token | Andermans beurt, in het 8s steal-venster | Claim 1 vrije plek; bij succes kaart naar jouw tijdlijn (in Pro/Expert krijg je token terug) | `[Echt spel + 8s venster]` |
| **Kaart kopen** | 3 tokens | Begin van je eigen beurt, vóórdat de muziek start | Krijg direct 1 open kaart automatisch op de juiste plek; daarna speel je gewoon je beurt verder (behalve als dit kaart 10 is) | `[Online aanpassing: tijdstip afgebakend; geen beurt overslaan conform NL/Nordics-regels]` |
| **Token verdienen** | Gratis | Eigen beurt (alleen *Original*) | Hardop juiste titel + artiest → +1 token (max 5), ook bij foute plaatsing | `[Echt spel]` |

### Moeilijkheidsniveaus
- **Original (standaard):** Alleen relatieve plek op de tijdlijn telt. Start met 2 tokens, verdienen via titel + artiest. `[Echt spel]`
- **Pro:** Start met 5 tokens, geen tokens bijverdienen. Om een kaart te winnen óf te stelen moet je de juiste plek hebben **én** hardop titel + artiest goed noemen (gekeurd door de scheidsrechter). Bij een geslaagde steal mag je je token houden. Omdat de actieve speler zijn eigen plek kan verliezen op titel/artiest, mogen stealers in Pro óók de plek van de actieve speler kiezen. `[Echt spel + online verduidelijking voor steal op dezelfde plek]`
- **Expert:** Start met 3 tokens, geen tokens bijverdienen. Zowel voor winnen als stelen moet je de juiste plek kiezen **én** titel, artiest én het **exacte jaartal** goed noemen. Bij een geslaagde steal mag je je token houden. `[Echt spel]`

### Uitzonderingen en randgevallen
1. **Twee spelers tegelijk op 10 kaarten:** Door onze regel dat je alleen aan het begin van je eigen beurt een kaart mag kopen (en een steal alleen slaagt als de actieve speler fout zat), kunnen twee spelers in een normale beurt **nooit** tegelijk op 10 kaarten komen. Mocht in de lobby de optionele huisregel *"Ronde afmaken (gelijke beurten)"* aan staan en twee spelers eindigen dezelfde ronde op 10 kaarten, dan wint: (a) wie de meeste tokens over heeft, (b) bij gelijke stand een **Tiebreaker-ronde** (1 nummer, beide spelers typen een exact jaartal; wie het dichtstbij zit wint). `[Online aanpassing]`
2. **Twee stealers tikken tegelijk op dezelfde plek:** De host verwerkt meldingen één voor één met een volgnummer op ontvangsttijd: **wie het eerst tikt krijgt die plek**. De tweede krijgt direct een zachte melding *"Net bezet door [naam]! Kies een andere plek"* zolang de klok nog loopt. (Optioneel in lobby: Scandinavische regel waarbij bij gelijktijdige claim de speler met de minste kaarten voorrang krijgt.) `[Echt spel: NL "eerst roepen" vs Nordics "minste kaarten"]`
3. **Twee stealers zitten allebei goed door hetzelfde jaartal:** Stel de actieve speler heeft `1996` in zijn tijdlijn en plaatst een ander nummer uit `1996` fout. Stealer A claimt direct *vóór* `1996`, Stealer B direct *ná* `1996`. Beide plekken zijn chronologisch juist. Regel: **de stealer die als eerste bevestigde krijgt de kaart; de tweede stealer krijgt zijn ingezette token netjes terug.** `[Online aanpassing]`
4. **Actieve speler laat de beurttimer aflopen (45s):** Had hij al een plek aangetikt maar nog niet op "Vastzetten" gedrukt, dan wordt die plek automatisch vastgezet. Had hij nog niets aangetikt, dan krijgt hij 10 seconden genadetijd (*"Kies nu een plek!"*); daarna vervalt de kaart en opent eventueel het steal-venster voor de rest. `[Online aanpassing]`
5. **Speler loopt weg (wc/drankje) of valt weg (lege accu):** Op de tv verschijnt een grijs pauze-icoontje naast zijn naam. Als hij aan de beurt komt, kan de host vanaf zijn eigen telefoon met 1 tik kiezen voor **"Beurt overslaan"** (hij blijft in het spel) of **"Speler verwijderen"**. Komt iemand terug met een andere telefoon (lege accu), dan kan hij de QR scannen en op *"Neem plek over van [naam]"* tikken (host keurt met 1 tik goed). `[Online aanpassing]`
6. **Nummer is niet afspeelbaar op Spotify:** De host-pc merkt dit automatisch op en laadt binnen 3 seconden een nieuw nummer zonder tokenverlies. `[Online aanpassing]`
7. **Stapel nummers raakt op:** Eerder fout geraden en overgeslagen kaarten worden automatisch opnieuw geschud (nooit kaarten die al op een tijdlijn liggen). `[Online aanpassing]`

---

## 3. Spelbeleving van begin tot eind

### Voorbereiding op de avond (2 minuten)
De kamer zit vol vrienden met drankjes. Jij (de host) sluit je laptop via HDMI aan op de tv, opent `tune-timeline.vercel.app/host` in Chrome (volledig scherm met `F11` of groene knop) en klikt op **"Inloggen met Spotify"**. Omdat je browser je sessie onthoudt, ben je met één klik verbonden. Je klikt op **"Test geluid & open lobby"** — deze ene klik ontgrendelt direct het geluid in de browser (tegen autoplay-blokkades) en speelt een warme vinyl-krak + korte akkoordtoon af zodat je meteen hoort dat het tv-geluid goed staat.

### Binnenkomen in de lobby (2–3 minuten)
Op de tv staat links een grote, haarscherpe QR-code met daaronder een korte 4-lettercode (bijv. `B R A M` of `K I C K`) en rechts de instellingen-chips (*Hitster NL+Int · 10 kaarten · Original · Timer 45s*). Iedereen richt zijn camera op de tv — ook jijzelf op je eigen telefoon, want jij speelt gewoon mee. Binnen 10 seconden kiest ieder zijn naam en een vrije spelerkleur (met bijbehorend symbooltje) en verschijnt met een zachte *pop* op de tv. Zodra alle 8 tot 10 vrienden erin staan, druk je vanaf de pc óf vanaf het host-menu op jouw eigen telefoon op **"Start spel"**.

### De opening (30 seconden)
De tv schudt de stapel, deelt iedereen 1 open startkaart uit en zoomt kort in op wie het oudste jaar trok: *"Ties opent met 1974! Hier is de speelvolgorde."* Op elke telefoon zie je meteen je eigen startkaart en je 2 gouden tokens. De stemming zit er direct in (*"Haha, ik begin met 2021, dit wordt makkelijk!"*).

### Het ritme van één beurt (gemiddeld 55–70 seconden)
| Fase | Duur | Wat gebeurt er in de kamer? |
|---|---|---|
| **Beurtstart** | 3–6 sec | TV roept *"Ties is aan de beurt!"* met kort pingeltje. Ties' telefoon licht goud op. Hij tikt *"Start nummer"* (of koopt een kaart voor 3 tokens). |
| **Luisteren & plaatsen** | 20–35 sec | Het nummer knalt uit de tv-speakers. De draaiende vinylplaat pulseert op de maat. Ties scrolt op zijn telefoon door zijn tijdlijn, twijfelt tussen 1988 en 1996, tikt een plek aan — de hele kamer ziet de raadselkaart live heen en weer schuiven op de tv en begint zachtjes te lachen of te pokeren. |
| **Vastzetten & Steal-venster** | 8 sec | Ties drukt *"Vastzetten"*. De muziek dimt 20%, de tv-rand gloeit koraal-amber en telt 8 seconden af: *"ZIT TIES GOED? STEAL NU!"*. Lisa denkt dat het nummer uit 2003 is, ramt op **STEAL!** en claimt razendsnel plek 4. Haar avatar-chip ploft live op de tv-tijdlijn. |
| **Onthulling & flip** | 4 sec | Korte drumroffel (0,8s), de raadselkaart draait in 3D om op de tv: **2003 — OutKast · Hey Ya!** De kamer barst uit (*"JAAA! Ik wist het!"*). |
| **Keuring (indien claim) & resultaat** | 5–8 sec | Als Ties titel+artiest claimde, tikt de volgende speler in 2 seconden op *"✓ Klopt"*. De kaart schuift naar Lisa's tijdlijn, scorebalk telt op, korte reactie-moment, door naar de volgende speler. |

### Hoe lang duurt een hele partij?
Met een gemiddeld slagingspercentage van ~65–70% (inclusief steals) zijn er per speler ongeveer 12–14 beurten nodig om van 1 naar 10 kaarten te komen — en omdat steals ook kaarten opleveren, haalt de winnaar 10 kaarten meestal al rond ronde 7 tot 9.
- **Met 8 spelers (doel 10 kaarten):** ~55–70 beurten × ~55 sec = **50 tot 65 minuten**.
- **Met 10 spelers (doel 10 kaarten):** ~70–85 beurten × ~55 sec = **65 tot 80 minuten**.
- **Tip in de lobby bij 10 spelers:** Zet het doel op **8 kaarten** voor een strakke partij van **45 tot 55 minuten**, zodat je er makkelijk nog een tweede potje achteraan plakt.

### Hoe blijven 9 wachtende spelers constant betrokken?
1. **Steal-jacht op elke beurt:** Elke keer dat iemand aarzelt of een kaart duidelijk verkeerd legt, schieten hoofden naar beneden richting de **STEAL!**-knop. Je moet *blijven* luisteren om zelf sneller te kunnen winnen.
2. **Stille meegok & feest-reacties (zonder regels te breken):** Terwijl je wacht zie je op je telefoon het live bord én vier snelle reactieknoppen (`🔥 Banger`, `🫣 Gewaagd`, `🤷 Geen idee`, `🎤 Meezingen`) die als kleine gekleurde wolkjes onderaan de tv voorbijzweven (max 1 per 5 sec tegen spam, uitschakelbaar). Daarnaast kun je optioneel voor de lol een schuifbalkje op een jaartal zetten (*"Jouw gok"*) — dat levert geen kaarten op, maar aan het einde van de avond kroont het spel de *"Beste meegokker vanaf de bank"*.
3. **Wisselende scheidsrechter:** Omdat steeds de *volgende* speler de titel/artiest-keuring doet, word je vlak vóór je eigen beurt al wakker geschud en actief bij het scherm betrokken.
4. **Matchpoint-spanning:** Zodra iemand 8 of 9 kaarten bereikt, kleurt zijn balk in de bovenrij warm amber/goud met een knipperend **"MATCHPOINT"**-label. De hele kamer spant samen om die speler te blokkeren of kaarten af te snoepen!

### Het einde & opnieuw spelen
Zodra de 10e kaart goed landt, barst de tv los met warme gouden confetti, een korte fanfare en het winnaarscherm met de volledige 10-kaarten tijdlijn van de winnaar, het podium (plek 1, 2, 3) en 3 luchtige avond-awards (bijv. *Snelste Stealer*, *Muziekencyclopedie*, *Dichtst bij op de bank*). Onderaan staat één grote knop **"Nog een potje (zelfde groep)"**: alle telefoons blijven gewoon verbonden, de al gespeelde nummers van deze avond worden **niet herhaald** (zolang er genoeg over zijn), iedereen krijgt een nieuwe startkaart en 2 tokens, en 5 seconden later draait de eerste plaat weer.

---

## 4. Uiterlijk en gevoel

### Visuele identiteit: *Midnight Vinyl & Amber Brass*
- **Naam:** **Tune Timeline** (ondertitel op lobby-scherm: *"Zet de hits op de juiste plek"*).
- **Logo-idee:** Een strakke, minimalistische halve vinylplaat met drie fijne groeflijnen boven een horizontale gouden tijdlijn met drie oplichtende tijdstip-punten (`• — • — •`), waarbij het middelste punt groter is en zacht nagloeit. Daarnaast de naam **TUNE** (vet, geometrisch) **TIMELINE** (iets lichter, ruim gespatieerd). Volledig eigen ontwerp — geen neon-disco, geen regenboog-cirkels, geen Hitster-elementen.
- **Sfeer:** De warme gezelligheid van een avond met vrienden rond een platenspeler, gecombineerd met de strakke overzichtelijkheid van een moderne muziekshow op tv. Donkere achtergrond zodat de tv in een schemerige woonkamer niet verblindt, met grote warme kaarten en kristalheldere cijfers.

### Kleurpalet (met hexcodes)

| Rol | Naam | Hexcode | Waar gebruikt |
|---|---|---|---|
| **Achtergrond (basis)** | Midnight Vinyl | `#0D1117` | Hoofdachtergrond tv en telefoon |
| **Oppervlak (kaarten/balken)** | Deep Slate | `#161C27` | Scorebalk, panelen, knoppenachtergrond |
| **Oppervlak verhoogd** | Warm Charcoal | `#1F2736` | Uitgelichte panelen, modale kaarten |
| **Subtiele rand** | Groove Line | `#2D3748` | Randen, scheidingslijnen, tijdlijn-rail |
| **Primaire tekst** | Warm Ivory | `#F7F3E9` | Koppen, jaartallen, artiesten (contrast > 14:1 op `#0D1117`) |
| **Secundaire tekst** | Soft Mist | `#A8B3C5` | Ondertitels, labels, timers (contrast > 7,5:1) |
| **Hoofdaccent & tokens** | Amber Brass | `#F5A623` | Actieve speler, tokens, hoofdknoppen, vinyl-label |
| **Goed / bevestigd** | Emerald Hit | `#22C57E` | Goede plaatsing, geslaagde steal, groene check |
| **Fout / Steal-alarm** | Coral Pulse | `#EF476F` | Foute plaatsing, STEAL!-knop, steal-countdown |
| **Neutraal / info** | Cobalt Glow | `#3B82F6` | Info-meldingen, herverbinden, stille gok |

#### Decennium-kleurcodes op omgedraaide muziekkaarten
Open kaarten krijgen een kleurstrook en subtiele achtergrondgloed op basis van hun decennium — zo lees je op 3 meter afstand in een oogopslag het tijdvak. **Let op:** een raadselkaart (vóór onthulling) toont nooit een decenniumkleur!

| Decennium | Kleurnaam | Hexcode |
|---|---|---|
| ≤ 1969 | Terracotta Koper | `#C96A4B` |
| 1970–1979 | Mosterd Oker | `#D99B26` |
| 1980–1989 | Koraal Kers | `#E04F6D` |
| 1990–1999 | Petrol Teal | `#1EA896` |
| 2000–2009 | Elektrisch Kobalt | `#3B82F6` |
| 2010–2019 | Diep Violet | `#8B5CF6` |
| 2020+ | Fris Smaragd | `#10B981` |

#### 10 spelerkleuren (met vormsymbool voor kleurenblindheid)
Elke speler krijgt naast een unieke, contrastrijke kleur ook een eigen geometrisch tekentje in zijn badge, zodat ook kleurenblinde spelers direct zien wie wie is:
1. Amber `#F5A623` (●) · 2. Koraal `#EF476F` (▲) · 3. Smaragd `#22C57E` (◆) · 4. Kobalt `#3B82F6` (■) · 5. Violet `#A855F7` (★) · 6. Turkoois `#14B8A6` (⬟) · 7. Oranje `#F97316` (✦) · 8. Roze `#EC4899` (♥) · 9. Limoen `#84CC16` (✚) · 10. Hemelblauw `#38BDF8` (◐).

### Lettertypes en vormtaal
- **Typografie (definitieve app):** **Space Grotesk** (600/700) voor koppen, jaartallen en scorecijfers met altijd `font-variant-numeric: tabular-nums` (zodat cijfers tijdens het aftellen niet verspringen) + **Inter** (400/500/600) voor lopende tekst en knoppen. *(In de offline HTML-mockup worden schone systeemlettertypes gebruikt met identieke verhoudingen en `tabular-nums`.)*
- **Vormtaal:** Afgeronde hoeken van `16px` op kaarten, `12px` op knoppen, `999px` (pillen) op tokens en speler-chips. Subtiele `1px` randen (`rgba(255,255,255,0.08)`), zachte donkere diepteschaduwen, en herkenbare concentrische cirkellijnen ("vinylgroeven") op achterkanten van kaarten en achter de muziekspeler.

### Kaartontwerp & 3D-flip
1. **Open muziekkaart (op de tijdlijn):** Staand formaat op tv (`132×178px` bij 5–7 kaarten, schaalt vloeiend naar `112×156px` bij 9–10 kaarten). Bovenin een `8px` hoge decennium-kleurstrook; daaronder in het midden het **jaartal in `40–48px` vet `#F7F3E9`**; onderaan een donker vlak met artiest (14–16px vet, max 1 regel met `...`) en titel (13–15px `#A8B3C5`, max 1 regel).
2. **Raadselkaart (tijdens het raden):** Zelfde formaat, maar in diep antraciet (`#1C2333`) met een subtiel SVG-patroon van vinylgroeven, een pulserende `2px` gouden rand (`#F5A623`), een groot gouden `?` (`52px`) in het midden en onderaan een live-label *"Jouw keuze"* (of *"Plek 3"*).
3. **Omgedraaide kaart (bij onthulling — vergroot op het podium, `240×310px`):** Toont bovenin een zelfgemaakt geometrisch vinyl-illustratievlak in de decenniumkleur (geen auteursrechtelijke albumhoes!), daaronder het jaartal in **`68px` extra vet**, de **artiest in `22px` vet** en de **titel in `18px`**.
4. **De 3D-flip-animatie:**
   - `0–200 ms`: Raadselkaart schaalt iets op (`1.0 → 1.06`) en trekt naar het midden van de aandacht.
   - `200–750 ms`: Echte 3D-rotatie rond de Y-as (`rotateY(0deg → 180deg)`, `perspective: 1200px`, easing `cubic-bezier(0.22, 1, 0.36, 1)`). Op precies `90deg` wisselt de voorkant naar de onthulde zijde.
   - `750–950 ms`: Zachte landing (`1.06 → 1.0`) met een gekleurde lichtkrans (`#22C57E` bij goed, `#EF476F` bij fout).
   - `1400–2000 ms`: Kaart glijdt soepel op zijn definitieve plek in de tijdlijn (van de actieve speler of de winnaar van de steal), of zakt met een subtiele rode uitvaging omlaag de aflegstapel in.

### Geluid en animaties (concreet overzicht)
Alle korte geluidseffecten worden in de browser op de tv-pc gegenereerd met de **Web Audio API** (schone, warme klanken, nul externe MP3-bestanden, en altijd ~30% zachter dan de muziek of gespeeld zodra de muziek even dimt).

| Moment | Geluid (Web Audio API) | Visuele animatie & timing |
|---|---|---|
| **Speler joint lobby** | Zachte warme hout/marimba-tik (C5, `120 ms`) | Speler-pil klapt open (`scale 0.85→1.0`, `220 ms`, lichte veer) |
| **Beurtstart** | Twee warme piano-achtige tonen (G4 → C5, `300 ms`) | Actieve speler-pil in bovenbalk licht op + zachte gouden spotlight-veeg (`400 ms`) |
| **Kaart verschuiven** | Heel subtiele vinyl-tik (`40 ms`) | Tijdlijn-kaarten schuiven elastisch opzij om ruimte te maken (`240 ms ease-out`) |
| **Vastgezet → Steal open** | Korte opwaartse synth-puls (`250 ms`) | TV-rand gloeit koraal-amber; 8s aftelbalk loopt soepel leeg (`8000 ms linear`) |
| **Steal geclaimd** | Scherpe "chip-klik" op tafel (`90 ms`) | Gekleurde steal-chip ploft met bounce op de gekozen gleuf (`260 ms`) |
| **Laatste 3s van timer** | Zachte metronoom-tik op 3, 2, 1 (`60 ms` per tik) | Cijfer pulseert (`scale 1.0→1.15→1.0`, `200 ms`) |
| **Kaart-flip (onthulling)** | Korte luchtige whoosh (`350 ms`) | 3D `rotateY(180deg)` flip (`550 ms`) |
| **Goed geplaatst / Steal raak** | Warm majeur drieklank-akkoord (C-E-G, `450 ms`) | Smaragdgroene glanspuls over kaart + `+1` badge zweeft omhoog (`600 ms`) |
| **Fout geplaatst** | Korte zachte lage dubbeltoon (E3 → C3, `350 ms`) | Kaart schudt kort horizontaal (`±8px`, `300 ms`), kleurt koraal en zakt weg (`400 ms`) |
| **Winnaar (10 kaarten)** | Feestelijke 4-noots fanfare (`900 ms`) | 60 gouden/decennium-confetti-deeltjes dwarrelen neer (`3500 ms`), podium schuift omhoog |

---

### Elk TV-scherm per toestand (1920×1080)

1. **Lobby:** Linkerhelft toont het Tune Timeline-logo, grote QR-code (`320×320px` op wit kader voor feilloos scannen vanaf de bank), de grote 4-letter roomcode (`72px` monospace) en korte URL. Rechterhelft toont de lijst van verbonden spelers (tot 10 vakken met kleur/symbool en groen verbindingsbolletje), onderaan de gekozen instellingen als overzichtelijke badges (*Playlist · 10 kaarten · Original · 45s*) en een grote gouden **"Start spel"**-knop + kleine **"Uitleg tonen"**-knop.
2. **Uitleg (1 scherm, 20 seconden):** Vier grote genummerde visuele blokken naast elkaar op 1 scherm (geen lappen tekst!): *1. Luister naar de hit · 2. Zet hem op tijd in je lijn · 3. Fout? Roep STEAL! voor 1 token · 4. Eerste met 10 kaarten wint.* Onderaan korte legenda van de 3 token-acties en knop **"Begrepen, starten!"**.
3. **Beurtstart:** Bovenin de vaste 10-speler-rail (actieve speler goud omrand). Middenin een rustige, grote aankondiging: avatar + naam van de actieve speler in `56px` (*"Bram is aan de beurt"*), zijn huidige kaartenaantal (`4 / 10`) en daaronder zijn open tijdlijn alvast zichtbaar. Rechtsonder zachte melding *"Wachten tot Bram het nummer start… (start automatisch over 5s)"*.
4. **Nummer speelt:** Bovenin de speler-rail. Linksboven in het middenpodium een draaiende SVG-vinylplaat (`140px`) met live bewegende equalizer-balkjes, tekst *"Nummer #18 speelt…"*, een circulaire of horizontale beurttimer (`34s`) en (indien aangevinkt) een gouden pill *"🎤 Bram claimt titel & artiest!"*. Daaronder de grote horizontale tijdlijn van Bram met duidelijke lege tussenplekken (`+ Plek 1`, `+ Plek 2`…).
5. **Plaatsen (live):** Zodra Bram op zijn telefoon een plek aantikt, schuiven zijn kaarten op de tv vloeiend uiteen en verschijnt de **raadselkaart (`?`)** precies op die plek met label *"Bram kiest tussen 1984 en 1996"*. Verandert Bram van gedachten, dan verhuist de raadselkaart direct mee op de tv.
6. **Steal-venster:** Bram heeft vastgezet! Boven het podium verschijnt een brede koraal-amber balk: **"VASTGEZET — WIL IEMAND STELEN?"** met grote afteller (`6s`) en een leeglopende balk. Op de tijdlijn van Bram heeft zijn raadselkaart nu een slotje (`🔒 Vastgezet`). Zodra Lisa (of meerdere spelers) stealen, verschijnt direct hun gekleurde ronde token-chip (bijv. *"▲ Lisa · STEAL!"*) op de gekozen andere gleuf in Bram's tijdlijn.
7. **Onthulling — Goed:** De raadselkaart vergroot naar het midden, draait in 3D om en onthult jaartal (`68px`), artiest en titel. Grote smaragdgroene banner: **"✓ GOED GEPLAATST! — 2003"**. De kaart landt met een groene gloed in de tijdlijn, teller springt naar `5/10`. Eventuele ingezette steal-tokens van tegenstanders knipperen kort rood en verdwijnen.
8. **Onthulling — Fout (geen steal):** Zelfde 3D-flip, maar rode koraal-banner: **"✕ HELAAS, NET MIS! — 2003 hoorde tussen 1996 en 2014"**. De kaart schudt kort en zakt naar de aflegstapel. Een klein groen pijltje wijst 2 seconden aan waar hij wél had gemoeten (zodat iedereen *"Ohhh tuurlijk!"* roept).
9. **Steal-resultaat:** Bram zat fout, maar Lisa's steal-chip stond precies op de goede gleuf! Grote feestelijke banner in Lisa's spelerkleur + smaragdgroen: **"⚡ GESTOLEN DOOR LISA! (+1 kaart)"**. De onthulde kaart vliegt richting Lisa's badge in de bovenbalk (die kort oplicht en van `5/10` naar `6/10` springt). Onderaan zie je een compacte melding van de token-mutaties (*"Lisa -1 token · Bram houdt 2 tokens"*).
10. **Tokens (overslaan / kopen / verdienen-beoordeling):**
    - *Overslaan:* Korte 2-seconden overlay-banner: *"⏭ Bram gebruikt 1 token en slaat dit nummer over — nieuw nummer wordt geladen…"*.
    - *Kaart kopen:* Feestelijke 3-seconden kaart-animatie: *"🪙 Bram ruilt 3 tokens in voor een nieuwe kaart: 1991 · Nirvana — Smells Like Teen Spirit!"* en voegt hem direct op de juiste plek toe.
    - *Titel & artiest keuren:* Rechts naast de onthulde kaart verschijnt een duidelijk kader: *"Bram noemde titel & artiest — Lisa (scheidsrechter) beoordeelt…"*. Na haar tik direct: *"✓ GOED! +1 token voor Bram"* of *"✕ Helaas geen extra token"*.
11. **Tussenstand (10 spelers overzicht):** Na elke volledige ronde (of op aanvraag via host-menu / toets `S`) toont het middenpodium 5 seconden lang een strak **2×5 grid** met alle 10 spelers op rangorde: plek (`#1` t/m `#10`), naam + kleur, kaartenaantal, tokens én een compacte miniatuur-tijdlijn van decennium-gekleurde kaartblokjes met alleen de jaartallen (`75 · 84 · 96 · 03 · 14`).
12. **Winnaar:** Donkere feestachtergrond met warme gouden confetti. Middenin: trofee-icoon, *"🏆 LISA IS DE TUNE TIMELINE-KAMPIOEN!"*, haar complete winnende tijdlijn van 10 kaarten op een rij, daaronder het podium (`#2 Bram · 9 kaarten`, `#3 Ties · 8 kaarten`) en 3 speelse avond-awards (*Snelste Stealer*, *Muziekencyclopedie*, *Beste Meegokker*). Onderaan knoppen **"Nog een potje"** en **"Terug naar lobby"**.
13. **Foutmeldingen & verbinding verloren:**
    - *Spotify autoplay geblokkeerd:* Duidelijke zwevende kaart midden op scherm met gouden knop **"▶ Klik hier om Spotify-geluid te hervatten"**.
    - *Nummer niet afspeelbaar:* Bescheiden banner bovenin: *"Nummer niet beschikbaar in NL — we trekken automatisch een ander nummer…"*.
    - *Internet op host-pc weg:* Amber waarschuwingsbalk bovenaan (*"Verbinding met server verbroken — automatisch opnieuw verbinden… Het spel staat op pauze en blijft bewaard."*).
    - *Speler verbinding kwijt:* Alleen een subtiel grijs wolk-icoontje naast die ene speler in de bovenbalk (het spel blijft gewoon doorlopen).

---

### Elk telefoonscherm per toestand (390×844)

Bovenaan elk spel-scherm staat altijd een **slanke vaste statusbalk (`52px` hoog)**: links jouw kleur-avatar + naam, midden jouw kaarten (`4/10`), rechts jouw gouden tokens (`● 2`) en (alleen voor de host) een klein tandwiel-icoon voor het Host-menu.

1. **Aanmelden:** Schoon, snel startscherm na het scannen van de QR (de 4-letter roomcode staat dan al ingevuld!). Als je handmatig naar de site gaat: 4 grote invoervakjes voor de code + knop **"Meedoen"**.
2. **Naam & kleur kiezen:** Groot tekstveld *"Jouw voornaam"* (max 12 tekens), daaronder een 2×5 raster met de 10 kleur-en-symboolknoppen (reeds bezette kleuren zijn gedimd met de naam van wie hem koos), en onderaan in de duimzone een volle-breedte gouden knop **"Klaar, ik doe mee!"**.
3. **Wachten (tijdens andermans beurt):** Bovenaan een live statuskaart (*"Bram is aan de beurt · Nummer speelt (34s)"*), in het midden jouw eigen samengevatte tijdlijn (inklapbaar/scrollbaar zodat je alvast je eigen gaten kunt bestuderen) óf het live overzicht van Bram's tijdlijn, en onderaan:
   - 4 kleine feest-reactieknopjes (`🔥`, `🫣`, `🤷`, `🎤`);
   - Optionele "Stille meegok"-slider (*"Wanneer denk jij? 1998"*);
   - Een opvallende, nog uitgeschakelde balk *"STEAL! opent zodra Bram vastzet"* (of verborgen als je 0 tokens hebt, met uitleg *"0 tokens — verdien tokens op jouw beurt"*).
4. **Jouw beurt (start & plaatsen):**
   - *Startmoment (voor muziek):* Hele scherm krijgt een zachte gouden rand. Grote knop onderaan: **"▶ Start nummer"**. Heb je ≥3 tokens, dan staat er net boven een duidelijke tweede knop **"🪙 Koop 1 kaart voor 3 tokens"**.
   - *Tijdens het luisteren:* Bovenaan een compacte balk met geluidsgolf + timer (`34s`), links een chip **"⏭ Skip (1 token)"** en rechts een schakelaar **"🎤 Ik weet titel & artiest"**. Het hele middengedeelte is jouw **verticale tijdlijn** (oud boven → nieuw onder) met daartussen grote, duimvriendelijke gleufknoppen (`+ Hier plaatsen · tussen 1984 en 1996`, hoogte `56px`).
5. **Bevestigen:** Zodra je een gleuf aantikt, schuift die gleuf open tot een gouden raadselkaart (`? Jouw plek`) en verschijnt onderaan een vaste, grote gouden actieknop (`56px` hoog): **"✓ Vastzetten op deze plek"**. Je kunt nog van gleuf wisselen zo vaak je wilt totdat je op Vastzetten tikt (of de timer afloopt).
6. **Steal kiezen:** Zodra een ander vastzet (en jij ≥1 token hebt), kleurt je telefoonrand koraalrood met bovenaan een dikke 8s aftelbalk: **"STEAL-KANS! (6s)"**. Je ziet direct de verticale tijdlijn van de actieve speler, mét zijn vergrendelde keuze (`🔒 Bram's plek`) en reeds bezette steal-gleuven (`▲ Lisa`). Eén tik op een vrije gleuf toont onderaan een directe bevestigingsknop **"⚡ STEAL HIER! (kost 1 token)"** — of je tikt op **"Pas"** om door te gaan.
7. **Resultaat:** Duidelijke volledige resultaatkaart met het onthulde nummer (decenniumkleur, groot jaartal, artiest, titel), heldere uitkomst in mensentaal (*"✓ Raak! Kaart toegevoegd (5/10)"*, *"⚡ Je hebt hem gestolen!"*, of *"✕ Helaas, 2003 hoorde tussen 1996 en 2014"*), en een token-samenvatting.
8. **Tokens & scheidsrechter-scherm:**
   - Tik op jouw token-teller in de bovenbalk om een kort uitlegkaartje te openen (hoeveel tokens je hebt, max 5, en wat je ermee kunt).
   - Ben jij de **beurt-scheidsrechter** van deze ronde en claimde de actieve speler titel + artiest? Dan popt er bij de onthulling een heldere beoordelingskaart op: *"Noemde Bram dit goed? **OutKast — Hey Ya!**"* met twee grote knoppen naast elkaar: **"✕ Nee"** (`#EF476F`) en **"✓ Ja, +1 token"** (`#22C57E`).
9. **Winnaar:** Feestelijk scherm in de kleur van de winnaar (*"🏆 Jij hebt gewonnen!"* of *"🏆 Lisa heeft gewonnen! Jij werd #2 met 9 kaarten"*), jouw persoonlijke avondstatistieken (aantal goede kaarten, geslaagde steals, verdiende tokens) en een rustige melding *"Wachten tot de host een nieuw potje start…"*.
10. **Host-menu overlay (alleen op de telefoon van de host):** Via het subtiele kroon/tandwiel-icoon opent een compacte lade met 5 knoppen: *Muziek pauzeren/hervatten · Nummer herstarten · Actieve speler overslaan · Laatste token-keuring aanpassen · Tussenstand op tv tonen*. Zo blijft de host de hele avond op de bank zitten!

---

### Hoe de TV leesbaar blijft met 8 tot 10 spelers op 3 meter afstand
De grootste valkuil bij een 10-spelersspel is proberen alle 10 tijdlijnen tegelijk op de tv te proppen — dan worden jaartallen 9 pixels klein en leest niemand meer iets. Onze aanpak lost dat radicaal op:

- **Vaste 3-zone indeling op 1920×1080:**
  1. **Bovenbalk (`108px` hoog): De 10-Speler-Rail.** Tien strakke kaarten naast elkaar (elk `~176px` breed met `10px` tussenruimte). Elke pil toont *alleen* wat je continu wilt weten: kleur-badge + verkorte naam (`20px` vet, max 9 tekens), **kaartteller `7/10` (`26px` extra vet)**, **token-icoon + getal `● 3` (`18px` goud)**, en een 4px voortgangsbalkje onderaan. Spelers op `8/10` of `9/10` krijgen een warme amber gloed. De actieve speler is iets hoger/helderder met gouden rand.
  2. **Middenpodium (`880px` hoog): 100% focus op de actieve tijdlijn.** Alle 10 spelers kijken naar één grote, rustige tijdlijn van de speler die aan de beurt is. Zelfs met **9 kaarten + 1 raadselkaart** op een rij is elke kaart op `1920px` breedte nog steeds `148×196px` met een jaartal van **`44px` extra vet** — moeiteloos leesbaar op 3 tot 4 meter afstand!
  3. **Onderbalk (`92px` hoog): Live feed & QR.** Links status + huidige ronde; midden subtiele live-reacties (`🔥 Lisa: "Banger!"`); rechts een compacte QR (`64×64px`) + roomcode (`24px`) voor laatkomers of herverbinders en een klein pauze-icoontje.

### Minimale maten voor leesbaarheid (3m tv) en één-handbediening (telefoon)
- **TV (1920×1080, kijkafstand 3 meter):**
  - Primaire jaartallen (tijdlijn): minimaal **`42px`** (`68px` bij onthulling).
  - Koppen en aankondigingen: **`36–52px`**.
  - Spelersnamen & kaarttellers in 10-speler-rail: **`20–26px`** vet.
  - Kleinste toegestane secundaire tekst (artiest/titel op tijdlijnkaart, sublabels): minimaal **`16–18px`** met contrastverhouding ≥ `7:1` (nooit dunne grijze letters op donkerblauw!).
- **Telefoon (390×844, bediening met één hand & drankje in de andere):**
  - Alle hoofdacties (*Start nummer*, *Vastzetten*, *STEAL!*, *Klopt / Niet goed*) staan altijd in de **onderste 30% van het scherm (duimzone)** en zijn minimaal **`56px` hoog** over de volle breedte.
  - Alle tikdoelen (gleuven op de tijdlijn, reactieknoppen, skip-knop) zijn minimaal **`48×48 CSS-px`** met ten minste `10px` tussenruimte tegen mistikken.
  - Minimale tekstgrootte op de telefoon: **`15px`** voor labels, **`22–28px`** voor jaartallen op je verticale tijdlijn.

---

## 5. Interactiedetails

### Kaart plaatsen op de telefoon (verticaal vs. horizontaal)
Op de tv ligt de tijdlijn klassiek horizontaal (oud links → nieuw rechts). Op de telefoon (390px breed) is een **verticale tijdlijn** (oud boven → nieuw onder) veel prettiger met één duim: je duim scrolt natuurlijk verticaal zonder per ongeluk een kaart te verschuiven, en elke gleuf is een brede, duidelijke knop over de hele schermbreedte (`358×54px`) met expliciete tekst als **`+ Tussen 1984 en 1996`**.
- **Stap 1 (verkennen):** Tik op een gleuf → de gleuf klapt open als een gouden raadselkaart (`?`) en op de tv schuift de kaart binnen `150 ms` live naar precies die plek.
- **Stap 2 (bijstellen):** Twijfel je? Tik gewoon een andere gleuf aan; de vorige klapt weer dicht.
- **Stap 3 (vastzetten):** Tik onderaan op de vaste gouden balk **"✓ Vastzetten tussen 1984 en 1996"**. Die 2-staps aanpak voorkomt dat je door per ongeluk aanraken tijdens het scrollen je beurt verpest!

### Hoe stelen precies werkt (snelheid, eerlijkheid & techniek)
1. **Moment:** Pas zodra de actieve speler op *Vastzetten* tikt, gaat het steal-venster open (duur: **8 seconden**). Niemand kan dus tijdens het luisteren de actieve speler "wegjagen" van een plek, en je ziet eerst waar de ander zijn kaart neerlegt — precies als aan de keukentafel.
2. **Snelste route op de telefoon (2 snelle tikken):**
   - Zodra het venster opent, schakelt elke telefoon met ≥1 token direct naar de koraal-omrande steal-weergave met de tijdlijn van de actieve speler al open voor je neus (geen extra scherm openen!).
   - Tik op een vrije gleuf → hij wordt direct geselecteerd en de knop onderaan wordt actief: **"⚡ STEAL! (1 token)"**. Tik daarop en je claim is weg! (Voor nóg sneller spel kan in de instellingen zelfs *1-tik steal* aan, maar 2 tikken — plek + bevestig — voorkomt per ongeluk tokens verspillen door opgewonden duimen.)
3. **Wie is eerst?** Elke steal-claim wordt door de host-pc verwerkt op volgorde van binnenkomst (`server/host receive order`) met een strikt oplopend volgnummer. Is gleuf 4 al door Lisa geclaimd 80 milliseconden vóór Ties? Dan ziet Ties direct op gleuf 4 een rood label *"Bezet door Lisa"* en een korte melding *"Net te laat op plek 4 — kies een andere plek!"*, zonder dat hij zijn token verliest.
4. **Voortijdig sluiten:** Als alle spelers die ≥1 token hebben op *"Pas"* tikken (of als niemand tokens heeft), sluit het steal-venster meteen zonder de resterende seconden uit te zitten.

### Timers, trillen (haptics) en scherm wakker houden
- **Beurttimer:** Standaard **45 seconden** vanaf het moment dat de muziek echt speelt (instelbaar: 30s / 45s / 60s / Uit). Op `15s` kleurt de timer warm amber; op `10s` zachte hartslag-animatie. Bij `0s` wordt een al gekozen plek automatisch vastgezet; was er nog niets gekozen, dan verschijnt 10s genadetijd (*"Kies snel een plek!"*).
- **Steal-timer:** **8 seconden** (instelbaar: 6s / 8s / 10s). Laatste 3 seconden hoorbare zachte tik op de tv.
- **Trillen (haptics) — eerlijke beperking op iPhone:**
  - Op **Android** (Chrome / Samsung Internet) gebruiken we de `Vibration API` (`navigator.vibrate`):
    - Jouw beurt start: `[120, 60, 120]` (dubbele warme tik).
    - Steal-venster opent: `[80]` (korte alert).
    - Vastgezet / steal bevestigd: `[40]` (strakke klik).
    - Goed geraden / steal gelukt: `[60, 40, 140]`.
    - Fout: `[220]`.
  - Op **iOS Safari** wordt `navigator.vibrate()` door Apple **niet ondersteund** *(bron: MDN & CanIUse, 2026)*. Omdat ongeveer de helft van een Nederlandse vriendengroep een iPhone heeft, leunen we nooit alleen op trillen: elke gebeurtenis geeft óók een directe, onmisbare visuele puls (oplichtende gouden of koraalrode schermrand van `600 ms`) én een eigen herkenbaar geluidssignaal vanaf de tv!
- **Scherm wakker houden:** Via de **Screen Wake Lock API** (`navigator.wakeLock.request('screen')`) blijft de telefoon tijdens het spel wakker (ondersteund op moderne Android én iOS Safari 16.4+/18.4+, *bron: MDN & CanIUse*). Omdat mobiele browsers de wake lock automatisch loslaten zodra je even naar WhatsApp swipet, vraagt de app hem stil opnieuw aan zodra je terugkeert naar het tabblad (`visibilitychange`).

### Dubbel tikken, te laat tikken en haperend netwerk
- **Dubbel tikken:** Zodra een speler op *Vastzetten*, *STEAL!*, *Skip* of *Koop kaart* tikt, krijgt elke actie een uniek `actionId` en wordt de knop direct vergrendeld met een korte laad-indicator (*"Bevestigen…"*). Dubbele tikken binnen milliseconden worden door zowel de knop als de host (die bekende `actionId`'s negeert) genegeerd — niemand raakt ooit per ongeluk 2 tokens kwijt.
- **Te laat tikken:** Komt een steal- of plaatsingsbericht bij de host binnen nadat de fase al naar `REVEAL` is gesprongen (bijv. door 400ms wifi-vertraging), dan weigert de host de actie netjes, trekt geen token af en stuurt een korte melding *"Net te laat, het venster was al dicht"*.

---

## 6. Muziek en data

### Spotify Web API & Web Playback SDK: actuele stand en beperkingen (november 2026)
Online onderzoek naar de officiële Spotify-documentatie (inclusief de grote wijzigingen van februari, maart, mei en juli 2026) levert **vier cruciale feiten** op die direct bepalen hoe Tune Timeline werkt:

1. **Development Mode past precies bij ons — mits alleen de host inlogt:**  
   Sinds **11 februari 2026** (voor nieuwe apps) en **9 maart 2026** (voor bestaande apps) vereist Spotify dat de eigenaar van een Development Mode-app een actief **Spotify Premium**-abonnement heeft, en is elke app beperkt tot maximaal **5 geautoriseerde gebruikers** op de allowlist *(bron: Spotify Developer Blog, 6 feb 2026)*. De limiet van 1 app per ontwikkelaar werd in juli 2026 weer verhoogd naar 25, met gedeelde account-quota *(bron: Spotify Changelog juli 2026)*. Voor Tune Timeline is die 5-gebruikerslimiet **geen enkel probleem**: uitsluitend de host (1 account) logt in op de tv-pc; de 8–10 vrienden loggen nooit in bij Spotify.
2. **Belangrijke beperking op playlists van anderen (februari 2026):**  
   Spotify heeft `GET /playlists/{id}/tracks` vervangen door **`GET /playlists/{id}/items`** én een harde toegangsregel ingevoerd: de inhoud (`items`) van een playlist wordt alleen nog teruggegeven voor playlists waarvan de ingelogde gebruiker **eigenaar of collaborator** is. Bij openbare playlists van anderen geeft de API alleen metadata terug (geen nummers) of een `403`-fout *(bron: Spotify Web API Changelog feb 2026)*.  
   **Oplossing:** Voordat het voorbereidingsscript draait, kopieert de host in de Spotify-app eenmalig alle nummers uit de gekozen Hitster-playlist naar een eigen playlist (bijv. *"Mijn Tune Timeline Hitster"*). Dan is hij eigenaar en werkt `GET /playlists/{id}/items` probleemloos.
3. **OAuth & Redirect URI's:**  
   De oude Implicit Grant-flow is uitgefaseerd; we gebruiken verplicht **Authorization Code met PKCE** (geen geheim wachtwoord in de browser). Daarnaast verbiedt Spotify `http://localhost` als redirect-URL: voor lokaal testen moet verplicht `http://127.0.0.1:<poort>` gebruikt worden, en live op Vercel gewoon `https://tune-timeline.vercel.app/callback` *(bron: Spotify Redirect URIs & PKCE docs)*.
4. **Afspelen via Web Playback SDK & Autoplay:**  
   De tv-pc draait de officiële **Spotify Web Playback SDK**, waarmee het browsertabblad verschijnt als een Spotify Connect-speler. Dit werkt op moderne Chrome, Firefox, Edge en Safari en vereist een volwaardig Premium-abonnement (geen Premium Mini/Lite; *bron: Spotify Web Playback SDK docs*).
   - **Autoplay-ontgrendeling:** Browsers blokkeren automatisch geluid zonder gebruikersklik. Daarom roepen we `player.activateElement()` direct aan binnen de klik op **"Test geluid & open lobby"** op de tv-pc. Daarnaast luistert de app op het SDK-event `autoplay_failed` om meteen een opvallende knop *"Klik om muziek te hervatten"* te tonen als een browser toch ingrijpt *(bron: Spotify SDK Reference)*.
   - **Browseradvies voor de tv-pc:** Gebruik **Google Chrome of Microsoft Edge** zonder agressieve adblockers/tracking-blockers op dit tabblad (Safari heeft vaker autoplay-kuren bij Spotify Connect-transfers en adblockers blokkeren soms het SDK-script).
   - **Startpunt van een nummer:** Elk nummer start op `0:00` zodat iconische intro's herkenbaar blijven. De host kan in de lobby wel een optionele *"Skip stille intro"* (of handmatige `+15s`-knop in het host-menu) gebruiken als een nummer een lange aanloop heeft.

### Het oorspronkelijke releasejaar betrouwbaar bepalen (de 4-staps voorbereiding)
Spotify's eigen `album.release_date` is berucht onbetrouwbaar voor een jaartallenspel: een hit uit 1979 op een *"80s Greatest Hits (2018)"* of een *"2011 Remaster"* krijgt bij Spotify jaar `2018` of `2011`. Bovendien is `available_markets` in februari 2026 uit track-objecten verwijderd, maar gelukkig werd **`external_ids` (met de ISRC-code)** na ontwikkelaarsprotest in **maart 2026 weer hersteld** *(bron: Spotify Web API Changelog maart 2026)*.

Daarom wordt de nummerlijst **vooraf eenmalig lokaal voorbereid** met een klein script, met als uitkomst één statisch bestand `songs.json` in de repository (tijdens het feestje zijn er dus nul externe data-oproepen buiten Spotify-audio!):

1. **Stap 1 — Playlist ophalen & filteren op speelbaarheid (NL):**  
   Het script leest de eigen gekopieerde Spotify-playlist via `GET /playlists/{id}/items?market=NL` (in blokken van 50/100). Omdat `available_markets` is verdwenen, gebruiken we `market=NL` + het veld **`is_playable`** en Spotify's automatische *Track Relinking* (zodat een in NL vervangen track-URI direct naar de speelbare Nederlandse versie wijst). Niet-afspeelbare nummers gaan direct op een rapportlijst zodat je ze handmatig kunt vervangen.
2. **Stap 2 — Oorspronkelijk jaar via MusicBrainz (ISRC + Release Group):**  
   Per nummer doet het script (met een nette `User-Agent`-header en strikt **maximaal 1 verzoek per seconde**, omdat MusicBrainz anders `503`-fouten geeft; *bron: MusicBrainz Rate Limiting docs*) twee slimme lookups:
   - **Lookup A (ISRC):** `GET /ws/2/isrc/{ISRC}?fmt=json` → pakt `first-release-date` van de gekoppelde *Recording*.
   - **Lookup B (titel + artiest fallback):** Omdat platenlabels remasters vaak een **nieuwe ISRC** geven *(bron: MusicBrainz docs)*, zoekt het script óók op opgeschoonde artiest + titel (waarbij toevoegingen als `- 2011 Remaster`, `(Radio Edit)`, `(Album Version)` zijn weggestript) in MusicBrainz *Recording* én *Release Group* (`first-release-date`), exclusief live-versies en covers door andere artiesten.
   - Het vroegste betrouwbare officiële releasejaar (single of album) wint — precies volgens de Hitster-regel! (Zo krijgt *Blinding Lights* netjes `2019` voor de single-release en niet `2020` van het album *After Hours*.)
3. **Stap 3 — Automatische twijfel-vlaggen (`confidence`):**  
   Elk nummer krijgt een betrouwbaarheidslabel:
   - `high`: Spotify-jaar en MusicBrainz-jaar kloppen binnen 0–1 jaar.
   - `corrected`: Spotify gaf een duidelijk later verzamel-/remasterjaar, MusicBrainz vond een eenduidige eerdere originele release.
   - `review`: Geen zekere match, meerdere tegenstrijdige jaren, of een bekende remaster/re-recording (zoals *Take On Me*, 1984 vs 1985). Deze ~10–15% korte lijst print het script apart uit om in 10 minuten even na te lopen (evt. met Wikidata/Wikipedia of je echte Hitster-kaarten).
4. **Stap 4 — Handmatige `overrides.json` + statische `songs.json`:**  
   Correcties zet je in een klein, leesbaar bestand `overrides.json` (gewoon `spotifyUri → jaar`), dat voorrang krijgt bij het genereren van `songs.json`. Elk item in `songs.json` bevat uitsluitend: `id`, `uri`, `title`, `artist`, `year`, `decade` en `source` (`musicbrainz` / `override`). Met ~300 nummers is `songs.json` kleiner dan **45 KB**!

### Wat als een nummer op de avond tóch niet afspeelt?
Soms verdwijnt een nummer van Spotify of wisselen licenties tussen voorbereiding en feestavond. Zodra de host-pc een nummer opstart en binnen **4 seconden** geen `playing`-status met voortgang >0 ms krijgt (of direct een SDK-fout ontvangt):
1. De host markeert het nummer voor de rest van de avond als onafspeelbaar.
2. Op de tv verschijnt 2 seconden rustig *"Nummer even niet beschikbaar op Spotify — nieuw nummer wordt gestart"*.
3. Direct wordt het volgende nummer uit de geschudde stapel gestart; niemand raakt een beurt of token kwijt.

---

## 7. Technisch concept op hoofdlijnen

### Architectuur (Host als enige bron van waarheid)
De applicatie is een **pure frontend-webapp** (TypeScript + React + Vite) die gratis als statische site op **Vercel Hobby** draait — er is geen eigen backend-server en geen database nodig.
- **`/host` (TV-pc):** De enige baas over de spelstatus (*authoritative state machine*). Hier draait de Spotify Web Playback SDK, staat de geschudde kaartstapel en worden alle spelregels, timers, volgorde van steals en puntentellingen beslist.
- **`/play` (telefoons):** Dunne, snelle controllers. Telefoons rekenen zelf geen spelregels uit, maar sturen uitsluitend korte **intenties** (bijv. *"Ik wil plek 3 selecteren"*, *"Vastzetten"*, *"STEAL op plek 4"*, *"Scheidsrechter: klopt"*) naar de host. De host valideert, werkt de status bij en stuurt het resultaat direct naar iedereen.

### Realtime-opzet op het bestaande Supabase-project
We gebruiken uitsluitend **Supabase Realtime Broadcast** en **Presence** binnen het bestaande gratis Supabase-project van de studiewebsite:
- **Zero-impact isolatie:** Geen enkele databasetabel, geen SQL-migraties, geen opslag-buckets en geen aanraking van bestaande tabellen. Elk spel gebruikt een eigen tijdelijk kanaal met strikte prefix: **`tt:room:<CODE>`** (bijv. `tt:room:KICK`). Zodra iedereen het tabblad sluit, verdwijnt het kanaal vanzelf zonder sporen achter te laten.
- **Broadcast voor spelverkeer:** Alle speler-intenties (`PLAYER_ACTION`) en status-updates van de host (`STATE_PATCH` / `STATE_SYNC`) lopen over Broadcast.
- **Presence alleen voor online-bolletjes:** Supabase beperkt Presence op alle plannen tot **maximaal 5 calls per client per 30 seconden** *(bron: Supabase Realtime Limits, okt 2026)*. Daarom gebruiken we Presence **nooit** voor spelacties, maar uitsluitend één keer bij verbinden om het groen/grijs verbindingsbolletje per speler te tonen.

### Anti-spoiler beveiliging (telefoons zien het antwoord niet)
1. **Geen spoilers in berichten:** Tijdens de fases `PLAYING`, `PLACING` en `STEAL_WINDOW` verstuurt de host uitsluitend het kaart-ID, de open jaartallen op de tijdlijnen, de gekozen plek-indexen en de timers. Titel, artiest en jaartal van het spelende nummer worden pas in het `REVEAL`-bericht meegestuurd.
2. **Gescheiden data-lading:** Het bestand `songs.json` wordt als apart statisch JSON-bestand alleen opgehaald door de `/host`-pagina, niet meegebundeld in de `/play`-telefooncode. Zelfs een technische vriend die op zijn telefoon de netwerk- of broncode-inspectie opent, ziet alleen zijn eigen bord — niet de kaartstapel en niet het antwoord.
3. **Geen Spotify-meldingen op telefoons:** Alleen de tv-pc speelt Spotify af; telefoons zijn niet gekoppeld aan Spotify, dus niemand krijgt per ongeluk een "Nu aan het spelen"-melding op zijn vergrendelscherm.

### Herverbinden & sessieherstel
- **Telefoon:** Bij aanmelden krijgt elke speler een vast `playerId` en een kort `reconnectToken` opgeslagen in `localStorage` (gekoppeld aan de `roomCode`). Valt de telefoon in slaap of schakelt hij van wifi naar 4G? Zodra de pagina weer actief is, herverbindt `supabase-js` automatisch met `tt:room:<CODE>` en stuurt `REJOIN { playerId, reconnectToken }`. De host antwoordt direct met een actuele `STATE_SYNC` en de speler zit binnen 1 seconde weer precies op zijn eigen plek met zijn eigen kaarten en tokens.
- **Host-pc:** Na elke fase-overgang bewaart de host de complete spelstatus (inclusief geschudde stapel en huidige beurt) in `localStorage`. Bij een per ongeluk ververste browser herlaadt het spel direct in dezelfde kamer (`roomCode`), verbindt de Spotify-speler opnieuw en vraagt alleen één klik op *"Muziek hervatten"*.
- **Spotify-token vernieuwen:** Een Spotify PKCE access token is 1 uur geldig. De host vernieuwt het token stil op de achtergrond na **45 minuten** via het refresh token, zodat de muziek nooit na precies een uur stilvalt.

### Bekende limieten & rekenvoorbeeld voor 10 spelers (met bronnen)

| Platform | Limiet (gratis plan) | Ons verbruik (10 spelers + 1 host) | Ruimte over |
|---|---|---|---|
| **Supabase Realtime** *(docs bijgewerkt 29 okt 2026)* | **200** gelijktijdige verbindingen | 11 (tot max 15 met toeschouwers) | > 13× ruimte |
| **Supabase Realtime** | **100** berichten/seconde | Piek ~15–22 ber./sec tijdens steal-storm (incl. fan-out) | ~5× ruimte |
| **Supabase Realtime** | **256 KB** max Broadcast-payload | `STATE_SYNC` is ~3–5 KB, actiebericht < 0,3 KB | > 50× ruimte |
| **Supabase Realtime** | **5** Presence-calls / client / 30s | 1 call bij binnenkomst | Geen risico |
| **Supabase Realtime** | **2.000.000** berichten / maand (fan-out telt mee: 1 broadcast naar 10 clients = 11 berichten) | 1 volle avond (~80 beurten × ~12 events × 11) ≈ **~10.500 berichten** | **< 0,6%** van maandbudget |
| **Vercel Hobby** *(docs 2026)* | **100 GB** dataverkeer/maand, **1M** CDN-verzoeken | 11 apparaten × ~0,8 MB ≈ **9 MB** per avond | **< 0,01%** van maandbudget |
| **Spotify Web API (Dev Mode)** *(feb/jul 2026)* | Max **5** ingelogde gebruikers, Premium vereist voor eigenaar | **1** gebruiker (alleen de host) | Past exact |

*Let op gedeeld Supabase-project:* Supabase pauzeert gratis projecten na 7 dagen volledige inactiviteit. Omdat je bestaande studiewebsite op dit project draait blijft het doorgaans actief, maar test een uur vóór je feestje kort even de lobby — dan is het project gegarandeerd wakker!

---

## 8. Risico's en oplossingen

| # | Wat kan er misgaan op een echte avond? | Preventie (vooraf) | Oplossing tijdens het spel |
|---|---|---|---|
| 1 | **Wifi hapert of telefoon springt naar 4G** | Lichtgewicht berichten (<1 KB), automatische `supabase-js` reconnect + `localStorage` sessieherstel. | Telefoon toont subtiele balk *"Opnieuw verbinden…"* en synchroniseert binnen 1–2s terug zonder verlies van kaarten/tokens. |
| 2 | **Telefoon gaat in slaapstand of accu raakt leeg** | `Screen Wake Lock API` (opnieuw geactiveerd bij tab-terugkeer) + donker thema spaart OLED-accu's. | Bij lege accu scant de speler op een geleende telefoon de QR en kiest *"Neem plek over van [naam]"* (host bevestigt met 1 tik). |
| 3 | **iPhones trillen niet (geen Vibration API in Safari)** | Nooit alleen op trillen vertrouwen. | Heldere visuele aandachtspuls (gouden/koraalrode rand op telefoonscherm) + duidelijk geluidssignaal vanaf de tv. |
| 4 | **Browser op tv-pc blokkeert Spotify-autoplay** | Verplichte klik *"Test geluid & open lobby"* roept `player.activateElement()` aan; Chrome/Edge gebruiken. | Luisteren op `autoplay_failed` → toont grote knop *"Klik om geluid te hervatten"* midden op het tv-scherm. |
| 5 | **Spotify access token verloopt na 1 uur** | Stil vernieuwen met PKCE refresh token na 45 minuten (automatische achtergrond-timer). | Mocht vernieuwen mislukken, dan pauzeert het spel netjes met 1-klik herlogin terwijl de volledige spelstatus bewaard blijft. |
| 6 | **Iemand loopt naar de wc of haalt drinken tijdens zijn beurt** | Zachte beurttimer (45s) + zichtbaar online/offline-bolletje op de tv. | Host tikt vanaf de bank in het host-menu op *"Beurt overslaan"*; speler doet de volgende ronde weer gewoon mee. |
| 7 | **4 vrienden drukken tegelijk op STEAL!** | Host verwerkt intenties strikt serieel met volgnummer; knoppen blokkeren direct na tik (`actionId`). | Eerste ontvangst wint de gleuf; de rest ziet direct *"Net bezet door [naam]"* en kan meteen een andere vrije gleuf kiezen zonder tokenverlies. |
| 8 | **Discussie over een jaartal (remaster vs. origineel)** | 4-staps voorbereiding met MusicBrainz `first-release-date` + handmatige `overrides.json` voor bekende twijfelgevallen. | Heldere spelregel op uitlegscherm: *"Het jaar in het spel telt (net als op een echte Hitster-kaart)!"* + host kan in uiterst noodgeval met 1 tik een kaart handmatig toekennen/ongedaan maken. |
| 9 | **Nummer is niet afspeelbaar in Nederland** | Vooraf filteren met `market=NL` en `is_playable` + Track Relinking in het voorbereidingsscript. | Als Spotify toch faalt of >4s stil blijft, trekt de host automatisch een nieuw nummer zonder dat iemand een token verliest. |
| 10 | **Host-pc wordt per ongeluk ververst of slaapstand** | Elke fase-overgang opgeslagen in `localStorage` van de host; energiestand van laptop op "nooit slapen". | Na refresh herstelt dezelfde kamer direct; host klikt één keer op *"Muziek hervatten"* en het spel gaat verder. |
| 11 | **Host wil zelf meespelen maar moet steeds naar de tv-pc lopen** | Host joint op zijn eigen telefoon als gewone speler mét verborgen host-menu (pauze, skip, override, tussenstand). | Alle noodknoppen werken vanaf de bank via de telefoon; de pc aan de tv blijft puur scherm + speaker. |
| 12 | **Spotify API weigert openbare Hitster-playlist (feb 2026-regel)** | Playlist eenmalig kopiëren naar het eigen Spotify-account van de host vóór het voorbereidingsscript. | Omdat `songs.json` statisch in de repo staat, heeft de avond zelf geen enkele playlist-API-oproep meer nodig — alleen afspelen via URI! |

---

## 9. Keuzes en aannames

### Gemaakte ontwerp- en spelkeuzes
| Onderwerp | Gekozen oplossing | Overwogen alternatief | Waarom deze keuze |
|---|---|---|---|
| **Naam** | **Tune Timeline** | *Jaartal Jam*, *VinylVuur*, *HitLijn* | Duidelijk, past bij de repo-naam, klinkt modern en internationaal zonder op Hitster te lijken. |
| **Visuele stijl** | *Midnight Vinyl & Amber Brass* met decennium-gekleurde open kaarten | Neon-paars/roze discothema of licht wit bordspelthema | Oogt volwassen en eigen (geen Hitster-kloon), verblindt niet in een donkere woonkamer, en decennium-kleuren geven direct overzicht op 3 meter. |
| **Tijdlijn op telefoon** | **Verticaal** (oud boven → nieuw onder) met brede gleufknoppen | Horizontaal scrollen net als op de tv | Met 10 kaarten en een drankje in de andere hand is verticaal scrollen met één duim 10× trefzekerder; op de tv blijft hij klassiek horizontaal. |
| **Steal-timing** | **8-seconden venster ná vastzetten** (met snelle "Pas"-knop) | Stealen tijdens het hele nummer | Eerlijker: je ziet eerst waar de actieve speler hem echt neerlegt en hij kan niet meer stiekem verplaatsen zodra iemand stealt. |
| **Titel & artiest keuren** | **Beurt-scheidsrechter** (automatisch de volgende speler) + host-override | (a) Alleen host op pc, (b) alle 9 spelers laten stemmen, (c) tekst intypen | Typen op een feestje met drank is een sfeerbreker; stemmen met 9 man duurt te lang; alleen host op pc werkt niet als de host zelf speelt. Één wisselende scheidsrechter op zijn telefoon duurt 2 seconden en houdt de volgende speler scherp. |
| **Kaart kopen (3 tokens)** | Alleen aan het **begin van je eigen beurt** (vóór muziek start), **zonder** volgende beurt over te slaan | Op elk willekeurig moment in andermans beurt, of met beurt overslaan | Voorkomt gelijktijdige 10e-kaart-conflicten tijdens andermans beurt en volgt de NL/Nordics-regels (geen beurt verliezen, want 15 min wachten met 10 man is niet leuk). |
| **Beurttimer** | **45 seconden** standaard (instelbaar: 30s / 45s / 60s / Uit) met zachte afhandeling | Geen timer, of keiharde diskwalificatie bij 0s | Houdt het tempo bij 10 spelers erin zonder dat het gestrest voelt. |
| **Host meespelen** | **Ja**, via zijn eigen telefoon mét compact host-menu | Host alleen als DJ/spelleider achter de laptop | Op een vriendenavond wil jij natuurlijk gewoon meespelen en kunnen winnen. |
| **10-spelers TV-weergave** | Compacte **10-speler-rail bovenin** + **1 grote actieve tijdlijn** + los 2×5 tussenstand-overzicht | Alle 10 tijdlijnen permanent tegelijk tonen | Permanent 10 tijdlijnen op één scherm wordt onleesbaar op 3 meter; focus op de actieve speler maakt elke kaart enorm en duidelijk. |
| **Frontend-stack** | **Vite + React + TypeScript** (pure statische SPA op Vercel) | Next.js met API-routes | Geen server nodig (PKCE werkt in de browser, realtime via Supabase Broadcast); Vite bouwt razendsnel, is simpeler voor later onderhoud en gebruikt nul Vercel-functietijd. |
| **Starttokens (Original)** | **2 tokens** (met lobby-optie voor 3 zoals Scandinavië) | Vast op 3 tokens | Sluit direct aan bij de Nederlandse Hitster-editie die vrienden gewend zijn. |

### Waar en waarom we zijn afgeweken van Bijlage B
1. **Steal-venster verplaatst naar ná vastzetten (i.p.v. tijdens het plaatsen):** In Bijlage B kon je al stealen terwijl de actieve speler nog aan het plaatsen was. Wij openen het steal-venster pas direct ná vastzetten (8 seconden), zodat de actieve speler zijn keuze niet meer kan aanpassen als hij een steal ziet aankomen — dat is trouwer aan het echte spel en voorkomt frustratie.
2. **Keuring van titel & artiest verplaatst van host-pc naar de beurt-scheidsrechter op de telefoon:** Bijlage B stelde voor dat in versie 1 de host beslist op de pc. Omdat de host zelf meespeelt (open vraag uit Bijlage B) en op de bank zit, is de volgende speler als 1-tik scheidsrechter (met host-override vanaf de telefoon) direct veel fijner zonder extra complexiteit.
3. **Geen echte albumhoezen gebruikt, maar gestileerde decennium-vinylhoezen in de mockups (en optioneel wel/niet Spotify-hoes in de echte app):** In de mockups gebruiken we volledig rechtenvrije geometrische hoezen in decenniumkleur; ook in de echte app geeft een decennium-gekleurde kaart met helder typografisch ontwerp op 3 meter betere leesbaarheid dan een drukke kleine albumhoes (al mag de Spotify-hoes optioneel klein op het onthulscherm erbij).
4. **Geen "compacte tijdlijnstrips van alle anderen" permanent onderaan het tv-scherm:** Bijlage B noemde tijdlijnstrips van anderen onder of naast het bord. Bij 9 andere spelers op 1920×1080 worden 9 strips te klein op 3 meter; daarom zijn ze vervangen door de heldere 10-speler-rail bovenin met voortgangsbalkjes én een volwaardig 2×5 Tussenstand-scherm na elke ronde.
5. **Spotify-playlist voorbereiding aangepast aan de februari 2026 API-wijziging:** Bijlage B ging nog uit van willekeurig een publieke Hitster-playlist uitlezen. Door Spotify's 2026-beperking (alleen eigen of collaborative playlists via `GET /playlists/{id}/items`) is de eenmalige stap *"kopieer playlist naar eigen account"* expliciet opgenomen.
6. **Alle 6 open vragen uit Bijlage B zijn definitief beantwoord:** (1) Eén basis-dataset met optionele decenniumfilter in lobby; (2) Standaard 45s beurttimer, instelbaar; (3) Volgende speler keurt titel & artiest + host-override; (4) Host speelt zelf mee op eigen telefoon + host-menu; (5) Tot 10 individuele spelers direct ondersteund, en duo's kunnen nu al simpelweg 1 telefoon delen (echte multi-telefoon teams in H10); (6) *Midnight Vinyl & Amber Brass*-stijl volledig uitgewerkt.

---

## 10. Mogelijke uitbreidingen (voor later)

- **Coöperatieve modus:** Eén gedeelde tijdlijn op de tv, 5 gezamenlijke tokens; elke speler plaatst om de beurt (of in overleg) een kaart tot 10 kaarten voordat de tokens op zijn.
- **Duo- & teammodus met gesynchroniseerde telefoons:** Bij 10–14 mensen 5 teams van 2 spelers waarbij beide telefoons dezelfde team-tijdlijn zien en één speler per beurt mag vastzetten.
- **Individueel moeilijkheidsniveau per speler:** Net als in de officiële Hitster-regels kan de muzieknerd op *Pro* of *Expert* spelen terwijl de rest in hetzelfde potje op *Original* speelt!
- **Thema- & decenniumpakketten:** Extra voorbereide `songs-*.json`-lijsten in de lobby, zoals *Hitster 100% NL*, *Guilty Pleasures*, *00s–20s Studentenfeest* of een eigen vrienden-playlist.
- **Uitgebreide avondstatistieken & podium-export:** Na afloop een deelbare samenvattingskaart (voor in de groepsapp) met de eindstand, grootste blooper (grootste jaar-afwijking), snelste steal en beste meegokker.
- **Korte "30-seconden refrein"-modus:** Een optionele *Snelle Ronde*-instelling waarbij nummers rond `0:45` starten voor extra tempo op late feestavonden.

---

## 11. Bronnen

### Spelregels Hitster (inclusief regionale verschillen)
- Officiële Nederlandse Hitster-site (startkaart, 2 starttokens, 3 tokens kopen, 10 kaarten om te winnen): https://hitstergame.com/nl-nl/
- Officiële Amerikaanse Hitster-site: https://hitstergame.com/en-us/
- Officiële Scandinavische Hitster-spelregels (3 starttokens, definitie oorspronkelijk releasejaar bij remasters, voorrangsregel bij gelijktijdige steal op minste kaarten, Pro- en Expert-regels met behoud van token bij geslaagde steal, individueel moeilijkheidsniveau per speler): https://nordics.hitstergame.com/sv-en/how-to-play/

### Spotify Web API & Web Playback SDK (actuele stand 2026)
- Spotify Developer Blog — *Update on Developer Access and Platform Security* (6 feb 2026; ingang 11 feb / 9 mrt 2026, Premium-eis voor Development Mode, max 5 gebruikers): https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security
- Spotify Web API Changelog — February 2026 (`GET /playlists/{id}/items`, alleen eigen/collaborative playlists, verwijdering `available_markets` en bulk endpoints): https://developer.spotify.com/documentation/web-api/references/changes/february-2026
- Spotify Web API Changelog — March 2026 (terugdraaien verwijdering `external_ids` / ISRC op Track en Album): https://developer.spotify.com/documentation/web-api/references/changes/march-2026
- Spotify Web API Changelog — May 2026 (`account_id` als stabiele gebruikers-ID): https://developer.spotify.com/documentation/web-api/references/changes/may-2026
- Spotify Web API Changelog — July 2026 (Client IDs weer verhoogd naar 25, per-account quota): https://developer.spotify.com/documentation/web-api/references/changes/july-2026
- Spotify Web API — Quota Modes (Development Mode vs. Extended Quota Mode): https://developer.spotify.com/documentation/web-api/concepts/quota-modes
- Spotify Web API — Authorization Code with PKCE Flow: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
- Spotify Web API — Redirect URIs (verbod op `localhost`, verplicht `127.0.0.1` lokaal en HTTPS live): https://developer.spotify.com/documentation/web-api/concepts/redirect_uri
- Spotify Web Playback SDK — Overzicht & browserondersteuning: https://developer.spotify.com/documentation/web-playback-sdk
- Spotify Web Playback SDK — Reference (`activateElement()`, `autoplay_failed`-event): https://developer.spotify.com/documentation/web-playback-sdk/reference

### Supabase Realtime & Vercel Hosting
- Supabase Realtime — Limits (bijgewerkt 29 okt 2026: 200 concurrent connections, 100 msg/s, 256 KB broadcast payload, 5 Presence calls/30s/client): https://supabase.com/docs/guides/realtime/limits
- Supabase Realtime — Broadcast: https://supabase.com/docs/guides/realtime/broadcast
- Supabase Realtime — Presence: https://supabase.com/docs/guides/realtime/presence
- Vercel — Hobby Plan Limits (100 GB Fast Data Transfer, 1M CDN requests): https://vercel.com/docs/limits

### Muziekdata & oorspronkelijk releasejaar
- MusicBrainz API — Documentatie (`first-release-date`, ISRC-lookup `/ws/2/isrc/{ISRC}`): https://musicbrainz.org/doc/MusicBrainz_API
- MusicBrainz API — Rate Limiting (1 verzoek/sec per IP, verplichte `User-Agent`, `503` bij overschrijding): https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting
- MusicBrainz — Release Group (oorspronkelijk uitgavejaar over remasters en heruitgaven heen): https://musicbrainz.org/doc/Release_Group

### Browser-API's (mobiele telefoons)
- MDN Web Docs — Screen Wake Lock API: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- CanIUse — Screen Wake Lock API (ondersteuning iOS Safari 16.4+/18.4+ en Android): https://caniuse.com/wake-lock
- MDN Web Docs — Vibration API: https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
- CanIUse — Vibration API (ondersteund op Android, **niet ondersteund** op iOS Safari): https://caniuse.com/vibration
