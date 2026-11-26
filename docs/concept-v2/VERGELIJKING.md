# Vergelijking: concept Opus en concept Antigravity

*24 november 2026. Beide concepten zijn gelezen en naast de opdracht (`00-gedeelde-opdracht.md`) gelegd. De mockups zijn geopend op 1920×1080 (tv) en 390×844 (telefoon); de screenshots staan in `screenshots/` (namen beginnen met `vergelijking-`).*

## 0. Volledigheid

| Eis uit de opdracht | Opus | Antigravity |
|---|---|---|
| 11 hoofdstukken in de juiste volgorde | ja | ja |
| Samenvatting in max 12 regels | ja (12 genummerde regels) | **nee**: één lange alinea van ±11 zinnen, die op een gewoon scherm ruim over 12 regels loopt |
| Per regel: echt spel of online aanpassing | ja, met labels ECHT / ONLINE / KEUZE | ja, met labels Echt spel / Online aanpassing |
| Alle tv- en telefoonschermen beschreven | ja, plus pauze en verbinding kwijt | ja; pauze en "bevestigen" als apart scherm ontbreken, maar zitten in andere schermen |
| Mockup: één zelfstandige HTML-pagina, geen internet nodig | ja (57 kB) | ja (110 kB) |
| Mockup: tv en telefoon naast elkaar, voorbeeldbeurt doorklikbaar | ja, 11 toestanden + telefoonkeuze | ja, 10 toestanden |
| Mockup: tv met 10 spelers | ja (aparte weergave, luisterfase) | ja (steelvenster met 10 spelers + 2×5-tussenstand) |
| Bronnen met link | ja, 49 genummerde bronnen, per feit verwezen | ja, ±25 bronnen, maar per feit minder precies |
| Eerlijk over wat niet gevonden is | ja, apart lijstje | nauwelijks; enkele dingen worden als "bevestigd" gebracht die niet in de bron staan (zie feitencontrole) |

Conclusie: **beide mappen zijn compleet**; niets ontbreekt dat de vergelijking in de weg zit.

## 1. Per hoofdstuk

### 1. Samenvatting
- **Gelijk:** zelfde basis (tv = bord + muziek, telefoon = controller, 10 kaarten, tokens, `songs.json`, Supabase alleen Broadcast/Presence).
- **Verschil:** Opus houdt zich aan max 12 regels en noemt de grootste risico's (Spotify-regels, grillige SDK). Antigravity schrijft één lap tekst.
- **Beter:** Opus. **Overgenomen:** de opbouw van Opus.

### 2. Spelregels
- **Gelijk:** 2 tokens start, max 5, stelen pas ná vastzetten, de plek van de actieve speler is niet stelbaar in Original, eerste tik wint de plek, twee goede stelers door zelfde jaar → eerste wint en de tweede krijgt zijn token terug, overslaan mag vaker per beurt, verdienen ook bij foute plaatsing, startkaart telt mee.
- **Verschillen en keuze:**

