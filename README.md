# Målestasjon

## Hva dette er

Et lite måleapparat for ett spørsmål: **hvilke nettsteder oppgir AI-motorer som kilde når noen spør dem om noe lokalt?**

Ikke hvilken bedrift som «rangerer først» — det tallet finnes ikke, fordi listene er for ustabile. Se [Hva den ikke måler](#hva-den-ikke-måler).

Bygget på en helg i september 2026. 200 svar i fullmålingen, fire motorer, to byer, 12,58 USD.

## Slik kjører du det

```bash
node kjor.mjs --royk              # ett spørsmål, én runde, for å se at riggen lever
node kjor.mjs --full --tak 40     # hele listen, stoppgrense 40 USD
node uttrekk.mjs                  # skriver data/rapport.md fra loggen
```

Krever Node.js 20 eller nyere. Sett `OPENROUTER_API_KEY` i miljøet eller i en `.env`-fil i repoets rot. Miljøvariabelen har prioritet. Kjøringene bruker betalte API-er. `data/` opprettes automatisk og holdes utenfor Git.

Kostnadstaket sjekkes etter fullførte kall; opptil fire samtidige kall kan gjøre at sluttkostnaden overstiger taket. Manglende kostnad stopper nye kall fremfor å bli regnet som gratis. Taket gjelder kjent kostnad i hele loggen, inkludert røyktester; det er ikke en fakturagaranti. Nøkkelen skrives aldri til logg eller skjerm.

### Lokal QC

```bash
node --test tests/qc.test.mjs
```

Testene bruker midlertidige mapper og simulerte API-svar. Ingen nettverk, API-nøkler eller betalte kall trengs. De sjekker oppstart, gjenopptak, kostnadsstopp og rapportering.

## Mappene

- `tests/` — QC-testene for `kjor.mjs` og `uttrekk.mjs` (`node --test tests/qc.test.mjs`).
- `docs/` — `docs/decisions/`, én fil per beslutning om repoet.
- `.github/` — CI-workflow, PR-mal og kodeeiere.
- `data/` — rålogg og rapport fra egne kjøringer. Opprettes automatisk og spores ikke i Git.

### Hvordan den er satt sammen

Tre filer utgjør måleriggen.

| Fil | Hva den gjør |
|---|---|
| `sporsmal.json` | Oppsettet. Låst før kjøring. |
| `kjor.mjs` | Stiller spørsmålene, logger hvert svar rått. |
| `uttrekk.mjs` | Leser loggen og skriver rapporten. |

Innsamling og analyse er **skilt**. Det betyr at analysen kan kjøres på nytt mot de samme rådataene og gi samme tall — av hvem som helst, når som helst.

## Regler og beslutninger

- Lokale regler for mennesker og agenter: [`AGENTS.md`](AGENTS.md). Felles regler: byggestandarden i always-agents.
- Beslutninger: [`docs/decisions/`](docs/decisions/), én fil per beslutning.
- Endringer: [`CHANGELOG.md`](CHANGELOG.md).

---

## Fire valg som betyr noe

**Oppsettet er låst før kjøring.** Spørsmål, byer, motorer og antall gjentak står i `sporsmal.json` med en `laast`-dato. Dette er en metodeavtale, ikke en teknisk lås. Endrer du oppsettet, arkiver `data/` og start en ny måling; gamle og nye oppsett skal ikke dele logg.

**Kjøringen kan gjenopptas.** `kjor.mjs` leser ferdige kall fra loggen før den starter, og hopper over dem. Svar som allerede er lagret som vellykkede, kjøres ikke på nytt. Et kall som ble fakturert før en krasj, men ikke rakk å bli logget, kan bli gjentatt. Kjør bare én innsamler om gangen mot samme logg.

**Det finnes et kostnadstak.** `--tak` er i dollar. Riggen stopper selv. En løpsk løkke mot fire betalte API-er er en dyr måte å lære det på.

**Rådataene bevares.** Hvert kall er én linje i `data/kall.jsonl` — svaret, kildelista, modellen, tokens, kostnad, tidsbruk. Rapporten er avledet, aldri kilden.

---

## Hva den ikke måler

Dette avsnittet er like viktig som resten.

**Ikke forbrukerappen.** Målingen går gjennom motorenes utviklerinnganger. ChatGPT-appen en gjest faktisk bruker kan svare annerledes.

**Ikke Google.** Gemini-vilkårene (Grounding with Google Search, Use Restrictions) forbyr å lagre, analysere eller samle lenker programmatisk. Sjekket mot originalteksten 19.09.2026. Google måles ikke — ikke fordi det er uinteressant, men fordi vilkårene sier nei.

**Ikke uavhengige gjentak.** Se stabilitetstabellen i [resultat.md](resultat.md): Perplexity ligger på 1,00. Kildedomenene er svært like mellom gjentak (1,00 i Stockholm, 0,98 i Göteborg). Dette er forenlig med caching, men målingen alene fastslår ikke årsaken eller at gjentakene er uavhengige. Tallet står der fordi det svekker min egen måling.

**Ikke en årsak.** At et domene oppgis som kilde sier ingenting om hvorfor. Ikke om indeksstatus, ikke om tillit, ikke om kvalitet. «Oppga som kilde» — ikke «leste».

**Ikke skraping.** Bare offisielle utviklerinnganger. Ingen forbrukerapper, ingen omgåelse av vilkår.

---

## Resultatet

[resultat.md](resultat.md) er den publiserte rapporten fra pilotkjøringen. Råloggen følger ikke med i dette repoet, så pilotens tall kan ikke reproduseres fra klonen alene. Kjør `kjor.mjs` for å samle egne data og `uttrekk.mjs` for å analysere dem; nye målinger kan gi andre tall. Analysen skriver `data/rapport.md`, slik at den publiserte pilotrapporten bevares.

Den korte versjonen: motorene er ikke i nærheten av hverandre. Snittet på antall kilder per svar spenner fra 5,8 til 20,0. Og stabiliteten fra kjøring til kjøring spenner fra 0,23 til 1,00 — én motor varierer mye mellom gjentak, mens en annen gir nesten identiske kildedomener i denne målingen.

Det betyr at «hvordan ser vi ut i AI-svar» ikke har ett svar. Det har ett svar per motor, og noen av dem er ikke stabile nok til å ha et svar i det hele tatt.

---

## Å bruke den på noe annet

Bytt `sporsmal.json`. Ingenting om et domene eller en bransje ligger i koden.

- `folg` — domener du vil følge. Tom liste, og avsnittet faller bort.
- `ord` — ord å telle i selve svarteksten.
- `toppliste` — sett `true` for å ta med de mest brukte kildedomenene.

De tre står tomme i dette repoet med vilje. Riggen ble bygget for en konkret sak, og resultatene om andres nettsteder hører hjemme i den samtalen — ikke her.

---

MIT. Rune Øverland — [runeoverland.no](https://runeoverland.no)
