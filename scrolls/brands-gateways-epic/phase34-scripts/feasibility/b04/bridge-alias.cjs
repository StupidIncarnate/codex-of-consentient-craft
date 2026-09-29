// Experiment A: alias bridge. `Tsestree = TSESTree.Node` in the contract, no file rewritten.
const fs=require('fs'),path=require('path');const lib=require('../../phase34/lib/repo.cjs');const {ts,ROOT,rel}=lib;
const w=lib.workspaces().find(x=>x.short==='eslint-plugin');
const files=lib.walk(path.join(w.dir,'src')).filter(f=>!lib.isTestSupport(f)&&!/(contracts\/(tsestree|eslint-context)\/|statics\/tsestree-node-type\/)/.test(rel(f)));
const cands=files.filter(f=>/\bTsestree\b|\bEslintContext\b/.test(fs.readFileSync(f,'utf8')));
const ov=new Map();
const tc=path.join(w.dir,'src/contracts/tsestree/tsestree-contract.ts');
ov.set(tc, fs.readFileSync(tc,'utf8')+"\nimport type { TSESTree as RealTree } from '#gateway/npm/typescript-eslint__utils';\nexport type TsestreeX = RealTree.Node;\n");
// replace the type export
ov.set(tc, ov.get(tc).replace(/export type Tsestree\b[^;]*;/u,'').replace('TsestreeX','Tsestree'));
const options=lib.packageCompilerOptions(w.dir);
const base=lib.diagnosticsWithOverlay(cands,new Map(),options).diagnostics;
const aft=lib.diagnosticsWithOverlay(cands,ov,options).diagnostics;
let z=0,e=0;for(const f of cands){const n=(aft.get(f)??[]).length-(base.get(f)??[]).length;e+=n;if(n===0)z++}
console.log({cands:cands.length,zero:z,errors:e});