| Onderwerp | Opus | Antigravity | Gekozen | Waarom |
|---|---|---|---|---|
| Steelvenster | 10 s, verlengt naar 4 s bij late claim (max 20 s) | 8 s, sluit eerder als iedereen "Pas" tikt | **10 s vast, sluit eerder als iedereen met tokens gestolen of gepast heeft** | 8 s is krap als je eerst je telefoon moet pakken; de verlengregel van Opus is lastig uit te leggen. De "Pas"-knop van Antigravity houdt het tempo erin. |
| Kopen (3 tokens) | alleen bij beurtstart, **daarmee is je beurt voorbij** | alleen bij beurtstart, **daarna speel je je beurt gewoon** | **Antigravity** | De Nederlandse regels zeggen dat je kunt kopen zonder op je beurt te wachten en noemen geen beurtverlies (bron hieronder). Beurtverlies komt uit de Amerikaanse regels. |
| Titel + artiest beoordelen | bezwaarsysteem: goed tenzij de helft van de anderen "Fout!" tikt (6 s) | volgende speler is scheidsrechter (1 tik), host kan overrulen | **Opus (bezwaar)** | Het echte spel laat de groep beslissen. Eén scheidsrechter die net weg is of het nummer niet kent, is een zwakke schakel. Bij het bezwaarsysteem hoeft meestal niemand te tikken. Staat als smaakkeuze in `BESLISSINGEN.md`. |
| Plaatstimer | 60 s | 45 s + 10 s extra als je niets koos | **45 s, zonder extra tijd** | Met 10 spelers is wachten het grootste probleem. De extra 10 s van Antigravity maakt de regel ingewikkelder. |
| Beurtstart | 4 s, start vanzelf | knop "Start nummer", start vanzelf na 8 s | **knop "Start nummer" + vanzelf na 6 s** | Een knop geeft de speler controle; 6 s is genoeg om te kopen. |
| Beurtvolgorde | volgorde van binnenkomst, host kan slepen | gelote volgorde | **Opus** | Lijkt op "met de klok mee": mensen scannen meestal in de volgorde waarin ze zitten. |
| Startkaarten | geen dubbele startjaren, alles tussen 1960 en 2015 | willekeurig | **Opus** | Eerlijker, kost niets extra. |
| Stapel op | meeste kaarten wint | afgelegde kaarten opnieuw schudden | **Antigravity** | Met ±300 nummers raakt de stapel zelden op; schudden laat het spel gewoon doorgaan zonder nieuwe winregel. |
| Max steals per speler per beurt | 1 | niet geregeld | **Opus (1)** | Voorkomt dat iemand met 5 tokens alle gaten dichtzet. |
| Pro: steel op de plek van de actieve speler | niet geregeld | mag, omdat de actieve speler op titel/artiest kan verliezen | **Antigravity** | Logisch gevolg van de Pro-regel; Opus vergat dit randgeval. |
| Gelijktijdig 10 kaarten | kan niet (1 kaart per beurt) | kan niet, plus tiebreaker voor een optionele huisregel | **Opus** | De tiebreaker hoort bij een regel die we niet gebruiken. |
| Late instappers | tot einde ronde 2 | toeschouwer | **Opus** | Op een feest komt altijd iemand later. |
| Teams | duo's als instelling, 2 telefoons | 1 telefoon delen, echte teams later | **later (uitbreiding)** | Teams raken bijna elk scherm; eerst het kernspel. |

- **Beter in dit hoofdstuk:** Opus is preciezer en vollediger (tijden, randgevallen). Antigravity heeft twee betere regels (kopen, Pro-steal) en de "Pas"-knop.

### 3. Spelbeleving
- **Gelijk:** zelfde verloop, meegokken, emoji-reacties, matchpoint-spanning, prijzen aan het eind, "Nog een potje".
- **Verschil:** Opus geeft een minuut-tot-minuut-tabel en een eerlijke speelduurschatting (10 spelers, doel 10: ±1 u 55). Antigravity schat 65–80 minuten. Dat kan niet kloppen: de winnaar moet 9 kaarten winnen; bij 60–70% trefkans zijn daar ±13 eigen beurten voor nodig, dus ±130 beurten van ±55 s = ±2 uur. Antigravity rekent met ±8 rondes, dus met bijna elke beurt raak.
- **Beter:** Opus. **Overgenomen:** de opbouw en de duurtabel van Opus (aangepast aan 45 s), de awards uit beide.

### 4. Uiterlijk en gevoel
- **Gelijk:** donker thema, amber voor "aan de beurt", decenniumkleuren, 3D-flip van ±700 ms, geluiden met Web Audio, letters/symbolen naast kleuren voor kleurenblinden.
- **Verschil:** Opus "nachtradio" met **crèmekleurige kaarten** (donkere letters op licht papier). Antigravity "Midnight Vinyl" met **donkere kaarten** en lichte letters.
- **Mockup-oordeel (zie screenshots):**

