# Opdracht voor Claude Opus: concept en uiterlijk van Tune Timeline

Je bent mijn productontwerper, speldesigner en visueel ontwerper in één. Je krijgt deze opdracht in één keer en voert hem helemaal zelfstandig uit.

## Hoe je levert (Claude Opus met toegang tot mijn map)
- Je hebt toegang tot mijn map `apps`, waarin deze opdracht staat (`apps/tune-timeline/03-prompt-opus-chat.md`). Schrijf je resultaat in de nieuwe map `apps/tune-timeline/concept-opus/`.
- `concept-opus/CONCEPT.md`: het volledige concept met de 11 hoofdstukken hieronder, in het Nederlands.
- `concept-opus/mockups/index.html`: de mockups (zie hieronder). Je mag extra bestanden toevoegen als dat het overzichtelijker maakt.
- Gebruik je zoekfunctie en webpagina's lezen voor het onderzoek. Controleer je eigen mockups waar mogelijk (bijvoorbeeld door ze in een browser te openen of een screenshot te maken) op 1920×1080 (tv) en 390×844 (telefoon), en verbeter wat onleesbaar of afgeknipt is.
- Kun je geen bestanden schrijven in mijn map? Lever het concept dan als document en de mockups als HTML-artifact in de chat.
- Bouw geen werkende app: geen package.json, geen installaties, geen server. Alleen documenten en statische HTML/CSS/JS voor de mockups.
- Gebruik uitsluitend deze opdracht. Lees of gebruik geen andere bestanden in mijn map (ook niet `concept-antigravity/` of andere prompts of concepten), zodat ik jouw uitkomst eerlijk kan vergelijken met die van een ander model.
- Werk volledig zelfstandig tot alles klaar is. Vraag niets terug, ook niet bij keuzes: kies, noteer het in hoofdstuk 9 en ga door.
- Sluit af met een bericht van maximaal 5 regels: de belangrijkste keuzes die je hebt gemaakt, waar je het minst zeker van bent, en waar de bestanden staan.

## Wat ik wil
Een website waarmee ik met 8 tot 10 vrienden op een feestavond een spel kan spelen dat zo dicht mogelijk bij het kaartspel Hitster ligt, maar online. Ik wil niets printen. Iedereen speelt op de eigen telefoon (zonder app of account). De pc die aan de tv hangt toont het centrale bord en speelt de muziek af. De muziek komt van Spotify; de host (ik) heeft Spotify Premium. Ik gebruik een Spotify-playlist met de nummers van het echte Hitster-spel.

Het spel moet het echte spel zo goed mogelijk volgen: tijdlijn bouwen, jaartal raden, 10 kaarten om te winnen, en de Hitster-tokens (overslaan, stelen, kopen, verdienen). Eigen naam en eigen uiterlijk (werknaam: Tune Timeline), niet het merk, de logo's of de huisstijl van Hitster kopiëren.

## Mijn situatie en beperkingen
- Alles moet gratis kunnen, op mijn bestaande abonnementen na (Spotify Premium, Claude).
- Hosting: Vercel (gratis Hobby), code op GitHub (repo `tune-timeline`).
- Supabase: ik heb op het gratis plan geen ruimte voor een tweede project, dus het spel gebruikt het bestaande project (van mijn studiewebsite) uitsluitend voor Realtime Broadcast/Presence, zonder tabellen of opslag.
- Tv: er hangt een pc aan, die opent het host-scherm in de browser.
- Ik ben tweedejaars student Commerciële Economie, spreek en schrijf Nederlands en ben geen ervaren programmeur. Schrijf in gewoon Nederlands, concreet en zonder onnodig jargon.

## Wat ik NU van je vraag
Het gaat nu uitsluitend om het **idee en het concept, in detail, inclusief hoe het eruit gaat zien**. Er wordt nu niets gebouwd: geen werkende app, geen instructies voor het instellen van accounts, geen prompt voor een programmeerhulpmiddel. Dat komt later.

Ik laat deze opdracht door twee verschillende AI-modellen uitvoeren en vergelijk de uitkomsten daarna, om van beide te leren en ze samen te voegen. Werk daarom zelfstandig en volledig, en verwacht geen vervolgvragen van mij.

