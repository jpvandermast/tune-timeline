# Prompt voor Claude Code: bouw Tune Timeline

*Geschreven voor Claude Code (Opus) door de vergelijkingsrun van 24 november 2026. Werk zelfstandig. Vraag Josse alleen iets als je echt vastzit, en leg dan in gewoon Nederlands uit wat hij moet doen.*

## 0. Wie, wat en waarom
Josse (tweedejaars Commerciële Economie, geen ervaren programmeur) wil een online feestspel voor 8–10 vrienden naar het principe van Hitster, met eigen naam en uiterlijk: **Tune Timeline**. De pc aan de tv toont het bord en speelt muziek via Spotify (Josse heeft Premium); iedereen speelt op de eigen telefoon zonder app of account. Hosting op Vercel (gratis), code op GitHub, realtime via zijn bestaande Supabase-project (alleen Broadcast/Presence). Alles gratis. Praat met Josse in gewoon Nederlands, zonder onnodig jargon.

## 1. Bron van waarheid
Na stap 2 staan de ontwerpstukken in `docs/`. Lees ze helemaal vóór je begint:
- `docs/concept-v2/CONCEPT.md` — **alle regels, schermen, teksten, tijden en techniek**. Bij twijfel wint dit document.
- `docs/concept-v2/BESLISSINGEN.md` — smaakkeuzes; bouw met de aanbeveling, tenzij Josse bij "Mijn antwoorden" in `VOORBEREIDING.md` iets anders heeft ingevuld.
- `docs/concept-v2/mockups/index.html` — **het uiterlijk**. Volg dit nauwkeurig: kleuren, maten, teksten, indeling. Open hem met `?only=tv&state=<toestand>`, `?only=phone&phone=<toestand>` of `?only=ten`. Screenshots van alle toestanden staan in `docs/concept-v2/screenshots/v2-*.png`.
- `docs/concept-v2/VOORBEREIDING.md` — wat Josse heeft ingesteld; onderaan "Mijn antwoorden" (repo-URL, Vercel-adres, afwijkingen).
- `docs/concept-v2/VERGELIJKING.md` — achtergrond, hoef je niet te volgen.

## 2. Eerst: de repo opzetten
De werkmap `apps/tune-timeline/` wordt de repo. De app komt in de **root**.
1. Maak `docs/` en verplaats daarheen: `00-gedeelde-opdracht.md` t/m `06-prompt-vergelijking.md` (dus ook dit bestand, `04-…`), `README.md` (wordt `docs/README-voorbereiding.md`), en de mappen `concept-opus/`, `concept-antigravity/`, `concept-v2/`. **Verplaats `.env.local` niet** (blijft in de root). Verwijder `.DS_Store`-bestanden.
2. Maak `.gitignore` met minstens: `node_modules/`, `dist/`, `.env`, `.env.local`, `.env.*.local`, `.DS_Store`, `*.log`, `.vercel/`, `scripts/.cache/`, `playwright-report/`, `test-results/`.
3. Controleer dat `.env.local` bestaat en de vijf namen uit hoofdstuk 5 bevat (lees alleen of ze er zijn; **print nooit de waarden**). Ontbreekt iets, ga verder met wat je zonder kunt en meld het aan het eind.
4. `git init -b main`, eerste commit.
5. Koppel de GitHub-repo (URL staat bij "Mijn antwoorden"): `git remote add origin <url>`. De repo heeft al een README van GitHub: `git fetch origin` en `git merge origin/main --allow-unrelated-histories` (houd bij een conflict jouw `README.md`). Dan `git push -u origin main`. **Nooit force-pushen.**
6. Lukt pushen niet (niet ingelogd): leg Josse in gewoon Nederlands uit wat hij moet doen (`gh auth login` → GitHub.com → HTTPS → Login with a web browser), wacht, probeer opnieuw.
7. Vercel is al gekoppeld aan de repo: elke push naar `main` rolt automatisch uit.

