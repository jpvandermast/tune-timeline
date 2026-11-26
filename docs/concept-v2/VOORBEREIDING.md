# Voorbereiding: wat Josse zelf instelt vóór de bouw

Werk deze lijst van boven naar beneden af. Het kost ±45 minuten, plus ±1 uur voor het nalopen van jaartallen na de eerste bouwfase. Onderaan staat **"Mijn antwoorden"**: vul dat in, Claude Code leest het.

> **Nooit in de chat of in de repo plakken:** wachtwoorden, een Spotify *Client Secret* (hebben we niet nodig) of een Supabase *secret key* (`sb_secret_…`, hebben we ook niet nodig). De sleutels die we wél gebruiken zet je alleen in `.env.local` en in Vercel.

*Schermnamen gecontroleerd op 24 november 2026. Heet een knop net anders, zoek dan het woord dat er het meest op lijkt.*

---

### 1. GitHub-repo `tune-timeline` (privé)
1. Ga naar https://github.com/new.
2. **Repository name:** `tune-timeline`. Kies **Private**.
3. Vink **"Add a README file" aan** (Vercel kan geen volledig lege repo importeren; Claude Code voegt zijn code later netjes samen met deze README).
4. Geen `.gitignore` en geen licentie kiezen. Klik **Create repository**.
5. **Teruggeven:** de link van de repo, bijvoorbeeld `https://github.com/<jouwnaam>/tune-timeline` → bij "Mijn antwoorden".

### 2. Vercel-project `tune-timeline`
1. Ga naar https://vercel.com/new en log in met GitHub.
2. Bij **Import Git Repository** kies je `tune-timeline` (zie je hem niet: klik "Adjust GitHub App Permissions" en geef Vercel toegang tot deze repo).
3. **Project Name:** `tune-timeline`. **Framework Preset:** kies **Vite** (staat er "Other", zet hem handmatig op Vite). Build Command `npm run build`, Output Directory `dist` (standaard bij Vite).
4. Klap **Environment Variables** open en voeg deze drie toe (waarden haal je in stap 3 en 4; je kunt dit ook later doen via *Project → Settings → Environment Variables*):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SPOTIFY_CLIENT_ID`
   Laat bij elk "Production" en "Preview" aangevinkt.
5. Klik **Deploy**. Mislukt deze eerste uitrol omdat er nog geen code is: niet erg. Elke push van Claude Code rolt daarna vanzelf uit.
6. Ga naar *Project → Settings → Domains* en noteer het adres. Meestal `https://tune-timeline.vercel.app`; is die naam bezet, dan krijg je iets als `https://tune-timeline-abc123.vercel.app`.
7. **Teruggeven:** het Vercel-adres → bij "Mijn antwoorden".

### 3. Supabase: adres en publieke sleutel van je bestaande project
Je gebruikt je bestaande project (studiewebsite). Er komt **niets** bij: geen tabellen, geen opslag.
1. Ga naar https://supabase.com/dashboard en open je project.
2. **Project URL:** klik bovenin op **Connect**, of ga naar *Project Settings → Data API*. Kopieer de URL (`https://<iets>.supabase.co`).
3. **Publishable key:** ga naar *Project Settings → API Keys*. Kopieer de **Publishable key** (begint met `sb_publishable_`). Zie je alleen "anon" en "service_role" en een knop **Create new API keys**: klik die knop (veilig, je oude sleutels blijven werken) en kopieer dan de publishable key. *Gebruik nooit de secret key of service_role.*
   - Waarom niet de anon key: Supabase vervangt die door de publishable key en de oude sleutels verdwijnen eind 2026. Ze hebben dezelfde (lage) rechten.
4. **Realtime publiek toestaan:** ga naar *Realtime → Settings* (of *Project Settings → Realtime*). Controleer dat **"Allow public access"** **aan** staat. Staat hij uit en wil je hem niet aanzetten (omdat je studiewebsite privékanalen gebruikt), zeg dat dan tegen Claude Code; dan is een andere opzet nodig.
5. Zet de URL en de publishable key in Vercel (stap 2.4) en in `.env.local` (stap 6). Niet in de chat.

### 4. Spotify Developer-app
1. Ga naar https://developer.spotify.com/dashboard en log in met **je eigen Spotify Premium-account** (Development Mode vereist Premium).
2. Klik **Create app**.
   - **App name:** `Tune Timeline` · **App description:** `Privé feestspel`.
   - **Redirect URIs** (elk apart toevoegen met **Add**):
     - `http://127.0.0.1:5173/callback` (de site lokaal; Spotify staat `localhost` niet toe, `127.0.0.1` wel)
     - `http://127.0.0.1:8888/callback` (het voorbereidingsscript)
     - `https://<jouw-vercel-adres>/callback` (uit stap 2.6, bijvoorbeeld `https://tune-timeline.vercel.app/callback`)
   - **Which API/SDKs are you planning to use?** vink **Web API** en **Web Playback SDK** aan.
   - Vink de Developer Terms aan en klik **Save**.
