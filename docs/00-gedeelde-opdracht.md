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