## 3. De belangrijkste regels (beknopt; details in CONCEPT.md hoofdstuk 2)
- 2–10 spelers. Iedereen 1 open startkaart (uniek startjaar, 1960–2015) en 2 tokens, max 5. Volgorde = volgorde van binnenkomst; oudste startkaart begint.
- Beurt: beurtstart 6 s (kopen kan, "Start nummer" of vanzelf) → nummer speelt, plaatsen in 45 s, live zichtbaar op de tv → optioneel schuifje "Ik noem titel + artiest" (hardop zeggen) → Vastzetten → **steelvenster 10 s** → onthulling → bezwaar 6 s (bij claim) → volgende. Tussenstand 6 s na elke ronde.
- Goed als jaar ≥ links en ≤ rechts; gelijk jaar mag aan beide kanten. Timer op 0: gekozen plek telt, geen plek = fout.
- **Stelen**: 1 token, niet de actieve speler, max 1× per beurt per speler, niet op de plek van de actieve speler (Original), eerste ontvangen tik wint een plek. Actieve speler goed → alle stelers token kwijt. Fout + steler goed → kaart naar steler (op de juiste plek in zijn tijdlijn). Twee goede stelers → eerste wint, ander token terug. Niemand goed → kaart weg, tokens weg. Venster sluit eerder als iedereen die kan, gestolen of gepast heeft.
- **Overslaan** 1 token vóór vastzetten (nieuw nummer, timer opnieuw, vaker mag). **Kopen** 3 tokens alleen in de beurtstart: kaart meteen goed in je tijdlijn, daarna speel je gewoon je beurt. **Verdienen**: titel + artiest goed (geen bezwaar) = +1, ook bij foute plaatsing, max 5.
- **Bezwaar**: telt als goed tenzij ≥ de helft (naar boven afgerond) van de andere online spelers "Fout!" tikt. Host kan omdraaien.
- **Winnen**: eerste met doel (standaard 10, instelbaar 6/8/10/12; advies 8 bij 8+ spelers) kaarten, startkaart telt mee. Steler of koper die het doel haalt wint meteen. Stapel op → afgelegde/overgeslagen nummers opnieuw schudden.
- Pro/Expert pas in fase 3 (zie CONCEPT 2.8).
- Randgevallen (offline speler 20 s, nummer speelt niet na 6 s, late instappers tot einde ronde 2, "Ik speelde al"): CONCEPT 2.9.

