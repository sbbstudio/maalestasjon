// Kjør CLI-ene i midlertidige kopier. fetch erstattes før oppstart: ingen nettverk eller ekte nøkler.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, copyFileSync, writeFileSync, readFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
function rig(t) {
  const dir = mkdtempSync(join(tmpdir(), 'maalestasjon-qc-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const f of ['kjor.mjs', 'uttrekk.mjs']) copyFileSync(new URL(f, root), join(dir, f));
  writeFileSync(join(dir, 'sporsmal.json'), JSON.stringify({ byer: ['Oslo'], sporsmal: [{ id: 'nytt', tekst: 'Spørsmål i {by}?' }], motorer: [{ id: 'test', modell: 'test' }], gjentak: 2 }));
  writeFileSync(join(dir, 'mock.mjs'), `import { appendFileSync } from 'node:fs';
  globalThis.fetch = async () => {
    appendFileSync(new URL('./calls', import.meta.url), 'call\\n');
    if (process.env.SCENARIO === 'denied') return { ok: false, status: 401, json: async () => ({ error: 'qc-key' }) };
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: 'Et svar', annotations: [] } }], usage: { cost: process.env.SCENARIO === 'unknown' ? null : 0.1 } }) };
  };`);
  const run = (file, args = [], scenario = '') => spawnSync(process.execPath, ['--import', join(dir, 'mock.mjs'), join(dir, file), ...args], { encoding: 'utf8', timeout: 10000, env: { PATH: process.env.PATH, OPENROUTER_API_KEY: 'qc-key', SCENARIO: scenario } });
  return { dir, run, calls: () => existsSync(join(dir, 'calls')) ? readFileSync(join(dir, 'calls'), 'utf8').trim().split('\n').length : 0 };
}
test('fersk klone: røyktest bruker første spørsmål, oppretter logg og gjenopptar uten nye kall', t => {
  const r = rig(t);
  assert.equal(r.run('kjor.mjs', ['--royk']).status, 0);
  assert.equal(r.calls(), 1);
  assert.match(readFileSync(join(r.dir, 'data/kall.jsonl'), 'utf8'), /royk\|Oslo\|nytt/);
  assert.equal(r.run('kjor.mjs', ['--royk']).status, 0);
  assert.equal(r.calls(), 1);
});
test('ugyldige kostnadstak avvises før API-kall', t => {
  const r = rig(t);
  for (const value of ['0', '-1', 'NaN', 'Infinity', undefined]) {
    const args = ['--full', '--tak']; if (value !== undefined) args.push(value);
    assert.equal(r.run('kjor.mjs', args).status, 2);
  }
  assert.equal(r.calls(), 0);
});
test('nådd tak hindrer nye kall ved gjenopptak', t => {
  const r = rig(t);
  assert.equal(r.run('kjor.mjs', ['--royk', '--tak', '0.1']).status, 1);
  assert.equal(r.run('kjor.mjs', ['--full', '--tak', '0.1']).status, 1);
  assert.equal(r.calls(), 1);
});
test('ukjent kostnad stopper videre kjøring og gjenopptak', t => {
  const r = rig(t);
  assert.equal(r.run('kjor.mjs', ['--royk'], 'unknown').status, 1);
  assert.equal(r.run('kjor.mjs', ['--full']).status, 1);
  assert.equal(r.calls(), 1);
});
test('API-avslag gir feilstatus uten å skrive API-feilens nøkkel til loggen', t => {
  const r = rig(t), out = r.run('kjor.mjs', ['--royk'], 'denied');
  assert.equal(out.status, 1);
  assert.doesNotMatch(out.stdout + out.stderr + readFileSync(join(r.dir, 'data/kall.jsonl'), 'utf8'), /qc-key/);
});
test('rapport håndterer manglende logg og røyktest uten fullmåling', t => {
  const r = rig(t);
  assert.match(r.run('uttrekk.mjs').stderr, /Ingen rålogg/);
  r.run('kjor.mjs', ['--royk']);
  assert.match(r.run('uttrekk.mjs').stderr, /Ingen vellykkede svar/);
});
test('fullmåling kan gjenopptas og rapporten kan reproduseres', t => {
  const r = rig(t);
  assert.equal(r.run('kjor.mjs', ['--full']).status, 0);
  assert.equal(r.calls(), 2);
  assert.equal(r.run('kjor.mjs', ['--full']).status, 0);
  assert.equal(r.calls(), 2);
  assert.equal(r.run('uttrekk.mjs').status, 0);
  const first = readFileSync(join(r.dir, 'data/rapport.md'), 'utf8');
  assert.match(first, /2 svar, 0 feil. Kostnad 0.20 USD/);
  r.run('uttrekk.mjs');
  assert.equal(readFileSync(join(r.dir, 'data/rapport.md'), 'utf8'), first);
});
test('stabilitet sammenligner samme spørsmål; feil som senere lykkes telles ikke', t => {
  const r = rig(t); mkdirSync(join(r.dir, 'data'));
  const rows = ['a', 'a', 'b', 'b'].map((q, i) => ({ ok: true, nokkel: `full|Oslo|${q}|test|${i}`, tid: '2026-09-21', motor: 'test', modell: 'test', by: 'Oslo', sporsmalId: q, sporsmal: `${q} Oslo`, svar: 'svar', kilder: [{ url: `https://${q}.example/` }], kostnad: 0.1 }));
  writeFileSync(join(r.dir, 'data/kall.jsonl'), [{ ...rows[0], ok: false, feil: 'midlertidig' }, ...rows].map(r => JSON.stringify(r)).join('\n') + '\n');
  assert.equal(r.run('uttrekk.mjs').status, 0);
  const report = readFileSync(join(r.dir, 'data/rapport.md'), 'utf8');
  assert.match(report, /4 svar, 0 feil/);
  assert.match(report, /\| test \| 1.00 \|/);
  assert.match(report, /«a \{by\}»; «b \{by\}»/);
});
