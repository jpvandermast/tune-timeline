# Prompt voor Claude Code: Tune Timeline fase 3 (afwerking en betrouwbaarheid)

*Geschreven op 26 november 2026 aan het eind van de chat waarin fase 1 en 2 gebouwd zijn. Werk zelfstandig. Vraag Josse alleen iets als je echt vastzit, en leg dan in gewoon Nederlands uit wat hij moet doen. Vraag nooit om geheimen in de chat.*

## 0. Wie en wat
Josse (tweedejaars Commerciële Economie, geen ervaren programmeur) bouwt met jou **Tune Timeline**: een online feestspel voor 8–10 vrienden naar het principe van Hitster, met eigen naam en uiterlijk. De pc aan de tv is het bord en speelt muziek via Spotify (Josse heeft Premium); iedereen speelt op de eigen telefoon zonder app of account. Praat met Josse in gewoon Nederlands, zonder onnodig jargon.

- Repo: https://github.com/jpvandermast/tune-timeline (**publiek**; branch `main`, elke push rolt uit op Vercel)
- Live: https://tune-timeline.vercel.app (`/tv`, `/speel`, `/speel/CODE#kanaalgeheim`, `/callback`)
- Werkmap: `apps/tune-timeline/` (de repo-root)

## 1. Lees eerst (bron van waarheid)
1. `docs/04-prompt-claude-code.md` — de oorspronkelijke bouwopdracht: techniek, grenzen, werkwijze per fase, testplan (hoofdstuk 8). **Hoofdstuk 6 (grenzen) en 7 (werkwijze na elke fase) gelden onverkort.**
2. `docs/concept-v2/CONCEPT.md` — alle regels, schermen, teksten, tijden. Bij twijfel wint dit.
3. `docs/concept-v2/mockups/index.html` — het uiterlijk (open met `?only=tv&state=…`, `?only=phone&phone=…`, `?only=ten`); screenshots in `docs/concept-v2/screenshots/v2-*.png`.
4. `README.md` — wat er nu werkt en hoe je test.

## 2. Stand na fase 1 en 2 (af, getest, live)
- **Spelmotor** `src/game/engine.ts`: pure `apply(state, event) → { state, effects }`; fases `lobby → deal → turnStart → placing → stealing → reveal → objection → standings → … → winner`. Tokens, stelen (10 s, Pas, eerste tik wint, max 1 per beurt, alle uitkomsten), kopen (alleen beurtstart), overslaan, claim + bezwaar (helft naar boven afgerond), max 5, hostacties (pauze, beurt overslaan, uitslag/claim omdraaien, nummer opnieuw, speler verwijderen, spel stoppen), "Nog een potje". Tijden in `TIMES` (`src/game/rules.ts`), schaalbaar via `settings.tempo`.
- **Publieke status** `src/game/public.ts` (`toPublic`): nooit geheimen, stapel of gegevens van het lopende nummer vóór de onthulling. Er is een test voor.
- **Tv** `src/tv/TvApp.tsx` + `src/tv/useTvGame.ts`: podium 1920×1080 geschaald, alle schermen van fase 1–2, status in `localStorage` ("Muziek hervatten" na verversen), heartbeat elke 5 s, broadcast max 4×/s, alleen whitelisted telefoon-intenties (`PHONE_INTENTS` in `src/net/messages.ts`).
- **Telefoon** `src/phone/PhoneApp.tsx` + `src/phone/usePhone.ts`: alle schermen van fase 1–2, herverbinden bij zichtbaar worden/online/watchdog 12 s, wake lock, trillen.
- **Realtime** `src/net/channel.ts`: Supabase Broadcast + Presence (berichten wachten tot het kanaal "joined" is); `?net=lokaal` = BroadcastChannel tussen tabbladen (voor tests; telefoonsessie dan in `sessionStorage`).
- **Spotify** `src/spotify/`: PKCE (`auth.ts`), Web Playback SDK met precies één speler (`player.ts`), `FakePlayer` met `?nep=1`.
- **Geluid** `src/audio/sfx.ts` (Web Audio, geen bestanden). **Stijl** `src/ui/styles.css` (mockup-CSS + aanpassingen) en `src/ui/components.tsx`.
- **Nummerlijst** `public/songs.json`: 323 nummers, alle jaartallen nagelopen (51 correcties in `data/corrections.csv`, 0 te controleren). Script: `npm run songs` (`scripts/build-songs.ts`, beslisregel in `scripts/lib/year.ts`). **Draai het script nooit twee keer tegelijk** (MusicBrainz weigert dan verzoeken).
- **Vercel**: de drie `VITE_*`-variabelen staan goed (Production + Preview). Bij een lege waarde toont de site een duidelijke melding.

## 3. Testen (moet na fase 3 weer allemaal groen zijn)
```bash
npm run build                # typecheck + productiebouw
npm test                     # 120 Vitest-tests (regels, tokens, jaarbepaling)
npm run e2e                  # Playwright: game.spec, tokens.spec (4 spelers), layout.spec (10 spelers)
RUN_SUPABASE=1 npm run e2e   # + echte Supabase-test
PW_BASE=https://tune-timeline.vercel.app RUN_SUPABASE=1 npx playwright test e2e/supabase.spec.ts   # tegen de live site
```
- Playwright gebruikt de geïnstalleerde Chrome (`channel: 'chrome'`); geen browsers downloaden.
- In nep-modus heeft de tv debughaakjes `window.__tt()` (volledige status) en `window.__ttSet(state)` (status zetten) voor schermtests; `?snel=1` = tempo 0,25.
- Screenshots komen in `test-results/screens/`; leg ze naast de mockup.
- Let op hook-volgorde in React: componenten met hooks nooit als gewone functie aanroepen (dat ging twee keer bijna mis).

