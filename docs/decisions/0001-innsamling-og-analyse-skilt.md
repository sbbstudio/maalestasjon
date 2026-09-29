# 0001 — Innsamling og analyse er skilt

**Dato:** 2026-09-29

**Status:** Vedtatt

Skillet finnes i repoets første commit 5555cde (2026-09-21); pilotrapporten resultat.md er kjørt 2026-09-19 med de samme to filene. Dokumentert her 2026-09-29.

## Beslutning

Innsamling og analyse ligger i hver sin fil. `kjor.mjs` stiller spørsmålene og logger hvert kall rått som én linje i `data/kall.jsonl`. `uttrekk.mjs` leser bare loggen og skriver rapporten. Rapporten er avledet, aldri kilden.

## Hvorfor

Analysen kan da kjøres på nytt mot de samme rådataene og gi samme tall, av hvem som helst, når som helst. Kilden under beskriver oppsettet, ikke alternativene som ble veid da det ble valgt; denne fila beskriver oppsettet slik det står på datoen over.

## Kilde

- README, `### Hvordan den er satt sammen` under `## Mappene`: «Innsamling og analyse er **skilt**.»
- README, `## Fire valg som betyr noe`: «Rådataene bevares.»

## Konsekvens

- Hvert kall logges med svaret, kildelista, modellen, tokens, kostnad og tidsbruk, slik at analysen ikke trenger nye kall.
- `uttrekk.mjs` skriver `data/rapport.md`, slik at den publiserte pilotrapporten `resultat.md` bevares.
- Råloggen fra piloten følger ikke med i repoet, så pilotens tall kan ikke reproduseres fra klonen alene.
