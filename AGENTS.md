# AGENTS.md

Lokale regler for alle som endrer dette repoet, mennesker og agenter. Felles byggeregler ligger utenfor repoet; denne fila legger bare til.

## Mappene

- `tests/` — QC-testene for `kjor.mjs` og `uttrekk.mjs`. Ingen nett, ingen nøkler.
- `docs/` — `docs/decisions/`, én fil per beslutning om repoet.
- `.github/` — CI-workflow, PR-mal og kodeeiere.
- `data/` — rålogg (`data/kall.jsonl`) og `data/rapport.md` fra egne kjøringer. Opprettes automatisk, spores ikke.

Ingen nye løse filer i roten. En ny fil går i en av mappene over; passer ingen, spør før du legger til en.

## Rotfilene

Måleriggen:

- `sporsmal.json` — oppsettet for målingen, låst med en `laast`-dato.
- `kjor.mjs` — stiller spørsmålene og logger hvert svar rått til `data/kall.jsonl`.
- `uttrekk.mjs` — leser loggen og skriver `data/rapport.md`.
- `resultat.md` — den publiserte rapporten fra pilotkjøringen 19.09.2026.

Oppsett:

- `.gitignore` — holder `data/`, `node_modules/` og `.env` utenfor Git.
- `.prettierrc` — formatinnstillinger.
- `.editorconfig` — editorstandard: UTF-8, LF, to mellomrom, trimmet mellomrom på linjeslutt, linjeskift til slutt.

Dokumentasjon:

- `README.md` — hva dette er, slik kjører du det, mappene, regler og beslutninger.
- `AGENTS.md` — denne fila.
- `CLAUDE.md` — importerer denne fila.
- `CHANGELOG.md` — endringer, nyeste først.
- `LICENSE` — MIT.

## Regler

- Kjøringene koster penger og krever `OPENROUTER_API_KEY` (miljøvariabel eller `.env` i roten).
- Kjør alltid `node --test tests/qc.test.mjs` før PR. Testene trenger verken nett eller nøkkel.
- Oppsettet i `sporsmal.json` er låst per måling. Endres oppsettet, arkiveres `data/` og en ny måling startes; gamle og nye oppsett deler ikke logg.
- `resultat.md` er den publiserte pilotrapporten og skal ikke regenereres. `uttrekk.mjs` skriver til `data/rapport.md`.
- Ikke finn på tall.
- Store filer: ingen sporede filer over 1 MB.
