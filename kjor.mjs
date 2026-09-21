#!/usr/bin/env node
// AI-målestasjon, pilot. Spør fem motorer (via OpenRouter, motorens eget nettsøk)
// om restauranter i svenske byer og logger svar + kildeliste.
// Bruk:  node kjor.mjs --royk            (ett spørsmål × fem motorer, ett gjentak)
//        node kjor.mjs --full --tak 40   (hele listen, stopper ved kostnadstak i USD)
// Nøkkelen leses fra ~/intervju/.env og skrives aldri ut.
import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HER = dirname(fileURLToPath(import.meta.url));
const ENV = join(HER, '..', '..', '.env');
const UT = join(HER, 'data', 'kall.jsonl');
const arg = process.argv.slice(2);
const ROYK = arg.includes('--royk');
const FULL = arg.includes('--full');
const TAK = Number(arg[arg.indexOf('--tak') + 1]) || (ROYK ? 1 : 40);
const SAMTIDIG = 4;

if (ROYK === FULL) { console.error('Velg --royk eller --full'); process.exit(2); }

function nokkel() {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  if (!existsSync(ENV)) return null;
  const m = readFileSync(ENV, 'utf8').match(/^OPENROUTER_API_KEY=(.+)$/m);
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
}
const KEY = nokkel();
if (!KEY) { console.error('STOPP: fant ikke OPENROUTER_API_KEY i ~/intervju/.env'); process.exit(3); }

const cfg = JSON.parse(readFileSync(join(HER, 'sporsmal.json'), 'utf8'));
const ferdig = new Set();
let brukt = 0;
if (existsSync(UT)) for (const l of readFileSync(UT, 'utf8').split('\n')) {
  if (!l) continue;
  const r = JSON.parse(l);
  if (r.ok) { ferdig.add(r.nokkel); brukt += r.kostnad || 0; }
}

const jobber = [];
const byer = ROYK ? cfg.byer.slice(0, 1) : cfg.byer;
const spm = ROYK ? cfg.sporsmal.filter(s => s.id === 'julbord') : cfg.sporsmal;
// En motor kan ha eget antall gjentak (dyre motorer kjøres færre ganger).
const antall = m => ROYK ? 1 : (m.gjentak ?? cfg.gjentak);
for (const by of byer) for (const s of spm) for (const m of cfg.motorer) for (let g = 1; g <= antall(m); g++) {
  const nk = `${ROYK ? 'royk' : 'full'}|${by}|${s.id}|${m.id}|${g}`;
  if (!ferdig.has(nk)) jobber.push({ nk, by, s, m, g });
}
console.log(`${jobber.length} kall igjen · brukt hittil ${brukt.toFixed(2)} USD · tak ${TAK} USD`);

async function kall(j, forsok = 1) {
  const sporsmal = j.s.tekst.replace('{by}', j.by);
  const start = Date.now();
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', 'X-Title': 'maalestasjon-pilot' },
      body: JSON.stringify({
        model: j.m.modell,
        messages: [{ role: 'user', content: sporsmal }],
        // Perplexity Sonar søker selv; de andre trenger motorens eget søk slått på.
        ...(j.m.innebygdSok ? {} : { plugins: [{ id: 'web', engine: 'native' }] }),
        usage: { include: true },
        max_tokens: 1200,
      }),
    });
    if ((res.status === 429 || res.status >= 500) && forsok < 4) {
      await new Promise(r => setTimeout(r, 4000 * forsok));
      return kall(j, forsok + 1);
    }
    const d = await res.json();
    if (!res.ok || d.error) throw new Error(`${res.status} ${JSON.stringify(d.error || d).slice(0, 300)}`);
    const msg = d.choices?.[0]?.message || {};
    let kilder = (msg.annotations || []).filter(a => a.type === 'url_citation')
      .map(a => ({ url: a.url_citation.url, tittel: a.url_citation.title || null }));
    if (!kilder.length && Array.isArray(d.citations)) kilder = d.citations.map(u => ({ url: u, tittel: null }));
    return { ok: true, nokkel: j.nk, tid: new Date().toISOString(), motor: j.m.id, modell: d.model || j.m.modell,
      by: j.by, sporsmalId: j.s.id, sporsmal, gjentak: j.g, svar: msg.content || '', kilder,
      kostnad: d.usage?.cost ?? null, tokens: d.usage?.total_tokens ?? null, ms: Date.now() - start };
  } catch (e) {
    return { ok: false, nokkel: j.nk, tid: new Date().toISOString(), motor: j.m.id, by: j.by,
      sporsmalId: j.s.id, gjentak: j.g, feil: String(e.message).slice(0, 400) };
  }
}

let stopp = false, ok = 0, feil = 0;
async function arbeider() {
  while (jobber.length && !stopp) {
    const j = jobber.shift();
    const r = await kall(j);
    appendFileSync(UT, JSON.stringify(r) + '\n');
    if (r.ok) { ok++; brukt += r.kostnad || 0;
      console.log(`ok  ${r.motor.padEnd(10)} ${r.by.padEnd(10)} ${r.sporsmalId.padEnd(10)} #${r.gjentak} · ${r.kilder.length} kilder · ${(r.kostnad ?? 0).toFixed(4)} USD`);
    } else { feil++; console.log(`FEIL ${r.motor} ${r.by} ${r.sporsmalId}: ${r.feil}`); }
    // Tom konto eller ugyldig nøkkel: stopp straks, ikke brenn gjennom køen.
    if (!r.ok && /^(401|402|403) /.test(r.feil)) { stopp = true; console.log('STOPP: kontoen avviser kall (kreditt eller nøkkel)'); }
    if (brukt >= TAK) { stopp = true; console.log(`STOPP: kostnadstak ${TAK} USD nådd`); }
  }
}
await Promise.all(Array.from({ length: SAMTIDIG }, arbeider));
console.log(`\nFerdig: ${ok} ok · ${feil} feil · brukt totalt ${brukt.toFixed(2)} USD · ${jobber.length} kall gjenstår`);
