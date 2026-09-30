// Applies ESLint's first suggestion for one rule, package by package, repeating until no suggestion is left.
// Usage: node tmp/bigbang/apply-suggestions.cjs <ruleId> [pkgDir ...]   (default: every package with a src/)
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const rule = process.argv[2];
let dirs = process.argv.slice(3);
if (!dirs.length) {
  for (const d of fs.readdirSync(path.join(root, 'packages'))) {
    const p = path.join('packages', d);
    if (d.startsWith('@')) for (const e of fs.readdirSync(path.join(root, p))) dirs.push(path.join(p, e));
    else dirs.push(p);
  }
}
const out = path.join(root, 'tmp', 'bigbang', 'logs', 'eslint-suggest.json');
let total = 0;
for (const dir of dirs) {
  for (let pass = 0; pass < 5; pass++) {
    try {
      execFileSync(path.join(root, 'node_modules/.bin/eslint'), ['-f', 'json', '-o', out, dir], {
        cwd: root, env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=16000' }, stdio: ['ignore', 'ignore', 'inherit'],
      });
    } catch (e) { /* eslint exits 1 while errors remain; the report is what matters */ }
    const report = JSON.parse(fs.readFileSync(out, 'utf8'));
    let applied = 0;
    for (const file of report) {
      const fixes = file.messages.filter((m) => m.ruleId === rule && m.suggestions && m.suggestions[0]).map((m) => m.suggestions[0].fix);
      if (!fixes.length) continue;
      fixes.sort((a, b) => b.range[0] - a.range[0]);
      let text = fs.readFileSync(file.filePath, 'utf8');
      let lastStart = Infinity;
      for (const f of fixes) {
        if (f.range[1] > lastStart) continue; // overlaps a fix already applied this pass; the next pass takes it
        text = text.slice(0, f.range[0]) + f.text + text.slice(f.range[1]);
        lastStart = f.range[0];
        applied++;
      }
      fs.writeFileSync(file.filePath, text);
    }
    total += applied;
    console.log(`${dir} pass ${pass + 1}: ${applied} applied`);
    if (!applied) break;
  }
}
console.log(`total ${total}`);
