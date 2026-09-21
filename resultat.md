# Målestasjon — helgepilot

Kjørt 2026-09-19. 200 svar, 0 feil. Kostnad 12.58 USD.

**Spørsmål:** «Var kan man äta ett bra julbord i {by} i år?»

**Metode:** hvert spørsmål stilt på nytt uten historikk, via motorenes utviklerinngang med eget nettsøk slått på. Vi teller hvilke nettsteder svarene oppgir som kilde. Dette er ikke det samme som appen gjestene bruker. Google er ikke målt (vilkårene tillater det ikke).

## Svar per motor

| Motor | Modell | Svar | Snitt kilder | Svar uten kilder |
|---|---|---|---|---|
| openai | openai/gpt-chat-latest | 60 | 5.8 | 2 |
| anthropic | anthropic/claude-sonnet-5 | 60 | 11.2 | 0 |
| perplexity | perplexity/sonar | 60 | 20.0 | 0 |
| xai | x-ai/grok-4.6 | 20 | 7.3 | 0 |

## Hvor stabile er kildelistene?

Likhet mellom to tilfeldige kjøringer av samme spørsmål (0 = ingen felles kilder, 1 = helt like).

| Motor | Stockholm | Göteborg |
|---|---|---|
| openai | 0.23 | 0.34 |
| anthropic | 0.76 | 0.63 |
| perplexity | 1.00 | 0.98 |
| xai | 0.53 | 0.40 |
