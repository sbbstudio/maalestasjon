#!/usr/bin/env node
// Målestasjon — uttrekk. Leser data/kall.jsonl (kun full kjøring) og skriver data/rapport.md.
// Måler kildedomener, ikke restaurantrang.
// Bruk:  node uttrekk.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HER = dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(readFileSync(join(HER, 'sporsmal.json'), 'utf8'));
// Domener aa foelge og ord aa telle er oppsett, ikke kode. Uten dem faller
// avsnittene bort, og rapporten handler bare om motorene.
const FOLG = cfg.folg ?? [];
const ORD = cfg.ord ?? [];
const TOPPLISTE = cfg.toppliste === true;

const rader = readFileSync(join(HER, 'data/kall.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
const full = rader.filter(r => r.nokkel.startsWith('full|'));
const ok = full.filter(r => r.ok);
// Et kall som feilet og senere ble kjørt på nytt med hell, regnes ikke som feil.
const lyktes = new Set(ok.map(r => r.nokkel));
const feil = full.filter(r => !r.ok && !lyktes.has(r.nokkel));

const domene = u => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; } };
for (const r of ok) r.dom = [...new Set(r.kilder.map(k => domene(k.url)).filter(Boolean))];

const pst = (a, b) => b ? `${Math.round(100 * a / b)} %` : '–';
const motorer = [...new Set(ok.map(r => r.motor))];
const byer = [...new Set(ok.map(r => r.by))];

// Andel svar der domenet er brukt som kilde minst én gang.
function andel(utvalg, d) { return utvalg.filter(r => r.dom.includes(d)).length; }

// Hvor like er kildelistene fra kjøring til kjøring? Snitt Jaccard mellom alle par.
function likhet(utvalg) {
  let sum = 0, n = 0;
  for (let i = 0; i < utvalg.length; i++) for (let j = i + 1; j < utvalg.length; j++) {
    const a = new Set(utvalg[i].dom), b = new Set(utvalg[j].dom);
    const snitt = [...a].filter(x => b.has(x)).length, union = new Set([...a, ...b]).size;
    if (union) { sum += snitt / union; n++; }
  }
  return n ? sum / n : null;
}

let ut = `# Målestasjon — helgepilot\n\n`;
ut += `Kjørt ${ok[0]?.tid.slice(0, 10) ?? '?'}. ${ok.length} svar, ${feil.length} feil. Kostnad ${ok.reduce((s, r) => s + (r.kostnad || 0), 0).toFixed(2)} USD.\n\n`;
ut += `**Spørsmål:** «${ok[0]?.sporsmal.replace(byer[0], '{by}')}»\n\n`;
ut += `**Metode:** hvert spørsmål stilt på nytt uten historikk, via motorenes utviklerinngang med eget nettsøk slått på. Vi teller hvilke nettsteder svarene oppgir som kilde. Dette er ikke det samme som appen gjestene bruker. Google er ikke målt (vilkårene tillater det ikke).\n\n`;

ut += `## Svar per motor\n\n| Motor | Modell | Svar | Snitt kilder | Svar uten kilder |\n|---|---|---|---|---|\n`;
for (const m of motorer) {
  const u = ok.filter(r => r.motor === m);
  ut += `| ${m} | ${u[0].modell} | ${u.length} | ${(u.reduce((s, r) => s + r.kilder.length, 0) / u.length).toFixed(1)} | ${u.filter(r => !r.dom.length).length} |\n`;
}

if (FOLG.length) {
  ut += `\n## Fulgte domener\n\nAndel svar der domenet er oppgitt som kilde minst en gang.\n\n| Domene | ${motorer.join(' | ')} | Alle |\n|---|${motorer.map(() => '---').join('|')}|---|\n`;
  for (const d of FOLG) {
    ut += `| ${d} | ${motorer.map(m => { const u = ok.filter(r => r.motor === m); return `${pst(andel(u, d), u.length)} (${andel(u, d)}/${u.length})`; }).join(' | ')} | ${pst(andel(ok, d), ok.length)} |\n`;
  }
  for (const by of byer) {
    const u = ok.filter(r => r.by === by);
    ut += `\n### ${by}\n\n| Domene | ${motorer.join(' | ')} |\n|---|${motorer.map(() => '---').join('|')}|\n`;
    for (const d of FOLG) ut += `| ${d} | ${motorer.map(m => { const v = u.filter(r => r.motor === m); return `${andel(v, d)}/${v.length}`; }).join(' | ')} |\n`;
  }
}

if (TOPPLISTE) {
ut += `\n## Mest brukte kilder (alle motorer)\n\n| # | Nettsted | Andel svar | ${motorer.join(' | ')} |\n|---|---|---|${motorer.map(() => '---').join('|')}|\n`;
const teller = new Map();
for (const r of ok) for (const d of r.dom) teller.set(d, (teller.get(d) || 0) + 1);
[...teller].sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([d, n], i) => {
  ut += `| ${i + 1} | ${d} | ${pst(n, ok.length)} | ${motorer.map(m => { const u = ok.filter(r => r.motor === m); return pst(andel(u, d), u.length); }).join(' | ')} |\n`;
});
ut += `\nUlike nettsteder totalt: ${teller.size}.\n`;
}

ut += `\n## Hvor stabile er kildelistene?\n\nLikhet mellom to tilfeldige kjøringer av samme spørsmål (0 = ingen felles kilder, 1 = helt like).\n\n| Motor | ${byer.join(' | ')} |\n|---|${byer.map(() => '---').join('|')}|\n`;
for (const m of motorer) ut += `| ${m} | ${byer.map(by => { const l = likhet(ok.filter(r => r.motor === m && r.by === by)); return l == null ? '–' : l.toFixed(2); }).join(' | ')} |\n`;

if (ORD.length) ut += `\n## Nevnt i selve svarteksten\n\n| Ord | ${motorer.join(' | ')} |\n|---|${motorer.map(() => '---').join('|')}|\n`;
for (const ord of ORD) {
  ut += `| ${ord} | ${motorer.map(m => { const u = ok.filter(r => r.motor === m); return `${u.filter(r => r.svar.toLowerCase().includes(ord)).length}/${u.length}`; }).join(' | ')} |\n`;
}

if (feil.length) {
  ut += `\n## Feil\n\n`;
  for (const f of feil) ut += `- ${f.motor} ${f.by} #${f.gjentak}: ${f.feil.slice(0, 160)}\n`;
}

writeFileSync(join(HER, 'data/rapport.md'), ut);
console.log(ut);