## 4. Technische keuzes (met reden)
| Onderwerp | Keuze | Reden |
|---|---|---|
| Framework | **Vite + React + TypeScript**, `npm`. Vitest voor tests, Playwright voor schermcontroles. | Statische site, geen server nodig; snel en eenvoudig op Vercel. |
| Routes | `/` (kies tv of meedoen), `/tv`, `/speel`, `/speel/:code` (QR; kanaalgeheim na `#`), `/callback`. `vercel.json` met een rewrite van alles naar `/index.html`. | Eén app, twee rollen. |
| Mappen | `src/game/` (spelregels, puur TypeScript, geen React), `src/game/__tests__/`, `src/net/` (Supabase-kanaal, berichttypes), `src/spotify/` (PKCE, SDK, speler), `src/tv/` (tv-schermen), `src/phone/` (telefoonschermen), `src/ui/` (kaart, bordje, knoppen, kleuren uit de mockup), `src/audio/` (Web Audio-effecten), `public/songs.json`, `public/fonts/` (Space Grotesk), `scripts/build-songs.ts`, `data/corrections.csv`, `data/rapport.md`. | Regels los van het scherm zijn testbaar en voorkomen fouten. |
| Spelregels | Eén pure functie `apply(state, event) → { state, effects }` plus losse helpers (`isCorrectPlacement`, `resolveSteals`, …). Alle tijden via events met tijdstempel van de tv, geen `Date.now()` in de regels. Willekeur via een meegegeven zaadje (seed). | Deterministisch en volledig te testen zonder scherm. |
| Tests | Vitest-tests voor elke regel en elk randgeval in CONCEPT 2.4–2.9 (zelfde jaar, reeks gelijke jaren, steal-volgorde, twee goede stelers, kopen naar het doel, timer op 0 zonder plek, max 5 tokens, stapel op, enz.). | De regels zijn het hart van het spel. |
| Spotify-inlog | **Authorization Code + PKCE** in de browser, geen client secret. Redirect = `window.location.origin + '/callback'`. Scopes: `streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state`. Token + refresh token in `localStorage` van de tv; elke 45 min vernieuwen. | Geen geheimen in de browser of de repo. |
| Afspelen | Web Playback SDK, **precies één** `Spotify.Player` per pagina; `activateElement()` binnen de klik "Klik om te beginnen"; luister op `ready`, `not_ready`, `autoplay_failed`, `initialization_error`, `authentication_error`, `account_error`. Afspelen via `PUT /me/player/play?device_id=…` met `uris:[…]` en `position_ms`. 15 s geen `ready` → terugvaloptie: apparaten ophalen (`GET /me/player/devices`) en de Spotify-desktopapp aansturen. Nummer na 6 s niet aan het spelen → volgend nummer. | SDK is grillig; zo blijft het spel draaien. |
| Testen zonder Spotify | Een **nep-speler** (`?nep=1` of automatisch in tests): speelt niets, meldt wel "speelt" en voortgang. | Zo kun je alles lokaal en in Playwright testen. |
| Realtime | `@supabase/supabase-js`, `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)`. Kanaal `tt:<CODE>:<kanaalgeheim>` met `broadcast: { self: false, ack: false }`. Presence alleen één `track({spelerId})` per verbinding (limiet: 5 aanroepen per client per 30 s). Lobby-tussenkanaal `tt:<CODE>:lobby` om bij handmatige code het geheim op te vragen. | Geen tabellen nodig; limieten (100 berichten/s) ruim genoeg. |
| Host = bron van waarheid | Alleen de tv past regels toe. Telefoons sturen intenties `{type, spelerId, spelerGeheim, actieId, …}`; de tv controleert fase, speler, tokens, geheim en `actieId` (elk één keer). Tv stuurt `state` (publiek) met oplopend `versie`; bij live plaatsen max 4×/s. Telefoons negeren oudere versies. | Eerlijk en bestand tegen dubbele/late berichten. |
| Geen spoilers | Tijdens een beurt bevat de publieke status geen titel/artiest/jaar/ID van het lopende nummer. `songs.json` wordt alleen door `/tv` met `fetch` geladen, nooit geïmporteerd in telefooncode. Schrijf een test die controleert dat de publieke status vóór de onthulling geen nummergegevens bevat. | Telefoons mogen het antwoord niet kunnen zien. |
| Opslaan op de tv | Volledige status (inclusief stapel en geheimen) na elke wijziging in `localStorage` (sleutel per kamercode). Bij herladen: terugzetten, kanaal openen, één klik "Muziek hervatten". | Per ongeluk verversen mag het spel niet kosten. |
| Herverbinden | Telefoon bewaart `spelerId`, `spelerGeheim`, code, kanaalgeheim. Bij `visibilitychange` → zichtbaar, `online`-event of kanaalfout: opnieuw abonneren en `hello` sturen; tv antwoordt met volledige status. Tv-heartbeat elke 5 s; een tweede tv toont "Er is al een tv actief". | iPhones verbreken websockets stil op de achtergrond. |
| Scherm aan | Screen Wake Lock na "Ik doe mee", opnieuw bij zichtbaar worden. Trillen alleen als `navigator.vibrate` bestaat; altijd ook een beeldsignaal. | iPhone trilt niet via de browser. |
| Voorbereidingsscript | `scripts/build-songs.ts` (draai met `npx tsx`): PKCE-inlog via een tijdelijke server op `http://127.0.0.1:8888/callback` met scopes `playlist-read-private playlist-read-collaborative` (opent de browser; Josse logt in), `GET /playlists/{id}/items?market=NL` (paginering), per nummer ISRC uit `external_ids.isrc`, `is_playable`, relinking. MusicBrainz `GET https://musicbrainz.org/ws/2/isrc/{isrc}?inc=artist-credits&fmt=json` en zo nodig zoeken op opgeschoonde artiest + titel; max 1 verzoek/s, User-Agent `TuneTimeline/1.0 ( <MUSICBRAINZ_CONTACT> )`; resultaten cachen in `scripts/.cache/`. Beslisregel en statussen uit CONCEPT 6.3; `data/corrections.csv` (`spotifyId;year;note;startMs`) wint altijd. Uitvoer: `public/songs.json` (velden CONCEPT 6.5) en `data/rapport.md` (niet afspeelbaar, `controleren`, gebruikte correcties). | Spotify geeft vaak het jaar van een heruitgave. |