### Werkregels
- **Eén keer, volledig.** Geen fases, geen tussenvragen, niet wachten op goedkeuring. Waar een keuze nodig is maak je hem zelf, je kiest de beste optie en zet hem in het hoofdstuk "Keuzes en aannames" met het alternatief dat je overwoog.
- **Bijlage B is een startpunt, geen opdracht.** Een eerste ontwerp van mij. Je mag en moet afwijken en verbeteren waar jij een betere oplossing ziet, en je beantwoordt de "open vragen" onderaan zelf. Leg kort uit waar en waarom je afwijkt.
- **Onderzoek echt, zoek op.** Controleer zelf online de actuele Hitster-regels (regionale verschillen), de huidige mogelijkheden en beperkingen van de Spotify Web API en Web Playback SDK (development mode, wat de laatste tijd is beperkt of verwijderd, autoplay in de browser), de limieten van Supabase Realtime op het gratis plan voor 10 spelers, en hoe je het oorspronkelijke releasejaar van nummers betrouwbaar bepaalt (Spotify geeft vaak het jaar van de heruitgave). Vermeld per feit waar het vandaan komt. Als iets niet te vinden is, zeg dat eerlijk in plaats van te gokken.
- **Concreet in plaats van algemeen.** Geen opsommingen als "mooie animaties" of "gebruiksvriendelijk". Beschrijf wat je ziet, hoe lang het duurt, welke kleur, welke tekst er staat, wat er gebeurt bij een tik.
- **Denk aan een echte avond.** 8 tot 10 mensen, drank in de hand, tv op 3 meter afstand, telefoons met halflege accu, wifi dat hapert, mensen die even weglopen. Wat houdt het leuk en vlot, ook als je pas na 9 spelers aan de beurt bent?
- Eigen creatie: geen Hitster-logo's, kaartontwerp of huisstijl nabootsen en geen echte albumhoezen of auteursrechtelijk beschermd beeld in mockups (gebruik kleurvlakken, patronen en placeholders).

### Verplichte inhoud van het resultaat
Gebruik precies deze hoofdstukken in deze volgorde, zodat de twee uitkomsten naast elkaar gelegd kunnen worden:

1. **Samenvatting**: het hele concept in maximaal 12 regels.
2. **Spelregels (definitief)**: alle regels van het spel zoals ik het ga spelen, inclusief startopstelling, beurtvolgorde, plaatsen, hetzelfde jaar, tokens (overslaan, stelen, kopen, verdienen), moeilijkheidsniveaus, win-conditie, en alle uitzonderingen en randgevallen (bijvoorbeeld wat als twee spelers tegelijk 10 kaarten halen, of niemand de steal haalt, of een speler wegvalt). Zeg per regel of hij uit het echte spel komt of een online aanpassing is.
3. **Spelbeleving van begin tot eind**: een volledige avond, van het opzetten van de pc tot het winnaarsmoment: wat gebeurt er wanneer, hoe lang duurt een beurt en een hele partij (schatting), hoe blijven de spelers die niet aan de beurt zijn betrokken (steal-spanning, meeraden, reacties), hoe bouwt de spanning op, en wat gebeurt er na het einde (opnieuw spelen).
4. **Uiterlijk en gevoel**:
   - visuele identiteit: naam, logo-idee, sfeer, kleurpalet (met hexcodes), lettertypes, vormtaal, kaartontwerp (muziekkaart, raadselkaart, omgedraaide kaart, hoe de flip eruitziet);
   - geluid en animatie: welke geluiden, welke animaties met timing;
   - **elk TV-scherm** en **elk telefoonscherm** per toestand, minimaal: lobby, uitleg, beurtstart, nummer speelt, plaatsen (live), steal-venster, onthulling goed en fout, steal-resultaat, tokens, tussenstand, winnaar, foutmeldingen en verbinding verloren, en op de telefoon: aanmelden, naam/kleur kiezen, wachten, jouw beurt, bevestigen, steal kiezen, resultaat, tokens, winnaar;
   - hoe de tv er met 8 tot 10 spelers tegelijk uitziet zonder dat het onleesbaar wordt;
   - leesbaarheid op 3 meter en bedienbaarheid met één hand op de telefoon (minimale lettergroottes en tikdoelen).
