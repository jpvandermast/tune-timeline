# Tune Timeline

Online muziektijdlijn-feestspel voor 2–10 spelers. De pc aan de tv is het bord en speelt de muziek via Spotify; iedereen speelt op de eigen telefoon, zonder app of account.

- Live: https://tune-timeline.vercel.app (tv: `/tv`, meedoen: `/speel`)
- Ontwerp en voorbereiding: [`docs/`](docs/) — bron van waarheid is `docs/concept-v2/CONCEPT.md`, het uiterlijk staat in `docs/concept-v2/mockups/index.html`.

## Stand: fase 2 (tokens)

Werkt:
- **Fase 1, kernspel:** lobby met QR-code en code, startkaarten (uniek jaar 1960–2015, oudste begint), beurtstart, nummer speelt, live plaatsen, vastzetten, onthulling, tussenstand, winnaar, "Nog een potje". Telefoons herverbinden; de tv bewaart het spel ("Muziek hervatten"). Nummer speelt niet → ander nummer.
- **Tokens (2 bij de start, max 5)** op de bordjes en op de telefoon; tik op je naam bovenaan voor uitleg.
- **Stelen:** na het vastzetten 10 s steelvenster. Telefoon toont meteen de tijdlijn: tik een vrij gat en "STEEL hier · 1 token", of "Pas". Steelfiches verschijnen live op de tv. Alle uitkomsten: actieve speler goed (stelers token kwijt), steler goed (kaart naar zijn tijdlijn), twee goede stelers (eerste wint, ander token terug), niemand goed. Venster sluit eerder als iedereen gestolen of gepast heeft; "Net bezet door …" en "Te laat…".
- **Overslaan** (1 token, nieuw nummer, timer opnieuw) en **kopen** (3 tokens, alleen bij de beurtstart, daarna speel je gewoon).
- **Titel + artiest:** schuifje "Ik noem titel + artiest", daarna 6 s bezwaar. Goed tenzij minstens de helft van de anderen "Fout!" tikt; goed = +1 token, ook bij een foute plaatsing (max 5).
- **Hostmenu** (⚙︎ op de telefoon van de host): pauze, beurt overslaan, uitslag omdraaien, titel + artiest omdraaien, nummer opnieuw starten, speler verwijderen, spel stoppen.
- Prijs "Meesterdief" (meeste steals) bij de winnaar.

Nog niet (fase 3): animaties zoals de kaart die naar de steler vliegt, meegokken + "Beste oor", emoji-reacties, uitleg-scherm, speelduur per instelling, late instappers, "Ik speelde al", offline-wachttijd van 20 s, tweede-tv-melding, terugvaloptie Spotify-app, Pro/Expert, Space Grotesk.

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
npm run e2e                  # schermtests met Playwright (1 tv + 3 of 4 telefoons, nep-speler)
RUN_SUPABASE=1 npm run e2e   # ook een test via het echte Supabase Realtime-kanaal
PW_BASE=https://tune-timeline.vercel.app RUN_SUPABASE=1 npx playwright test e2e/supabase.spec.ts  # tegen de live site
```

Screenshots van de schermtests komen in `test-results/screens/`.

## Techniek in het kort

Vite + React + TypeScript, statisch op Vercel. Spelregels als pure functie in `src/game/` (`apply(state, event) → { state, effects }`); alleen de tv past regels toe en stuurt de telefoons een publieke status zonder spoilers. Realtime via Supabase Broadcast + Presence (geen tabellen). Spotify via Authorization Code + PKCE en de Web Playback SDK. `songs.json` wordt alleen door `/tv` opgehaald.
