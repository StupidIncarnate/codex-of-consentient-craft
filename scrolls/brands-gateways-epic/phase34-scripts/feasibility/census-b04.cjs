const lib = require('../lib/repo.cjs');
const fs = require('fs'); const path = require('path');
const { ts, ROOT, rel } = lib;
const files = [...lib.walk(path.join(ROOT,'packages/eslint-plugin')), ...lib.walk(path.join(ROOT,'packages/local-eslint'))];
let prodRef=[], tsNames=0, stubFiles=new Set(), stubCalls=0, ctxFiles=new Set(), ctxCalls=0;
for (const f of files) {
  const t = fs.readFileSync(f,'utf8');
  const isTest = lib.isTestSupport(f);
  const has = /\bTsestree\b/.test(t);
  if (!isTest && has) prodRef.push(rel(f));
  const sc=(t.match(/TsestreeStub\(/g)||[]).length; if(sc){stubCalls+=sc;stubFiles.add(rel(f));}
  const cc=(t.match(/EslintContextStub\(/g)||[]).length; if(cc){ctxCalls+=cc;ctxFiles.add(rel(f));}
}
console.log({prodRef:prodRef.length, stubCalls, stubFiles:stubFiles.size, ctxCalls, ctxFiles:ctxFiles.size});
fs.writeFileSync(lib.workDir(__dirname)+'/b04-prod-files.txt', prodRef.join('\n'));
