# Målestasjon

Et lite måleapparat for ett spørsmål: **hvilke nettsteder oppgir AI-motorer som kilde når noen spør dem om noe lokalt?**

Ikke hvilken bedrift som «rangerer først» — det tallet finnes ikke, fordi listene er for ustabile. Se [Hva den ikke måler](#hva-den-ikke-måler).

Bygget på en helg i september 2026. 204 svar, fire motorer, to byer, 12,58 USD.

---

## Hvordan den er satt sammen

Tre filer, 224 linjer til sammen.

| Fil | Hva den gjør |
|---|---|
| `sporsmal.json` | Oppsettet. Låst før kjøring. |
| `kjor.mjs` | Stiller spørsmålene, logger hvert svar rått. |
| `uttrekk.mjs` | Leser loggen og skriver rapporten. |

Innsamling og analyse er **skilt**. Det betyr at analysen kan kjøres på nytt mot de samme rådataene og gi samme tall — av hvem som helst, når som helst.

```bash
node kjor.mjs --royk              # ett spørsmål, én runde, for å se at riggen lever
node kjor.mjs --full --tak 40     # hele listen, stopper ved 40 USD
node uttrekk.mjs                  # skriver resultat.md fra loggen
```

Nøkkelen leses fra `.env` og skrives aldri til logg eller skjerm.

---

## Fire valg som betyr noe

**Oppsettet er låst før kjøring.** Spørsmål, byer, motorer og antall gjentak står i `sporsmal.json` med en `laast`-dato. Man kan ikke justere spørsmålet underveis til tallene blir pene.

**Kjøringen kan gjenopptas.** `kjor.mjs` leser ferdige kall fra loggen før den starter, og hopper over dem. Krasjer den på kall 180 av 240, koster det ingenting å starte igjen.

**Det finnes et kostnadstak.** `--tak` er i dollar. Riggen stopper selv. En løpsk løkke mot fire betalte API-er er en dyr måte å lære det på.

**Rådataene bevares.** Hvert kall er én linje i `data/kall.jsonl` — svaret, kildelista, modellen, tokens, kostnad, tidsbruk. Rapporten er avledet, aldri kilden.

---

## Hva den ikke måler

Dette avsnittet er like viktig som resten.

**Ikke forbrukerappen.** Målingen går gjennom motorenes utviklerinnganger. ChatGPT-appen en gjest faktisk bruker kan svare annerledes.

**Ikke Google.** Gemini-vilkårene (Grounding with Google Search, Use Restrictions) forbyr å lagre, analysere eller samle lenker programmatisk. Sjekket mot originalteksten 19.09.2026. Google måles ikke — ikke fordi det er uinteressant, men fordi vilkårene sier nei.

**Ikke uavhengige gjentak.** Se stabilitetstabellen i [resultat.md](resultat.md): Perplexity ligger på 1,00. Motoren cacher søket sitt, så 60 svar er to kildelister, ikke seksti uavhengige. Tallet står der fordi det svekker min egen måling.

**Ikke en årsak.** At et domene oppgis som kilde sier ingenting om hvorfor. Ikke om indeksstatus, ikke om tillit, ikke om kvalitet. «Oppga som kilde» — ikke «leste».

**Ikke skraping.** Bare offisielle utviklerinnganger. Ingen forbrukerapper, ingen omgåelse av vilkår.

---

## Resultatet

[resultat.md](resultat.md) er generert av `uttrekk.mjs` fra det låste oppsettet i dette repoet.

Den korte versjonen: motorene er ikke i nærheten av hverandre. Snittet på antall kilder per svar spenner fra 5,8 til 20,0. Og stabiliteten fra kjøring til kjøring spenner fra 0,23 til 1,00 — én motor gir nesten en ny kildeliste hver gang, en annen gir deg den samme lista uansett hvor mange ganger du spør.

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
