# Opdracht voor Claude Opus: twee concepten vergelijken, samenvoegen en klaarmaken voor de bouw

Je bent mijn hoofdontwerper, kwaliteitscontroleur en technisch projectleider in één. Je krijgt deze opdracht in één keer en voert hem helemaal zelfstandig uit, van de vergelijking tot en met een kant-en-klare prompt voor Claude Code.

## Situatie
Ik wil een online partyspel maken naar het voorbeeld van het kaartspel Hitster (werknaam: Tune Timeline), voor een avond met 8 tot 10 vrienden. De pc aan de tv toont het bord en speelt de muziek via Spotify (ik heb Premium), iedereen speelt op de eigen telefoon zonder app of account. Hosting op Vercel (gratis), code op GitHub, realtime via mijn bestaande Supabase-project (alleen Broadcast/Presence, geen tabellen). Alles gratis, behalve mijn bestaande abonnementen.

Twee verschillende AI-modellen hebben onafhankelijk van elkaar hetzelfde concept uitgewerkt, op basis van dezelfde opdracht. Ik ben geen ervaren programmeur, spreek en schrijf Nederlands, en wil het resultaat in gewoon Nederlands.

Je hebt toegang tot mijn map `apps`. Alles staat in `apps/tune-timeline/`:
- `00-gedeelde-opdracht.md`: de opdracht die beide modellen kregen (de 11 verplichte hoofdstukken en de eisen aan de mockups). Lees die eerst.
- `01-spelregels-origineel.md` en `02-ontwerp-online-versie.md`: achtergrond en mijn eerste schets.
- `concept-opus/`: de uitwerking van Claude Opus (`CONCEPT.md`, `mockups/index.html`).
- `concept-antigravity/`: de uitwerking van Antigravity (`CONCEPT.md`, `mockups/index.html`, `screenshots/`).
- Is een van de twee mappen leeg of onvolledig, zeg dat dan duidelijk in je eindbericht en werk door met wat er wel is.

