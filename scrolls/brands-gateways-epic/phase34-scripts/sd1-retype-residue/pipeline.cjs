// SD1: the whole L2 residue chain on copies, one command. Writes nothing under packages/.
//   1 run.cjs        retype + strip on an in-memory overlay          -> <work>/prod0
//   2 residue.cjs    narrowing guards, brand widening, dead-condition removal (--dead), optional helper
//                    narrowing (--narrow, slow, changes no error count)  -> <work>/prod
//   3 tests.cjs      TsestreeStub trees to <Node>Stub({ code }), EslintContextStub to RuleContextStub,
//                    typecheck before/after                            -> <work>/tests
//   4 malformed.cjs  the deletion list                                 -> out/malformed-tests.md
//   5 leftovers.cjs  the hand queue                                    -> out/hand-queue.md
// A work dir that already exists is moved aside (renamed), never deleted.
// Usage: node tmp/phase34/sd1-retype-residue/pipeline.cjs [--work=tmp/sd1-work] [--narrow]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT } = require('../lib/repo.cjs');
const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const work = arg('work') ?? 'tmp/sd1-work';
const abs = path.join(ROOT, work);
if (fs.existsSync(abs)) fs.renameSync(abs, `${abs}.${new Date().toISOString().replace(/[:.]/gu, '-')}`);
fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
const run = (script, args) => {
  console.log(`\n## ${script} ${args.join(' ')}`);
  execFileSync('node', [path.join(__dirname, script), ...args], { stdio: 'inherit', cwd: ROOT, maxBuffer: 1 << 28 });
};
run('run.cjs', [`--json=out/run0.json`, `--sample-out=${work}/prod0`]);
run('residue.cjs', [`--sample=${work}/prod0`, `--out=${work}/prod`, '--json=out/residue.json', '--dead', ...(process.argv.includes('--narrow') ? ['--narrow'] : [])]);
run('tests.cjs', [`--prod=${work}/prod`, `--out=${work}/tests`]);
run('malformed.cjs', [`--sample=${work}/prod`]);
run('leftovers.cjs', [`--prod=${work}/prod`]);
