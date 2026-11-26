# Tune Timeline

Online muziektijdlijn-feestspel voor 2–10 spelers. De pc aan de tv is het bord en speelt de muziek via Spotify; iedereen speelt op de eigen telefoon, zonder app of account.

- Live: https://tune-timeline.vercel.app (tv: `/tv`, meedoen: `/speel`)
- Ontwerp en voorbereiding: [`docs/`](docs/) — bron van waarheid is `docs/concept-v2/CONCEPT.md`, het uiterlijk staat in `docs/concept-v2/mockups/index.html`.

## Stand: fase 3 (afwerking en betrouwbaarheid)

Werkt:
- **Fase 1, kernspel:** lobby met QR-code en code, startkaarten (uniek jaar 1960–2015, oudste begint), beurtstart, nummer speelt, live plaatsen, vastzetten, onthulling, tussenstand, winnaar, "Nog een potje". Telefoons herverbinden; de tv bewaart het spel ("Muziek hervatten"). Nummer speelt niet → ander nummer.
- **Fase 2, tokens:** stelen (10 s, "Pas", eerste tik wint, alle uitkomsten), overslaan, kopen, titel + artiest met bezwaar, max 5 tokens, hostmenu.
- **Uitleg-scherm** na "Start": tv met 4 blokken en "Shazam = je bent af", telefoon met lijst en "Begrepen" (tv toont "klaar: 3 van 4"). De host tikt "Begrepen" (of klikt op de tv).
- **Meegokken + "Beste oor":** wie niet aan de beurt is, tikt stiekem een gat ("jouw gok", gele stippelrand) tot het vastzetten. Tv: "meegokkers: N" en bij de onthulling "Meegokkers goed: 1 van 2"; telefoon: "Jij zat goed 👂". Telt niet voor de winst.
- **Emoji-reacties** 🔥😂😱🎶 in de lobby, bij andermans beurt en in de tussenstand; max 1 per 3 s; zweven 2 s bij het bordje. De host kan ze uitzetten.
- **Animaties en geluid** (Web Audio): kaart vliegt in een boog naar het bordje van de steler, munt rolt naar/van een bordje met "+1"/"−1", "+1" stijgt op bij een goede kaart, steelfiche valt in het gat, stempel "VASTGEZET", trommelroffel 1,2 s vóór de flip, tik per seconde in de laatste 3 s, muziek 1 s fade-in en 2 s fade-out, match point met lage puls en trommelroffeltje. Er knippert maar één ding tegelijk.
- **Eindoverzicht** 8 s na de winnaar: ranglijst, 4 prijzen (Beste oor, Meesterdief, Tijdreiziger, Bijna!) en de overgeslagen nummers.
- **Lobby:** niveau, doel, plaatstijd en speelduurschatting (schaalt met spelers, doel, plaatstijd en niveau); advies "doel 8" bij 8+ spelers.
- **Randgevallen:** actieve speler offline → "Wachten op Sanne… 20", daarna overgeslagen (host kan meteen overslaan). Late instappers tot het einde van ronde 2 (1 startkaart, start-tokens, achteraan in het rondje), daarna toeschouwer (meegokken en reacties). "Ik speelde al" (lege accu): naam tikken, host bevestigt "Is dit Sanne?" op de telefoon of op de tv.
- **Tweede tv:** een tweede tv-pagina voor dezelfde kamer toont "Er is al een tv actief voor deze kamer." (met "Toch deze tv gebruiken").
- **Spotify-betrouwbaarheid:** speler na 15 s niet klaar → "Gebruik de Spotify-app op deze pc" (apparaat kiezen via Spotify Connect). Tijdens het spel: "Spotify is even weg… poging 1–3 van 3", spel pauzeert vanzelf en gaat verder als het terug is; daarna "Opnieuw verbinden" of de Spotify-app. Verlopen inlog → spel pauzeert met "Opnieuw inloggen"; alles blijft bewaard.
- **Pro en Expert** (kies in de lobby): start-tokens 5 / 3, titel + artiest verplicht, bezwaar beslist over de kaart (bij een goede steler twee rijen), stelen op de plek van de actieve speler mag, gelukte steal kost geen token. Expert: jaarwiel op de telefoon, exact jaar nodig (ook voor stelers).
- **Toegankelijkheid:** "minder beweging" (systeeminstelling) maakt van vliegen/schuiven korte fades; letter-avatar en ✓/✕ naast elke kleur.
- **Space Grotesk** (open licentie, `public/fonts/`, zelf gehost) voor koppen, jaartallen en cijfers.