## 4. Fase 3 — wat je bouwt
Uit `docs/04-prompt-claude-code.md` hoofdstuk 7 en CONCEPT 2.8, 2.9, 3.5, 3.6, 4.2–4.5, 5.5:
1. **Animaties en geluiden** volgens CONCEPT 4.2: o.a. kaart vliegt in een boog naar het bordje van de steler, munt rolt naar/van een bordje met "+1"/"−1", "+1" stijgt op bij goed, steelfiche valt in het gat, trommelroffel vóór de flip, tik per seconde in de laatste 3 s, muziek 2 s fade-out aan het eind van een beurt. Er knippert nooit meer dan één ding tegelijk.
2. **Match point**: bestaat al als vlag; voeg het lage puls-geluid en het trommelroffeltje bij zijn beurt toe.
3. **Meegokken + prijs "Beste oor"**: andere spelers tikken stiekem een gat in de tijdlijn van de actieve speler (gele stippelrand "jouw gok"), tot het vastzetten; tv toont "meegokkers: N" en bij de onthulling "Meegokkers goed: 4 van 8"; telefoon "Jij zat goed 👂". Telt niet voor de winst.
4. **Emoji-reacties** 🔥😂😱🎶 op de telefoon (wachten, andermans beurt, tussenstand), max 1 per 3 s per speler, zweven 2 s naast het bordje op de tv. Host kan ze uitzetten.
5. **Uitleg-scherm** (tv: 4 blokken, telefoon: lijst + "Begrepen"; host tikt "Begrepen"), met "Shazam = je bent af".
6. **Eindoverzicht**: ranglijst en alle 4 prijzen (Beste oor, Meesterdief, Tijdreiziger, Bijna!).
7. **Speelduurschatting** in de lobby en advies doel 8 bij 8+ spelers (bestaat deels; controleer tegen CONCEPT 3.4).
8. **Randgevallen** (CONCEPT 2.9): actieve speler offline bij beurtstart → "Wachten op Sanne… 20" en daarna overslaan; **late instappers** tot einde ronde 2 (1 startkaart, 2 tokens, achteraan); daarna toeschouwer; **"Ik speelde al"** (lege accu: naam tikken, host bevestigt "Is dit Sanne?").
9. **Tweede tv**: een tweede tv-pagina voor dezelfde kamer ziet de heartbeat en toont "Er is al een tv actief voor deze kamer."
10. **Spotify-betrouwbaarheid**: na 15 s geen "ready" → terugvaloptie "Gebruik de Spotify-app op deze pc" (apparaten via `GET /me/player/devices`, die app aansturen); foutscherm "Spotify is even weg… (3)" met 3 pogingen; token vernieuwen werkt al (`getToken` ververst als het < 15 min geldig is) — test dat het spel bij een verlopen token netjes pauzeert.
11. **Pro en Expert** (CONCEPT 2.8): niveau kiezen in de lobby; start-tokens 5/3; claim verplicht; Pro: steler mag ook op de plek van de actieve speler; Expert: jaarwiel op de telefoon, exact jaar; bezwaar voor actieve speler én winnende steler.
12. **Toegankelijkheid**: "minder beweging" (prefers-reduced-motion → korte fades; staat deels in CSS), letter-avatar + ✓/✕ naast kleuren.
13. **Space Grotesk** meeleveren in `public/fonts/` (open licentie, zelf hosten; geen Google Fonts-link) voor koppen, jaartallen en cijfers.

**Klaar als:** alle toestanden uit de mockup bestaan en er nauwkeurig op lijken; alle tests groen (nieuwe regeltests voor meegokken, late instappers, offline-wachttijd, "Ik speelde al", Pro/Expert); het testplan van `docs/04-prompt-claude-code.md` hoofdstuk 8 doorgelopen voor zover zonder echte mensen mogelijk.

## 5. Grenzen (kort; volledig in 04-prompt hoofdstuk 6)
- Supabase **alleen** Realtime Broadcast/Presence; niets anders in dat project aanraken.
- Geen geheimen in de repo of chat; `.env.local` en `.env.backup.local` nooit committen. De repo is publiek.
- Nooit force-pushen. Interface volledig Nederlands. Nergens het woord "Hitster", geen albumhoezen, geluiden alleen via Web Audio.
- Lokaal: `npm run dev` → http://127.0.0.1:5173 (niet `localhost`).

## 6. Na fase 3
Volg de werkwijze uit 04-prompt hoofdstuk 7: build, tests en Playwright groen; schermen bekijken op 1920×1080 en 390×844 naast de mockup; commit met Nederlandse boodschap en push; README bijwerken; Josse in gewoon Nederlands vertellen wat werkt, wat niet, wat je niet kon testen en zijn testlijst (testplan hoofdstuk 8); daarna stoppen en wachten. Fase 4 (uitbreidingen) alleen als Josse erom vraagt.