3. Open de app → **Settings → User Management** (soms "Users and Access"). Voeg **jezelf** toe: je naam en het e-mailadres van je Spotify-account. (Max 5 gebruikers; alleen de host logt in, gasten niet.)
4. Kopieer bij **Basic Information** de **Client ID**. Die is niet geheim. **Klik níet op "View client secret"**; die hebben we niet nodig.
5. **Teruggeven:** de Client ID → bij "Mijn antwoorden", in Vercel (`VITE_SPOTIFY_CLIENT_ID`) en in `.env.local`.
6. De rechten (scopes) die de app vraagt bij het inloggen, zodat je niet schrikt: `streaming`, `user-read-email`, `user-read-private`, `user-read-playback-state`, `user-modify-playback-state`, `playlist-read-private`, `playlist-read-collaborative`.

### 5. De playlist met nummers
1. Open de **Spotify-app op je computer**.
2. Zoek de officiële Hitster-playlist van de editie die je wilt (zie `BESLISSINGEN.md` B15; de Hitster-site linkt naar de playlists op https://hitstergame.com/en-us/faq-v3/).
3. Maak er een **eigen kopie** van (sinds februari 2026 kan de API alleen de nummers van je eigen playlists lezen): klik in de lijst op één nummer, druk **Ctrl+A** (Windows) of **Cmd+A** (Mac), rechtsklik → **Toevoegen aan playlist** → **Nieuwe playlist**. Noem hem **"Tune Timeline – bron"**.
4. **Playlist-ID:** rechtsklik op je nieuwe playlist → **Delen** → **Link naar playlist kopiëren**. Je krijgt `https://open.spotify.com/playlist/37i9dQZF1DX…?si=…`. Het ID is het stuk tussen `/playlist/` en `?`.
5. **Afspeelbaar in Nederland controleren:** scrol door je kopie. Grijze nummers spelen niet af; rechtsklik → verwijderen uit de playlist. Het voorbereidingsscript controleert het daarna ook automatisch (`is_playable` met markt NL) en maakt een rapport.
6. **Teruggeven:** het playlist-ID → bij "Mijn antwoorden" en in `.env.local`.

### 6. Het bestand `.env.local` maken (op je Mac)
1. Open de map `apps/tune-timeline/` in Finder.
2. Maak met een teksteditor (bijv. TextEdit in "Platte tekst"-modus, of VS Code) een bestand met de naam **`.env.local`** (met de punt vooraan) direct in `apps/tune-timeline/`. Laat het daar staan; Claude Code verplaatst het niet en zet het in `.gitignore`.
3. Inhoud (vul je eigen waarden in, zonder aanhalingstekens):
   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxx
   VITE_SPOTIFY_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   SPOTIFY_PLAYLIST_ID=37i9dQZF1DXxxxxxxxxxxx
   MUSICBRAINZ_CONTACT=jouw-email@voorbeeld.nl
   ```
   `MUSICBRAINZ_CONTACT` is verplicht bij MusicBrainz (ze willen weten wie de verzoeken doet); het blijft alleen op je Mac.
4. Finder verbergt bestanden die met een punt beginnen; toon ze met **Cmd+Shift+.**.

### 7. GitHub-inlog op je Mac (zodat Claude Code kan pushen)
1. Open Terminal en typ `gh auth status`.
   - Staat er "Logged in to github.com": klaar.
   - "command not found": typ `brew install gh` en daarna `gh auth login`.
   - Niet ingelogd: typ `gh auth login`, kies **GitHub.com → HTTPS → Login with a web browser** en volg de stappen.
2. Lukt het niet, geen probleem: Claude Code legt het dan stap voor stap uit.

### 8. Testspullen voor later
- De tv-pc met **Chrome of Edge**, energie-instelling op "nooit slapen".
- Twee of drie telefoons (liefst één iPhone en één Android) voor de test na elke fase.
- Spotify-app op je eigen telefoon **helemaal afsluiten** tijdens het spelen (anders laat die zien welk nummer speelt).

### 9. Na fase 1: jaartallen nalopen (±1 uur)
Het voorbereidingsscript maakt `data/rapport.md` met nummers waarbij het jaar `controleren` is. Zoek per nummer het oorspronkelijke jaar op (Wikipedia of Discogs, het jaar van de eerste single/album van díe opname) en zet het in `data/corrections.csv` als `spotifyId;year;note`. Heb je echte Hitster-kaarten, dan wint het jaar op de kaart.

---

## Mijn antwoorden (ingevuld op 26 november 2026; geen geheimen)

```
GitHub-repo URL:        https://github.com/jpvandermast/tune-timeline   (gecontroleerd; let op: repo staat op PUBLIEK)
Vercel-adres:           https://tune-timeline.vercel.app                (gecontroleerd, project tune-timeline)
Spotify Client ID:      ✔ ingevuld in .env.local (32 tekens) en in Vercel
Playlist-ID:            ✔ ingevuld in .env.local (38UmsfYUNcdvG1EQZ31CH9, "Tune Timeline – bron")
Supabase URL + key:     ✔ ingevuld in .env.local en Vercel (project tzqeokyogankvajfehul, publishable key)
Allow public access:    aan
Eigen Spotify-account toegevoegd bij User Management:  ja
Redirect-URI's (3) toegevoegd:  ja
gh auth status:         ingelogd
Afwijkingen van BESLISSINGEN.md:  geen
Let op:                 .env.backup.local (voorheen Untitled-1.md) bevat sleutels; nooit committen.
```
