# Ontwerp van de online versie (eerste uitwerking, nog te verfijnen met Opus)

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