## 5. Environment variables (exacte namen)
| Naam | Herkomst | Gebruik |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase → Connect / Project Settings → Data API | site |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → Publishable key (`sb_publishable_…`) | site |
| `VITE_SPOTIFY_CLIENT_ID` | Spotify Developer Dashboard → app → Basic Information | site + script |
| `SPOTIFY_PLAYLIST_ID` | eigen playlist-link | alleen script |
| `MUSICBRAINZ_CONTACT` | Josse's e-mail | alleen script |

Lokaal uit `.env.local` (Vite leest `VITE_*` automatisch; het script leest het bestand zelf). Op Vercel staan de drie `VITE_*`-variabelen al. **Geen geheimen in de repo**, geen client secret, geen Supabase secret/service_role. Maak wel een `.env.example` met alleen de namen.

## 6. Grenzen
- Het bestaande Supabase-project **niet aanraken** buiten Realtime Broadcast/Presence: geen tabellen, migraties, policies, storage, edge functions of instellingen wijzigen.
- Interface volledig in het **Nederlands**. Telefoon eerst ontworpen (390×844, één hand, tikdoelen ≥ 48 px, hoofdknop 64 px onderaan); tv groot en leesbaar op 3 m (1920×1080, minimaten CONCEPT 4.6).
- **Geen** Hitster-naam, -logo, -kaartontwerp of -huisstijl in de interface (het woord "Hitster" komt nergens op het scherm; de steelknop heet "STEEL"). Geen albumhoezen of ander auteursrechtelijk beeld. Geluiden met Web Audio, geen bestanden.
- Lokale dev-server op `http://127.0.0.1:5173` (`vite --host 127.0.0.1 --port 5173 --strictPort`); Spotify staat `localhost` niet toe.

## 7. Bouwfases
**Na elke fase:** (1) `npm run build`, `npm test` en de Playwright-controle draaien en groen krijgen; (2) lokaal de site starten en zelf de belangrijkste schermen bekijken op 1920×1080 en 390×844 (Playwright-screenshots, naast de mockup leggen, controleren op afgeknipte tekst en verschil met de mockup); (3) commit met een duidelijke Nederlandse boodschap en push (Vercel rolt uit); (4) korte update in `README.md` (wat het is, hoe je lokaal start, wat werkt); (5) Josse in de chat in gewoon Nederlands vertellen: wat nu werkt, wat nog niet, wat je niet kon testen (bijv. echte Spotify-weergave, echte iPhone), en zijn testlijst; (6) **stoppen** en wachten tot Josse zegt dat je verder mag.

### Fase 1 — Kernspel zonder tokens
Bouwen: projectopzet, kleuren/kaart/bordje als in de mockup, `src/game/` met tests; voorbereidingsscript en eerste `songs.json` (Josse moet daarvoor één keer inloggen bij Spotify; vertel hem wanneer); tv: Spotify verbinden, "Klik om te beginnen", lobby met QR + code + stoelen, startkaarten, beurtstart, nummer speelt, plaatsen live, vastzetten, onthulling goed/mis, tussenstand, winnaar, "Nog een potje"; telefoon: aanmelden, naam/kleur, wachten, jouw beurt, plaatsen, vastgezet, resultaat, andermans beurt; herverbinden van telefoons; tv-status bewaren; nummer speelt niet → volgende; nep-speler.
Klaar als: alle regeltests groen; met de nep-speler kan een volledig spel van 3 spelers tot het doel gespeeld worden (Playwright met 1 tv + 3 telefoon-tabbladen); geen nummergegevens in de publieke status vóór de onthulling; uitrol op Vercel werkt.
Testlijst voor Josse: tv-pagina openen op de tv-pc, Spotify verbinden, met 2–3 telefoons (iPhone + Android) via QR meedoen, een paar beurten spelen, één telefoon even vergrendelen en terugkomen, de tv-pagina verversen midden in een beurt, controleren of de muziek speelt en het jaartal klopt.

