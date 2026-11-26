# Tune Timeline

Online muziektijdlijn-partyspel naar het voorbeeld van Hitster. 8 tot 10 spelers: de pc aan de tv toont het bord en speelt de muziek (Spotify Premium van de host), iedereen speelt op de eigen telefoon.

- GitHub-repo (naam): `tune-timeline`
- Vercel-project (naam): `tune-timeline`
- Realtime: bestaand Supabase-project, alleen Broadcast/Presence (geen tabellen)

## Werkwijze
1. **Concept, twee keer laten maken (in één keer, zonder fases):**
   - Claude Opus (met toegang tot de map `apps`): korte prompt hieronder. Resultaat komt in `concept-opus/`.
   - Antigravity (met toegang tot de map `apps`): korte prompt hieronder. Resultaat komt in `concept-antigravity/`.
2. **Vergelijken en samenvoegen:** Claude Opus voert `06-prompt-vergelijking.md` uit. Dat levert `concept-v2/` (concept, vergelijking, beslissingen, voorbereidingschecklist, mockups), een ingevulde `04-prompt-claude-code.md` en in de chat een korte prompt voor Claude Code.
3. **Voorbereiden:** werk `concept-v2/VOORBEREIDING.md` af (GitHub, Vercel, Spotify Developer-app, Supabase-sleutels, playlist).
4. **Bouwen:** start Claude Code (Opus) in `apps/tune-timeline/` met de korte prompt uit stap 2. `apps/tune-timeline/` wordt de repo; de voorbereidingsbestanden gaan daarbij naar `docs/`.
5. Test na elke bouwfase met een paar telefoons en geef aanpassingen door.

## Korte prompt voor Claude Opus
> Lees `apps/tune-timeline/03-prompt-opus-chat.md` en voer alles wat daarin staat in één keer en zelfstandig uit, zonder vragen. Schrijf het resultaat in `apps/tune-timeline/concept-opus/`.

## Korte prompt voor Antigravity
> Lees `apps/tune-timeline/05-prompt-antigravity.md` en voer alles wat daarin staat in één keer en zelfstandig uit, zonder vragen. Schrijf het resultaat in `apps/tune-timeline/concept-antigravity/`.

## Korte prompt voor de vergelijking (Claude Opus, nadat beide concepten klaar zijn)
> Lees `apps/tune-timeline/06-prompt-vergelijking.md` en voer alles wat daarin staat in één keer en zelfstandig uit, zonder vragen. Vergelijk en voeg de twee concepten samen in `apps/tune-timeline/concept-v2/`, vul `04-prompt-claude-code.md` in en geef mij aan het eind in de chat de korte prompt voor Claude Code.

## Bestanden
| Bestand | Inhoud |
|---|---|
| 01-spelregels-origineel.md | Regels van het echte Hitster, met bronnen en regionale verschillen |
| 02-ontwerp-online-versie.md | Eerste ontwerp van de online versie |
| 00-gedeelde-opdracht.md | De opdracht die zowel Opus als Antigravity krijgen (zelfde 11 hoofdstukken, zelfde mockupeisen) |
| 03-prompt-opus-chat.md | Volledige prompt voor Claude Opus (bevat 00, 01 en 02) |
| 04-prompt-claude-code.md | Prompt voor Claude Code (wordt ingevuld door de vergelijkingsrun) |
| 05-prompt-antigravity.md | Volledige prompt voor Antigravity (bevat 00, 01 en 02) |
| 06-prompt-vergelijking.md | Prompt om de twee uitkomsten te vergelijken, samen te voegen en de bouwprompt voor Claude Code te schrijven |

## Status
- [x] Spelregels onderzocht
- [x] Eerste ontwerp
- [x] Prompts voor Opus en Antigravity klaar
- [ ] Concept van Opus
- [ ] Concept van Antigravity
- [ ] Vergelijking, samengevoegd concept (v2) en prompt voor Claude Code
- [ ] GitHub, Vercel, Spotify, Supabase ingesteld (VOORBEREIDING.md)
- [ ] Gebouwd en getest