Keuzes die ik zelf maakte (staan niet letterlijk in CONCEPT): late instappers krijgen de start-tokens van het gekozen niveau; in Expert mag een steler ook op de plek van de actieve speler (net als in Pro) en moet een steler ook een jaar kiezen; als een kandidaat-steler in Pro/Expert wordt afgekeurd, gaat de kaart weg (geen tweede stemronde).

Niet zelf te testen (alleen met nep-speler en browsertabbladen): echte Spotify-weergave (SDK, fade-in/-out, de terugvaloptie met de echte Spotify-app, een echt verlopen token), echte telefoons (iPhone/Android, trillen, wake lock, vergrendelen) en wifi/4G-wissels. Zie het testplan in `docs/04-prompt-claude-code.md` hoofdstuk 8.

## Lokaal starten

1. `.env.local` staat in deze map (zie `.env.example` voor de namen; nooit committen).
2. `npm install`
3. `npm run dev` → http://127.0.0.1:5173 (Spotify staat `localhost` niet toe, `127.0.0.1` wel).
   - Tv: http://127.0.0.1:5173/tv
   - Zonder Spotify en zonder internet: http://127.0.0.1:5173/tv?nep=1&net=lokaal, en open de QR-link (rechtsonder, ook in de adresbalk-variant `/speel/CODE?net=lokaal#…`) in andere tabbladen van dezelfde browser als "telefoons".

## Nummerlijst maken (eenmalig)

```bash
npm run songs
```

Opent je browser om in te loggen bij Spotify (alleen je playlists lezen), haalt de playlist uit `SPOTIFY_PLAYLIST_ID` op, zoekt bij MusicBrainz het oorspronkelijke jaar (1 verzoek per seconde) en schrijft `public/songs.json` en `data/rapport.md`. Jaartallen die je zelf controleert zet je in `data/corrections.csv` (`spotifyId;jaar;notitie;startMs`); die winnen altijd. Daarna opnieuw `npm run songs` (snel, alles staat in de cache) en committen.

## Testen

```bash
npm run build                # typecheck + productiebouw
npm test                     # spelregels, Spotify-token en jaarbepaling (Vitest, 168 tests)
npm run e2e                  # schermtests met Playwright: game, tokens, layout (10 spelers) en phase3 (nep-speler)
RUN_SUPABASE=1 npm run e2e   # ook een test via het echte Supabase Realtime-kanaal
PW_BASE=https://tune-timeline.vercel.app RUN_SUPABASE=1 npx playwright test e2e/supabase.spec.ts  # tegen de live site
```

Screenshots van de schermtests komen in `test-results/screens/` (Playwright maakt die map bij elke run leeg).

Testhulp met de nep-speler (`/tv?nep=1&net=lokaal`): in de console van de tv `__tt()` (status), `__ttSet(status)`, `__ttSpotify('weg', 3)` (Spotify valt weg, 3 mislukte pogingen) en `__ttSpotify('auth')` (inlog verlopen).

## Techniek in het kort

Vite + React + TypeScript, statisch op Vercel. Spelregels als pure functie in `src/game/` (`apply(state, event) → { state, effects }`); alleen de tv past regels toe en stuurt de telefoons een publieke status zonder spoilers. Realtime via Supabase Broadcast + Presence (geen tabellen). Spotify via Authorization Code + PKCE en de Web Playback SDK. `songs.json` wordt alleen door `/tv` opgehaald.