## Werkregels
- **Eén keer, volledig, zelfstandig.** Geen tussenvragen, niet wachten op goedkeuring. Waar een keuze nodig is maak je hem zelf, met de beste optie, en noteer je hem met het alternatief.
- **Wees eerlijk en onpartijdig.** Kijk niet welke versie van "jou" komt. Neem het beste over, ook als dat van Antigravity is, en laat zwakke punten vallen, ook als ze van Opus zijn.
- **Controleer feiten zelf online** (zoeken en pagina's lezen). Ga niet af op wat een van de twee concepten beweert. Vermeld de bron.
- **Concreet in plaats van algemeen.** Geen vage termen; beschrijf wat je ziet en wat er gebeurt.
- In deze opdracht bouw je nog **geen werkende app**. Je schrijft documenten, mockups en prompts.
- Gebruik je browser om beide mockups te openen en te controleren (1920×1080 tv en 390×844 telefoon) en maak screenshots.

## Wat je doet, in deze volgorde
1. **Lees alles** en controleer elk concept op volledigheid ten opzichte van de 11 hoofdstukken en de mockup-eisen uit `00-gedeelde-opdracht.md`.
2. **Vergelijk per hoofdstuk** (1 t/m 11) en schrijf dat op in `apps/tune-timeline/concept-v2/VERGELIJKING.md`: wat is hetzelfde, wat verschilt, welke versie is per hoofdstuk beter en waarom, wat neem je over en wat laat je vallen. Zet er een kort oordeel bij over de mockups van beide (leesbaarheid op 3 meter, overzicht bij 10 spelers, kaartontwerp, animatie, telefoonbediening), met je screenshots in `concept-v2/screenshots/`.
3. **Controleer tegenstrijdigheden** met bronnen: spelregels van het echte Hitster, Spotify (Web Playback SDK, development mode, autoplay, huidige beperkingen), Supabase Realtime-limieten op het gratis plan, de methode voor het oorspronkelijke jaartal. Zet de uitkomst in `VERGELIJKING.md` onder "Feitencontrole".
4. **Schrijf het samengevoegde concept** in `concept-v2/CONCEPT.md`, in dezelfde 11 hoofdstukken als de opdracht, plus een hoofdstuk 12 "Herkomst": wat komt uit Opus, wat uit Antigravity en wat is nieuw. Het concept moet zelfstandig leesbaar, definitief en intern consistent zijn: geen "optie A of B" meer, regels, schermen en techniek moeten bij elkaar passen (loop dat na). Alle keuzes met alternatief staan in hoofdstuk 9.
5. **Maak één nieuwe mockuppagina** `concept-v2/mockups/index.html` met de gekozen stijl en alle toestanden uit de opdracht (tv en telefoon, voorbeeldbeurt doorklikbaar, tv met 10 spelers). Open hem, controleer hem op leesbaarheid en afgeknipte elementen, en verbeter. Deze pagina is straks het visuele voorbeeld voor de bouw.
6. **Beslissingen voor mij**: schrijf `concept-v2/BESLISSINGEN.md` met de keuzes die echt aan mij zijn (smaak of voorkeur, niet techniek), per keuze jouw aanbeveling en één regel waarom. Claude Code bouwt met jouw aanbevelingen tenzij ik later iets anders zeg.
7. **Mijn voorbereidingen**: schrijf `concept-v2/VOORBEREIDING.md`, een genummerde checklist van alles wat ik zelf moet instellen voordat gebouwd kan worden, in de goede volgorde. Per stap: wat ik moet doen, waar ik moet klikken, en wat ik terug moet geven. Controleer de actuele schermen en vereisten van de diensten online. Neem in elk geval op: een lege GitHub-repo `tune-timeline` (privé), een Vercel-project met dezelfde naam gekoppeld aan die repo, de Spotify Developer-app (redirect-URI's voor lokaal en de Vercel-URL, de juiste scopes, mijn Spotify-account toevoegen als toegestane gebruiker, het Client ID), de Project URL en publieke anon key van het bestaande Supabase-project (met de exacte namen van de environment variables, en hoe ik ze in Vercel en in een lokaal `.env.local`-bestand zet), de Spotify-playlist met de Hitster-nummers (hoe ik die kies en de link/ID noteer, en hoe ik controleer of de nummers in Nederland afspeelbaar zijn). Zet er nooit geheimen in die in de chat of de repo terecht kunnen komen.
8. **Lange prompt voor Claude Code**: schrijf hem naar `apps/tune-timeline/04-prompt-claude-code.md` (overschrijf de placeholder). Eisen:
   - Zelfstandig te begrijpen, in het Nederlands, geschreven voor Claude Code op Opus.
   - Werkmap: `apps/tune-timeline/` wordt de repo. Claude Code verplaatst eerst alle voorbereidingsbestanden (00 t/m 06 en de `concept-*`-mappen) naar `docs/`, maakt een `.gitignore` (inclusief `.env.local`), zet `git init`, koppelt de GitHub-repo (de URL staat in mijn antwoorden uit `VOORBEREIDING.md`) en pusht, zodat Vercel automatisch uitrolt. De app zelf komt in de root van de repo. Lukt inloggen op GitHub niet, dan legt Claude Code mij in gewoon Nederlands uit wat ik moet doen.
   - Verwijst naar `docs/concept-v2/CONCEPT.md`, `BESLISSINGEN.md` en `mockups/index.html` als bron van waarheid voor regels, uiterlijk en gedrag. Het uiterlijk moet de mockup nauwkeurig volgen. Neem ook de belangrijkste regels en keuzes beknopt in de prompt zelf op.
   - Technische keuzes met reden: framework, mappenstructuur, spelregels als losse, geteste logica (zonder scherm), Spotify-inlog (PKCE, geen geheimen in de browser), Realtime-opzet met de host als enige bron van waarheid, geen spoilers naar telefoons, opslaan van de status op de host, herverbinden, en het voorbereidingsscript dat de playlist omzet naar een vast `songs.json` met het juiste oorspronkelijke jaar (en een handmatige correctielijst).
   - De exacte namen van de environment variables en waar ze vandaan komen. Geen geheimen in de repo. Het bestaande Supabase-project niet aanraken buiten Broadcast/Presence.
   - Interface in het Nederlands, telefoon eerst en groot en leesbaar op de tv, geen Hitster-merk, logo of kaartontwerp, geen auteursrechtelijk beeld.
   - Bouwvolgorde in fases, per fase duidelijke klaar-criteria en een testlijst voor mij, en de instructie om na elke fase te committen, te pushen, een korte `README`-update te doen, te zeggen wat nu werkt en wat nog niet, en dan te stoppen zodat ik kan testen. Fase 1 is het kernspel zonder tokens; daarna tokens; daarna afwerking en betrouwbaarheid; daarna uitbreidingen.
   - Zelfcontrole: Claude Code draait zelf de build, de tests en de lokale site en controleert de belangrijkste schermen voordat hij een fase afrondt, en meldt eerlijk wat niet getest kon worden.
   - Een testplan voor een echte avond met 8 tot 10 telefoons (schermvergrendeling, wifi-wissel, dubbele taps, host-refresh, nummer dat niet afspeelt).
   - Claude Code vraagt mij alleen iets als hij echt vastzit en legt dan in gewoon Nederlands uit wat ik moet doen.
9. **Eindbericht in de chat** (maximaal 12 regels): wat de belangrijkste verschillen tussen de twee concepten waren, wat je van elk hebt overgenomen, de 3 grootste risico's, waar de bestanden staan, wat ik als eerste moet doen (verwijs naar `VOORBEREIDING.md`) en hoe ik Claude Code start. Sluit af met de **korte prompt voor Claude Code** in een codeblok, klaar om te kopiëren. Die korte prompt moet verwijzen naar `04-prompt-claude-code.md` in de map waarin Claude Code werkt (`apps/tune-timeline/`), zeggen dat hij alles daarin zelfstandig moet uitvoeren en na fase 1 moet stoppen voor mijn test.

## Resultaat
Na afloop staat in `apps/tune-timeline/`:
- `concept-v2/` met `CONCEPT.md`, `VERGELIJKING.md`, `BESLISSINGEN.md`, `VOORBEREIDING.md`, `mockups/index.html` en `screenshots/`;
- een ingevulde `04-prompt-claude-code.md`;
- en in de chat jouw eindbericht met de korte prompt voor Claude Code.