| Criterium | Opus | Antigravity |
|---|---|---|
| Leesbaarheid op 3 m | **beter**: jaartallen 68 px op crème, namen 26 px, kaartenaantal 38 px | namen 20 px en artiest/titel 12–14 px op de tv: te klein op 3 m; veel lege ruimte bij 4 spelers |
| Overzicht bij 10 spelers | goed: bordjes van 184 px, grote getallen | goed in de bovenbalk; de **2×5-tussenstand met mini-jaartallen** is sterker dan de balkjes van Opus |
| Kaartontwerp | herkenbaar "concertkaartje" met inkepingen, decenniumband | strak, maar donkere kaart op donkere achtergrond valt minder op |
| Animatie | pulserende raadselkaart, flip, confetti | flip, vinylplaat, confetti; vergelijkbaar |
| Telefoonbediening | grote knoppen onderaan, gaten 48 px, steelflow in 3 tikken (knop → gat → bevestigen) | steelflow in **2 tikken** (tijdlijn staat direct open → gat → STEEL), "Pas"-knop, gaten met tekst "Tussen 1984 en 1996" |
| Fouten in de mockup | de grote steelknop heet "HITSTER!" (merknaam) | knop "Koop 1 gratis kaart (3 tokens)" (tegenstrijdig), lobby-URL "tunetimeline.nl" past niet bij Vercel |

- **Gekozen:** de stijl en kaarten van **Opus**, met van **Antigravity**: de 2-tikken-steelflow met "Pas", gat-labels met jaartallen, de 2×5-tussenstand met mini-jaartallen. **Weggelaten:** het woord "HITSTER" in de interface (merknaam; de opdracht verbiedt het merk). De knop heet nu "STEEL".

### 5. Interactiedetails
- **Gelijk:** verticale tijdlijn op de telefoon, tikken in plaats van slepen, eerst plek tikken en dan Vastzetten, knoppen direct grijs na een tik, berichtnummers tegen dubbele berichten, "te laat" kost niets, trillen werkt niet op iPhone dus altijd ook beeld.
- **Verschil:** Opus heeft een "Oeps, terug"-knop van 1,5 s na Vastzetten. Antigravity niet.
- **Gekozen:** zonder "Oeps". Het voegt een extra wachttijd en een extra toestand toe, en Vastzetten vraagt al een aparte tik na het kiezen van een plek. Steelflow van Antigravity (zie 4).

### 6. Muziek en data
- **Gelijk:** playlist eerst kopiëren naar een eigen playlist (sinds februari 2026 kun je de nummers van andermans playlist niet meer ophalen), PKCE, Web Playback SDK, autoplay-klik, Spotify + MusicBrainz + correctielijst → `songs.json`, `market=NL` + `is_playable`, tijdens het spel automatisch een ander nummer als er niets speelt.
- **Verschil:** Opus heeft een **terugvaloptie** (de Spotify-app op de pc aansturen als de SDK niet wil), waarschuwt dat de **Spotify-app op de telefoon van de host** kan laten zien wat er speelt, en beschrijft de bekende SDK-fout ("één speler per pagina"). Antigravity noemt `activateElement()` en de redirect-regel `127.0.0.1` (geen `localhost`); beide kloppen.
- **Gekozen:** de aanpak van Opus, aangevuld met `activateElement()` en de redirect-regel van Antigravity. Bestandsnamen: `corrections.csv` (Opus) i.p.v. `overrides.json`, omdat een CSV makkelijker in een spreadsheet te bewerken is.

### 7. Techniek
- **Gelijk:** Vite + React + TypeScript, statische site op Vercel, host is de baas, telefoons sturen alleen intenties, geen spoilers, status in `localStorage` van de tv, spelers-ID + geheim op de telefoon.
- **Verschil:** Opus gebruikt een kanaalnaam met een extra geheim deel (`tt:KWPX:<6 tekens>`) en een spelersgeheim per bericht. Antigravity `tt:room:KICK` zonder geheim, en laadt `songs.json` expliciet alleen op de tv-pagina.
- **Gekozen:** beide samen: geheime kanaalnaam + spelersgeheim (Opus), `songs.json` niet in de telefooncode (Antigravity).

