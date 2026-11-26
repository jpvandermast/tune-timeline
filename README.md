# Tune Timeline

Online muziektijdlijn-feestspel voor 2–10 spelers. De pc aan de tv is het bord en speelt de muziek via Spotify; iedereen speelt op de eigen telefoon, zonder app of account.

- Live: https://tune-timeline.vercel.app (tv: `/tv`, meedoen: `/speel`)
- Ontwerp en voorbereiding: [`docs/`](docs/) — bron van waarheid is `docs/concept-v2/CONCEPT.md`, het uiterlijk staat in `docs/concept-v2/mockups/index.html`.

## Stand: fase 1 (kernspel zonder tokens)

Werkt:
- Tv: Spotify verbinden, "Klik om te beginnen", lobby met QR-code, kamercode en 10 stoelen, startkaarten (uniek jaar 1960–2015, oudste begint), beurtstart, nummer speelt, live meekijken met plaatsen, vastzetten, onthulling goed/mis, tussenstand na elke ronde, winnaar met prijzen, "Nog een potje".
- Telefoon: meedoen via QR of 4-letterige code, naam en kleur, wachten (host kiest doel en plaatstijd en start), jouw beurt, plaatsen in een verticale tijdlijn, vastgezet, resultaat, andermans beurt, tussenstand, winnaar.
- Herverbinden van telefoons (scherm uit/aan, wifi ↔ 4G, herladen); de tv bewaart het spel en gaat na verversen verder met één klik "Muziek hervatten".
- Nummer speelt na 6 s niet → automatisch een ander nummer, niemand verliest iets.
- Nep-speler zonder muziek voor testen: `/tv?nep=1`.

Nog niet (fase 2 en 3): tokens gebruiken (overslaan, stelen, kopen, verdienen), titel + artiest claimen en bezwaar, hostmenu, meegokken, emoji-reacties, uitleg-scherm, late instappers, "Ik speelde al", offline-wachttijd van 20 s, tweede-tv-melding, terugvaloptie Spotify-app, Pro/Expert, Space Grotesk.

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
npm test                     # spelregels en jaarbepaling (Vitest)
npm run e2e                  # schermtests met Playwright (1 tv + 3 telefoons, nep-speler)
RUN_SUPABASE=1 npm run e2e   # ook een test via het echte Supabase Realtime-kanaal
```

Screenshots van de schermtests komen in `test-results/screens/`.

## Techniek in het kort

Vite + React + TypeScript, statisch op Vercel. Spelregels als pure functie in `src/game/` (`apply(state, event) → { state, effects }`); alleen de tv past regels toe en stuurt de telefoons een publieke status zonder spoilers. Realtime via Supabase Broadcast + Presence (geen tabellen). Spotify via Authorization Code + PKCE en de Web Playback SDK. `songs.json` wordt alleen door `/tv` opgehaald.
