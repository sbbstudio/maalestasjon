# Changelog

Merkbare endringer i Målestasjon føres her. Formatet følger [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Repoet har ingen versjonsnumre.

## Unreleased

### Lagt til

- QC-testene i `tests/qc.test.mjs`: oppstart, gjenopptak, kostnadsstopp og rapport, uten nett og uten nøkkel.
- `README.md` med de fire faste overskriftene, `AGENTS.md` og `CLAUDE.md`, slik at repoet forklarer hvordan det kjøres, hva hver mappe og rotfil er til, og de lokale reglene.
- `docs/decisions/`, med beslutningen om at innsamling og analyse er skilt.
- CI som kjører QC-testene på push og pull request mot `main`, PR-mal og kodeeiere.
- `.prettierrc` og `.editorconfig`.

### Endret

- `kjor.mjs`: kostnadstaket valideres, ukjent kostnad stopper nye kall, kall har tidsavbrudd, nøkkelen maskeres i loggen, og `.env` leses fra repoets rot.
- `uttrekk.mjs`: tåler manglende logg og stopper når det ikke finnes vellykkede svar fra full kjøring.