5. **Interactiedetails**: hoe je precies een kaart plaatst op de telefoon, hoe stelen werkt (wie is eerst, tijdslimiet, wat zie je), timers, trillen, wat gebeurt bij dubbel tikken of te laat tikken.
6. **Muziek en data**: Spotify-playlist, hoe afspelen werkt, hoe je het juiste oorspronkelijke jaar per nummer bepaalt, wat je doet met nummers die niet afspeelbaar zijn, en hoe de nummerlijst wordt voorbereid.
7. **Technisch concept op hoofdlijnen**: architectuur (host als bron van waarheid), realtime opzet, hoe je voorkomt dat telefoons het antwoord kunnen zien voor de onthulling, hoe herverbinden werkt, bekende limieten (met bronnen). Geen code, wel genoeg dat een programmeerhulpmiddel er later mee kan bouwen.
8. **Risico's en oplossingen**: een lijst van wat er op een echte avond mis kan gaan, met per risico de oplossing.
9. **Keuzes en aannames**: elke keuze die je zelf hebt gemaakt, met het alternatief en waarom jij dit koos. Inclusief waar en waarom je van Bijlage B bent afgeweken.
10. **Mogelijke uitbreidingen**: wat later kan (coöperatief, teams, thema's, statistieken, enzovoort), kort.
11. **Bronnen**: alle bronnen die je gebruikte, met link.

### Mockups (verplicht, naast de tekst)
Maak mockups van hoe het eruitziet: **één zelfstandige HTML-pagina** (alleen HTML, CSS en een beetje JavaScript, zonder externe bestanden of internet nodig, systeemlettertypes of inline) waarin je:
- een TV-scherm (16:9) en een telefoonscherm naast elkaar toont;
- met knoppen door de toestanden van één voorbeeldbeurt kunt klikken (bijvoorbeeld met 4 spelers: beurtstart, nummer speelt, plaatsen, steal, onthulling, resultaat, winnaar);
- ook een overzicht hebt van het TV-scherm met 10 spelers;
- de kleuren, lettertypes en vormen uit hoofdstuk 4 gebruikt.
De mockups hoeven niet te werken als echt spel, maar moeten er precies zo uitzien als het uiteindelijk moet worden en verschillende toestanden laten zien.

---

# BIJLAGE A: Regels van het echte Hitster

Doel van dit bestand: de online versie zo dicht mogelijk bij het echte spel houden. Samengesteld uit de officiële regelpagina's van Hitster (hitstergame.com, meerdere landversies) en regelsamenvattingen (rulespal.com, officialgamerules.org), november 2026. Regionale versies verschillen op details; die staan onder "Afwijkingen / keuzes".

## Basis
- Spelers: 2 tot 10, individueel of in teams.
- Elke speler (of team) krijgt 1 muziekkaart, open met het jaartal zichtbaar. Dat is het begin van zijn tijdlijn.
- Een kaart heeft aan de ene kant een QR-code (speelt het nummer af via de Hitster-app/Spotify) en aan de andere kant artiest, titel en jaar.
- Wie het oudste nummer in zijn tijdlijn heeft begint, daarna gaat het spel met de klok mee (naar links).
- Winnaar: de eerste die 10 kaarten correct in chronologische volgorde in zijn tijdlijn heeft (de startkaart telt mee in de tijdlijn, controleren bij de bouw).
- Jaar = het jaar waarin het nummer voor het eerst publiek beschikbaar was (download, stream of fysieke single/album, in welke markt dan ook).

## Een beurt
1. Scannen: de actieve speler pakt de bovenste kaart en scant de QR-code, het nummer begint te spelen. Alleen de muziek is te horen, titel, artiest en jaar zijn verborgen.
2. Plaatsen: de actieve speler legt de kaart op de plek in zijn tijdlijn waar hij denkt dat het hoort (ervoor, ertussen of erna).
3. Omdraaien: de kaart wordt omgedraaid. Staat hij goed, dan houdt de speler hem. Staat hij fout, dan gaat hij weg (wordt afgelegd), tenzij een andere speler hem steelt (zie tokens).
4. Beurt gaat naar de volgende speler.
- Hetzelfde jaar: als twee nummers hetzelfde jaar hebben, mag de kaart direct ervoor of erachter, beide telt als goed.
- Plaatsen gebeurt altijd zonder het jaar te zien.

## Hitster-tokens (optioneel, maar de leukste variant)
Elke speler start met 2 tokens (Scandinavische versie noemt 3; Pro 5; Expert 3). Maximum 5 tokens per speler.
Er zijn drie manieren om tokens te gebruiken:
1. Eigen beurt, nummer overslaan: betaal 1 token, scan een nieuwe kaart. Token en overgeslagen kaart gaan weg.
2. Beurt van een tegenstander, kaart stelen: voordat de kaart wordt omgedraaid roep je "HITSTER!" en leg je 1 token op de plek in de tijdlijn van de tegenstander waar jij denkt dat de kaart hoort. Klopt het (en had de tegenstander het fout), dan steel je de kaart en leg je hem correct in je eigen tijdlijn. Klopt het niet, dan ben je het token kwijt.
   - Wie het eerst "HITSTER" roept, mag als eerste zijn token plaatsen.
   - Een volgende speler mag een andere plek kiezen. Twee tokens kunnen niet op dezelfde plek.
3. Altijd, kaart kopen: ruil 3 tokens voor de bovenste kaart van de stapel en leg hem direct goed in je tijdlijn zonder te raden. Moet gebeuren voordat je het nummer hoort (niet eerst luisteren en dan besluiten). In sommige versies mag je dan je volgende beurt niet spelen.

Tokens verdienen: noem je op je eigen beurt zowel artiest als titel goed, dan krijg je 1 token (ook als je de kaart verkeerd plaatste). Maximaal 5 tokens.

## Moeilijkheidsniveaus
- Original: bovenstaande regels.
- Pro: iedereen start met 5 tokens, tokens verdienen kan niet. Je moet artiest en titel noemen om een kaart te winnen of te stelen.
- Expert: start met 3 tokens, verdienen kan niet. Je moet artiest, titel én exact jaar noemen. Bij een gelukte steal houd je je token.
- Coöperatief: één gedeelde tijdlijn, team start met 5 tokens en 1 kaart. Fout geplaatst = 1 token kwijt. Win door 10 kaarten te verzamelen voordat de tokens op zijn.
- Solo: bestaat ook (spelen tegen jezelf).

## Afwijkingen / keuzes (regionale verschillen)
- Beginhoeveel tokens: 2 (meeste versies) of 3 (Scandinavisch).
- Na het kopen van een kaart met 3 tokens: in sommige versies sla je je volgende beurt over.
- Of een geslaagde steal het token terugbrengt: alleen bij Pro/Expert.
- Hoe "artiest+titel goed" wordt beoordeeld: in het echte spel beslist de groep/de kaart. Online bestaat daar geen vanzelfsprekende oplossing, dat moet bewust worden ontworpen.

## Bronnen
- hitstergame.com (regelpagina's per land, bv. en-us, en-au, en-nz, en-za)
- rulespal.com/hitster/rulebook en varianten
- officialgamerules.org/game-rules/hitster
- nordics.hitstergame.com/sv-en/how-to-play

---

# BIJLAGE B: Eerste ontwerp van de online versie (startpunt, geen opdracht)


Werknaam: **Tune Timeline** (eigen naam, bewust niet "Hitster": dat is een merknaam. Het spelprincipe nabootsen voor een privéfeestje is prima, naam, logo en uiterlijk houden we eigen).

## Doel
Een website voor een feestavond met 8 tot 10 mensen. De pc staat aangesloten op de tv en toont het centrale bord. Iedereen speelt op de eigen telefoon, zonder app, zonder printen, zonder account. De regels en het gevoel moeten zo dicht mogelijk bij het echte Hitster liggen.

## Schermen en rollen
1. **Host-scherm (pc op de tv)**: bord + muziek. Hier logt de host eenmalig in met Spotify Premium. Dit scherm is de baas over de spelstatus.
2. **Speler-scherm (telefoon)**: je scant de QR-code op de tv (of typt de roomcode), kiest een naam en kleur/avatar, en ziet je eigen tijdlijn en knoppen.
3. Optioneel later: **gamemaster-knoppen** op de host-pc (toetsenbord) of op de telefoon van de host, voor beslissingen die de groep moet nemen (zie "Titel en artiest").

## Spelverloop (zoals het echte spel, vertaald naar online)
1. **Lobby**: tv toont grote QR + roomcode, en de lijst met spelers die binnenkomen. Host kiest instellingen: playlist, aantal kaarten om te winnen (standaard 10), tokens aan/uit, moeilijkheidsniveau (Original, Pro, Expert, later Coöperatief). Host drukt op Start.
2. **Start**: elke speler krijgt 1 willekeurige startkaart, jaartal zichtbaar op zijn tijdlijn. Wie het oudste nummer heeft begint, daarna in de volgorde waarin de spelers binnenkwamen (of in een draaikolk-animatie gelote volgorde).
3. **Beurt**:
   - De tv speelt het volgende nummer af (alleen geluid, een draaiende plaat/equalizer, geen titel/jaar).
   - Op de telefoon van de actieve speler verschijnt zijn tijdlijn met tikbare "plekken" tussen de kaarten. Hij kiest een plek en bevestigt ("Vastzetten"). Op de tv zie je live waar hij zijn kaart neerlegt.
   - Terwijl dat gebeurt kunnen andere spelers (die tokens hebben) op hun telefoon op een grote HITSTER-achtige knop tikken ("STEAL!") en dan een plek in de tijdlijn van de actieve speler kiezen. Volgorde van tikken telt (server-/host-tijd), een plek kan maar één keer gekozen worden.
   - De actieve speler kan 1 token inzetten om het nummer over te slaan (voor hij vastzet).
   - Eventueel: de actieve speler tikt "Ik weet titel én artiest" voor hij vastzet.
4. **Onthulling**: de tv "draait de kaart om" (flip-animatie): titel, artiest, jaar, hoesafbeelding. Daarna het resultaat: goed of fout, wie de steal heeft gewonnen, tokens erbij of eraf.
5. **Titel en artiest beoordelen**: wie "Ik weet titel én artiest" claimde, krijgt de titel en artiest te zien; de groep (of de host) beslist met een tik "klopt / klopt niet". Eerste versie: de host beslist. Daarna eventueel stemmen met alle telefoons.
6. **Volgende beurt**, tot iemand zijn doel (10 kaarten) haalt: winnaarscherm met confetti en een overzicht (wie had welke kaarten, snelste/moeilijkste nummer, enz.).

## TV-scherm (moet leesbaar zijn op 3 meter, 10 spelers)
- Donker thema, grote lettertypes, hoog contrast, mooie animaties maar niet druk.
- Boven: scorebalk met alle spelers (naam, kleur, aantal kaarten, tokens), actieve speler uitgelicht.
- Midden: grote tijdlijn van de actieve speler (jaartallen zichtbaar, de nieuwe kaart als raadselkaart met vraagteken).
- Onder of zij: compacte tijdlijnstrips van de anderen (alleen aantal kaarten of kleine kaartjes).
- Altijd ergens klein: QR-code om later nog te kunnen instappen.
- Geluidsknoppen en volume op de pc, niet op het tv-scherm tonen tijdens het spel (alleen kleine, onopvallende pauzeknop).

## Telefoonscherm
- Verticaal, grote knoppen, werkt met één hand.
- Eigen tijdlijn scrollbaar (horizontaal of verticaal, kies wat het best werkt bij 10 kaarten), plekken duidelijk markeren.
- Bij andermans beurt: kijken wat er gebeurt + de STEAL-knop (alleen zichtbaar als je tokens hebt en het venster open is).
- Tokens, kaartenaantal, naam en kleur altijd zichtbaar in een slanke bovenbalk.
- Trillen (haptic) bij jouw beurt, schermlock tegengaan (Wake Lock API) zodat de telefoon niet in slaap valt tijdens het feest.
- Opnieuw verbinden na schermvergrendeling of netwerkwissel zonder dat je je plek kwijtraakt (zie "Betrouwbaarheid").

## Tokens online
- Start met 2 tokens (instelbaar), maximaal 5.
- Overslaan: 1 token, alleen voor de eigen beurt, voor het vastzetten.
- Stelen: 1 token, binnen het stealvenster (tot de actieve speler heeft vastgezet + korte tijd, daarna sluit het venster, dan onthulling). Tokens op dezelfde plek zijn niet toegestaan, de eerste tik wint de plek. Kiezen is dus ook een snelheidswedstrijd, net als in het echte spel.
- Kopen: 3 tokens voor een kaart zonder te raden, alleen voordat het nummer wordt afgespeeld (dus aan het begin van je beurt, voor de muziek start). Keuze nog te maken: daarna volgende beurt overslaan ja of nee.
- Verdienen: titel én artiest goed op je eigen beurt (ook als de plaatsing fout was).

## Muziek en data
- Muziek: Spotify Web Playback SDK in de browser van de host-pc. Vereist Spotify Premium (dat heeft de host) en een autoplay-klik van de host om audio te starten.
- Nummerbron: een Spotify-playlist met de nummers van het echte Hitster-spel (door de gebruiker te kiezen).
- **Belangrijkste datarisico: het jaartal.** Spotify geeft de releasedatum van het album, niet van het oorspronkelijke nummer. Compilaties, remasters en heruitgaven geven dan een veel te laat jaartal. Aanpak voor Opus om uit te werken:
  - Een eenmalig voorbereidingsscript (draaien door Claude Code, lokaal) dat de playlist ophaalt, per nummer het oorspronkelijke jaar bepaalt (bv. via MusicBrainz, op ISRC of artiest+titel, vroegste releasejaar) en alles opslaat in een vast bestand (`songs.json`) dat in de repo komt.
  - Handmatige correctielijst voor nummers waar de automatische jaartallen afwijken (vooral van de echte Hitster-kaarten, die hun eigen jaartal hebben).
  - Tijdens het spel is er dan geen afhankelijkheid van externe data-API's behalve Spotify zelf voor het afspelen.
- Beschikbaarheid: nummers die in Nederland niet afspeelbaar zijn, vooraf eruit filteren.

## Realtime en architectuur (voorstel)
- Hosting: Vercel (gratis Hobby). Frontend: TypeScript, React (Vite of Next.js, Opus mag kiezen), geen eigen server nodig.
- Realtime: Supabase Realtime **Broadcast + Presence** in het bestaande gedeelde project, kanaalnaam per spel (bv. `tt-room-<code>`). Geen tabellen, geen opslag. Niets raakt de studiewebsite-data.
- **Host is de enige bron van waarheid.** Telefoons sturen alleen "intenties" (plek gekozen, steal, skip, claim). De host beslist, valideert en stuurt de nieuwe spelstatus terug.
- **Geen spoilers naar telefoons**: jaartal, titel en artiest van het huidige nummer worden pas verstuurd bij de onthulling. Alleen plek-indexen gaan heen en weer tijdens de beurt.
- Spelstatus op de host wordt in localStorage bewaard, zodat een pagina-refresh het spel niet laat verdwijnen.
- Spotify-inlog via Authorization Code met PKCE (geen client secret in de browser). Access token vernieuwen automatisch.

## Betrouwbaarheid (hier gaat een feestspel meestal mis)
- Telefoon valt in slaap of wisselt van wifi naar 4G: automatisch herverbinden, opnieuw synchroniseren met de huidige status, dezelfde speler terugkrijgen (spelers-ID in localStorage).
- Speler verlaat het spel: host kan hem overslaan of verwijderen.
- Host-pc-refresh midden in het spel: spel hervat vanuit localStorage, Spotify-player opnieuw verbinden.
- Spotify-token verlopen: stil vernieuwen.
- Nummer start niet of is niet afspeelbaar: automatisch een ander nummer trekken zonder dat iemand een token kwijt is.
- Meerdere keer tikken, dubbele berichten, race conditions bij steals: de host verwerkt events één voor één met een volgnummer.
- Maximaal 10 spelers, extra spelers kunnen meekijken als toeschouwer (optioneel).

## Wat bewust anders is dan het echte spel
- Geen fysieke kaarten: de kaart ligt "digitaal" in de tijdlijn.
- Tijdlijn-plaatsing gebeurt via tikken in plaats van kaart neerleggen.
- Het stealvenster heeft een korte tijdslimiet in plaats van roepen (anders wacht het spel eindeloos).
- Het beoordelen van titel en artiest moet door een mens bevestigd worden.

## Bouwfases (voor later, niet voor deze opdracht: lever nu alles in één keer)
**Fase 1, speelbare basis (MVP)**: lobby met QR, spelers joinen, nummers spelen op de tv, plaatsen in tijdlijn, onthulling, winnen met 10 kaarten. Geen tokens.
**Fase 2, tokens**: overslaan, stelen, verdienen, kopen.
**Fase 3, afwerking**: animaties, geluid, reconnect, instellingen, moeilijkheidsniveaus (Pro, Expert), winnaarsoverzicht.
**Fase 4, extra's**: coöperatieve modus, teams, tijdslimiet, thema's/decennia-filter, statistieken na afloop.

## Open vragen voor het verfijnen
- Eén gemeenschappelijke playlist of kiezen per decennium/genre bij het starten?
- Hoeveel tijd mag een beurt duren (timer ja/nee)?
- Wie beoordeelt titel en artiest: host, of stemmen?
- Moet de host zelf ook meespelen? (ja, waarschijnlijk, dus de host heeft ook een telefoon nodig).
- Teams ondersteunen bij 10 personen?
- Welke stijl/kleuren/sfeer voor het uiterlijk?