### Fase 2 — Tokens
Bouwen: tokens op bordjes en telefoon, overslaan, steelvenster met 2-tikken-flow en "Pas", steelfiches live, alle steal-uitkomsten, kopen in de beurtstart, claim-schuifje, bezwaarsysteem, verdienen, max 5, hostmenu met "Uitslag omdraaien", "Beurt overslaan", "Speler verwijderen", "Pauze".
Klaar als: tests voor alle steal- en tokenregels groen; Playwright-scenario met 4 spelers waarin gestolen, gepast, gekocht en bezwaar gemaakt wordt.
Testlijst: met 3–4 telefoons tegelijk op STEEL tikken, twee op dezelfde plek, te laat tikken, kopen met 3 tokens, titel + artiest claimen en afkeuren.

### Fase 3 — Afwerking en betrouwbaarheid
Bouwen: alle animaties en geluiden (CONCEPT 4.2), match point, meegokken + "Beste oor", emoji-reacties (max 1 per 3 s), uitleg-scherm, prijzen en eindoverzicht, speelduurschatting in de lobby, wake lock, trillen, offline speler 20 s, late instappers, "Ik speelde al", tweede-tv-melding, SDK-terugvaloptie (Spotify-app), token vernieuwen, foutschermen, Pro en Expert, "minder beweging", Space Grotesk meeleveren.
Klaar als: alle toestanden uit de mockup bestaan en lijken er nauwkeurig op; testplan van hoofdstuk 8 doorgelopen voor zover zonder echte mensen mogelijk.
Testlijst: het testplan van hoofdstuk 8 met zoveel mogelijk telefoons.

### Fase 4 — Uitbreidingen (alleen als Josse erom vraagt)
Keuze uit CONCEPT hoofdstuk 10: coöperatief, duo-teams, niveau per speler, eerlijke laatste ronde, decennium-filter/meer playlists, DJ-modus, refreinmodus, statistieken.

## 8. Testplan voor een echte avond (8–10 telefoons)
1. 10 telefoons (mix iPhone/Android) doen mee via QR; één via handmatige code.
2. Telefoon 2 minuten vergrendelen en terugkomen: zelfde plek, zelfde kaarten.
3. Telefoon van wifi naar 4G en terug tijdens een steelvenster.
4. Vier mensen tikken tegelijk STEEL, twee op hetzelfde gat; iemand tikt drie keer snel.
5. Een tik precies na het sluiten van het venster: "Te laat", geen token kwijt.
6. De actieve speler loopt weg (telefoon uit): 20 s wachten, beurt overgeslagen.
7. De tv-pagina verversen midden in een beurt en midden in een steelvenster.
8. Een nummer dat niet afspeelt (zet tijdelijk een niet-bestaand ID in de stapel): binnen 6 s een ander nummer.
9. Spotify-token laten verlopen (of de SDK blokkeren): foutscherm en terugvaloptie.
10. Iemand met lege accu gaat verder op een andere telefoon ("Ik speelde al").
11. Een volledige partij met doel 8 tot de winnaar, daarna "Nog een potje".
12. Leesbaarheid vanaf 3 meter en bediening met één hand met een glas in de andere.

## 9. Wanneer je Josse iets vraagt
Alleen als je echt vastzit (inloggen bij GitHub of Spotify, een ontbrekende waarde in `.env.local`, "Allow public access" staat uit, een keuze die niet in de documenten staat). Leg dan in gewoon Nederlands uit wat hij moet doen, waar hij moet klikken en wat hij terug moet geven. Vraag nooit om geheimen in de chat.
