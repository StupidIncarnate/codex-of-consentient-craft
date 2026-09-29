import { ESLint } from 'eslint';
import { writeFileSync } from 'fs';
const eslint = new ESLint({ overrideConfigFile: 'tmp/a18-siegelense-census.config.js', cwd: process.cwd(), errorOnUnmatchedPattern: false });
const results = await eslint.lintFiles(['packages/siegelense']);
const out = results.filter(r => r.messages.length).map(r => ({ filePath: r.filePath.replace(process.cwd() + '/', ''), messages: r.messages.map(m => ({ ruleId: m.ruleId, line: m.line, message: m.message, fatal: m.fatal })) }));
writeFileSync('tmp/a18-siegelense-census.json', JSON.stringify(out, null, 1));
console.log(results.length, 'files linted;', out.length, 'with messages');
