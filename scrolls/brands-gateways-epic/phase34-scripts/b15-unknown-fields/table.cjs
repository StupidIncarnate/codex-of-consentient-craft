// Reads item 3's decisions table out of the decision file (--decisions=<file>, default items/b15-brand-migration.md),
// one row per line. PORTING.md gives the heading and columns.
const lib = require('../lib/repo.cjs');
module.exports = () => {
  const t = lib.cfg.decisionsText();
  const start = t.indexOf('### Item 3: the `z.unknown()` sites');
  if (start === -1) throw new Error(`${lib.cfg.DECISIONS}: no "### Item 3: the \`z.unknown()\` sites" heading`);
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