### 8. Risico's
- Opus noemt als enige het **grootste risico**: de Spotify-ontwikkelaarsregels verbieden spellen. Antigravity noemt dit niet. Verder grotendeels gelijk. **Gekozen:** de lijst van Opus, aangevuld met "laptop in slaapstand" (Antigravity).

### 9. Keuzes
- Beide beantwoorden de open vragen. Samengevoegd in het nieuwe hoofdstuk 9; smaakkeuzes staan apart in `BESLISSINGEN.md`.

### 10. Uitbreidingen
- Vrijwel gelijk. Antigravity voegt toe: **niveau per speler** (de muziekkenner op Expert, de rest op Original; dit staat ook in de Scandinavische regels) en een snelle refreinmodus. Overgenomen.

### 11. Bronnen
- Opus: meer, preciezer en per feit gekoppeld. Antigravity: minder bronnen, soms een claim die er niet in staat.

## 2. Feitencontrole

Gecontroleerd op 24 november 2026 door de pagina's zelf te openen.

| Bewering | Wie | Uitkomst | Bron |
|---|---|---|---|
| Original start met 2 tokens, max 5; Pro 5, Expert 3, Coöp 5 + 1 kaart | beide | **Klopt** (NL-regels) | hitstergame.com/nl-nl/pages/spelregels-original |
| Scandinavië start met 3 tokens | beide | **Klopt** | nordics.hitstergame.com/sv-en/how-to-play/ |
| Kopen kan altijd; je hoeft niet op je beurt te wachten | beide | **Klopt** (NL). Of je een beurt verliest staat er **niet** in. | NL-regelpagina |
| Na kopen sla je je volgende beurt over | Opus (als VS-regel) | Komt uit de VS-regels, **niet** uit de NL-regels | hitstergame.com/en-us (Opus-bron S5) |
| Token verdienen ook bij foute plaatsing | beide | **Klopt** (NL: "De token is van jou, ook als je de kaart niet correct op je tijdlijn legt") | NL-regelpagina |
| Wie het eerst roept mag eerst; twee tokens nooit op dezelfde plek | beide | **Klopt** | NL-regelpagina |
| Steelt iemand op een andere plek die ook goed is (zelfde jaar) terwijl de actieve speler goed zat, dan houdt de actieve speler de kaart en is de steler zijn token kwijt | – | **Klopt**, staat in NL-regels; nu expliciet opgenomen | NL-regelpagina |
| Startkaart telt mee voor de 10 | Antigravity: "bevestigd" | **Niet bevestigd.** Noch de NL- noch de Scandinavische pagina zegt het. Blijft een eigen keuze (Opus zei dit eerlijk). | NL- en Nordics-regelpagina |
| Bij gelijktijdige claim: wie de minste kaarten heeft gaat voor | Antigravity (als Nordics-optie) | **Klopt** voor Scandinavië (daarna minste tokens). NL: wie eerst roept. We volgen NL. | Nordics-regelpagina |
| Pro/Expert: gelukte steal = token houden | beide | **Klopt** (Nordics) | Nordics-regelpagina |
| Development Mode: Premium nodig, max 5 gebruikers per Client ID, 11 feb (nieuw) / 9 mrt 2026 (bestaand) | beide | **Klopt** | developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security |
| Max 25 apps per account sinds juli 2026, quota per account | Antigravity | **Klopt** | developer.spotify.com/documentation/web-api/references/changes/july-2026 |
| `/playlists/{id}/tracks` vervangen door `/items`; alleen eigen playlists geven nummers | beide | **Klopt** ("Only the user's own playlist returns an items object") | .../references/changes/february-2026 |
| `available_markets` weg; `external_ids` (ISRC) teruggezet in maart 2026 | beide | **Klopt**. De pagina zegt "external_ids … will continue to be available"; dat daar de ISRC in zit is algemeen bekend uit de API-referentie. | .../changes/february-2026 en march-2026 |
| Afspeel-endpoints (start, transfer) blijven beschikbaar | – | **Klopt** (staan onder "still available") | .../changes/february-2026 |
| `localhost` niet toegestaan als redirect; `http://127.0.0.1:POORT` wel; anders HTTPS | Antigravity | **Klopt** | developer.spotify.com/documentation/web-api/concepts/redirect_uri |
| Web Playback SDK vereist Premium | beide | **Klopt** | developer.spotify.com/documentation/web-playback-sdk |
| SDK vereist scope `streaming` | – | **Klopt**; afspelen starten vraagt `user-modify-playback-state` | developer.spotify.com/documentation/web-api/concepts/scopes |
| De Spotify Developer Policy verbiedt spellen ("Do not create a game, including trivia quizzes") en vraagt hoes + metadata tijdens afspelen | Opus | **Klopt**. Belangrijkste risico, staat in `BESLISSINGEN.md` | developer.spotify.com/policy |
| SDK wordt niet "ready" in Development Mode (2026) | Opus | **Deels.** In het GitHub-issue bleek de oorzaak meerdere spelers per pagina, uitdrukkelijk "geen Development Mode-probleem". Bouwregel blijft: precies één speler per pagina. | github.com/laurentChin/blind-test/issues/78 |
| Supabase Free: 200 verbindingen, 100 berichten/s, 256 kB per broadcast | beide | **Klopt** | supabase.com/docs/guides/realtime/limits |
| Presence: 20 berichten/s **en** max 5 Presence-aanroepen per client per 30 s | Opus noemde 20/s, Antigravity 5/30 s | **Beide kloppen**, het zijn twee verschillende limieten. Gevolg: Presence alleen bij binnenkomst gebruiken, niet bij elke actie. | Realtime Limits (bijgewerkt 29 okt 2026) |
| Een broadcast naar N ontvangers telt als N + 1 berichten; Free = 2 miljoen | beide | **Klopt** | supabase.com/docs/guides/platform/manage-your-usage/realtime-messages |
| Berichten per avond | Opus 100–200 duizend, Antigravity ±10 500 | Eigen schatting: ±40 statusberichten per beurt × 12 = ±500 per beurt; 130 beurten ≈ **65 000–120 000**. Antigravity rekent te laag, maar beide blijven ver onder 2 miljoen. | eigen berekening |
| Free-projecten pauzeren na 7 dagen weinig activiteit | beide | **Klopt**; of Realtime-verkeer als activiteit telt, zegt de pagina niet | supabase.com/docs/guides/platform/pausing |
| Supabase **anon key** gebruiken | beide (opdracht ook) | **Verouderd.** Supabase vervangt de anon key door de **publishable key** (`sb_publishable_…`); de oude sleutels verdwijnen eind 2026. Het nieuwe concept gebruikt de publishable key (dezelfde lage rechten). | supabase.com/docs/guides/api/api-keys |
| Realtime-instelling "Allow public access" | – | Bestaat; staat hij uit, dan werken alleen privékanalen. Moet **aan** staan voor dit spel (controle in `VOORBEREIDING.md`). | supabase.com/docs/guides/realtime/authorization |
| `navigator.vibrate` werkt niet op iPhone | beide | **Klopt** (ook iOS 27 niet) | caniuse.com/vibration |
| Screen Wake Lock vanaf iOS 16.4 | beide | **Klopt** | caniuse.com/wake-lock |
| MusicBrainz: ±1 verzoek per seconde, User-Agent verplicht, ISRC-lookup `/ws/2/isrc/<isrc>` | beide | **Klopt** | musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting en /doc/MusicBrainz_API |
| Jaartal = eerste publieke uitgave van die opname, niet de remaster | beide | **Klopt** | Nordics-regelpagina |

## 3. Samengevat oordeel
Opus is het sterkere basisdocument: completer, eerlijker over bronnen, betere leesbaarheid op de tv en realistischer over speelduur en risico's. Antigravity levert een paar duidelijk betere onderdelen: de koopregel volgens de Nederlandse regels, de 2-tikken-steelflow met "Pas", de 2×5-tussenstand, de Pro-steal op de eigen plek, de redirect-regel en `activateElement()`. Het samengevoegde concept staat in `CONCEPT.md`; hoofdstuk 12 daarvan zegt per onderdeel waar het vandaan komt.
