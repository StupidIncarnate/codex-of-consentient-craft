// Reads item 3's decisions table out of b15-brand-migration.md, one row per line.
const fs = require('fs');
const path = require('path');
const lib = require('../lib/repo.cjs');
const FILE = path.join(lib.ROOT, 'scrolls/brands-gateways-epic/items/b15-brand-migration.md');
module.exports = () => {
  const t = fs.readFileSync(FILE, 'utf8');
  const start = t.indexOf('### Item 3: the `z.unknown()` sites');
  const end = t.indexOf('Reading the columns:', start);
  return t.slice(start, end).split('\n').filter((l) => /^\| \d+ \|/.test(l)).map((l) => {
    const c = l.split('|').slice(1, -1).map((s) => s.trim());
    const [pl, line] = [c[1].replace(/:\d+$/, ''), Number(c[1].match(/:(\d+)$/)?.[1])];
    return { n: Number(c[0]), file: 'packages/' + pl, line, field: c[2], decision: c[3], target: c[4], targetPath: c[5], status: c[6], why: c[7] };
  });
};
if (require.main === module) {
  const rows = module.exports();
  const by = {};
  for (const r of rows) (by[`${r.decision}/${r.status}`] ||= []).push(r);
  console.log(rows.length, Object.fromEntries(Object.entries(by).map(([k, v]) => [k, v.length])));
  const tgt = {};
  for (const r of rows) (tgt[r.target] ||= []).push(r.n);
  for (const [k, v] of Object.entries(tgt)) console.log(v.length, k.slice(0, 90), v.join(','));
}
