// Does @typescript-eslint/no-unnecessary-condition's fixer remove the same optional chains?
// Copies eslint-plugin's retyped production files into tmp/.../eslint-copy (inside the repo so root node_modules resolves), lints there.
const fs=require('fs'),path=require('path');
const lib=require('../../lib/repo.cjs');const {ROOT,rel}=lib;
const W=lib.workDir(__dirname);
const copy=path.join(W,'eslint-copy');
fs.rmSync(copy,{recursive:true,force:true});
const w=lib.workspaces().find(x=>x.short==='eslint-plugin');
const only=new Set();
const put=(src,dest)=>{fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(src,dest)};
for(const f of lib.walk(path.join(w.dir,'src'))) if(!lib.isTestSupport(f)) put(f,path.join(copy,path.relative(w.dir,f)));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).forEach(e=>{const p=path.join(d,e.name);if(e.isDirectory())walk(p);else{const r=path.relative(path.join(W,'sample-retype-only','packages/eslint-plugin'),p);put(p,path.join(copy,r));only.add(r)}});
walk(path.join(W,'sample-retype-only/packages/eslint-plugin'));
fs.writeFileSync(path.join(copy,'package.json'),JSON.stringify({name:'copy',imports:w.packageJson.imports}));
fs.writeFileSync(path.join(copy,'tsconfig.json'),JSON.stringify({extends:path.relative(copy,path.join(ROOT,'tsconfig.json')),compilerOptions:{typeRoots:[path.join(ROOT,'node_modules/@types'),path.join(ROOT,'@types')],rootDir:'.'},include:['src/**/*']}));
(async()=>{
 const {ESLint}=lib.rootRequire('eslint');
 const tsParser=lib.rootRequire('@typescript-eslint/parser');const plugin=lib.rootRequire('@typescript-eslint/eslint-plugin');
 const eslint=new ESLint({cwd:copy,overrideConfigFile:true,fix:true,overrideConfig:[{files:['**/*.ts'],languageOptions:{parser:tsParser,parserOptions:{project:'./tsconfig.json',tsconfigRootDir:copy}},plugins:{'@typescript-eslint':plugin},rules:{'@typescript-eslint/no-unnecessary-condition':'error'}}]});
 const targets=[...only].map(r=>path.join(copy,r));
 const res=await eslint.lintFiles(targets);
 let fixedFiles=0,remainingMsgs={},optBefore=0,optAfterEslint=0,optMine=0;
 const mine=path.join(W,'sample-all/packages/eslint-plugin');
 for(const r of res){
  const rp=path.relative(copy,r.filePath);
  const before=fs.readFileSync(r.filePath,'utf8');
  if(r.output){fixedFiles++;}
  const after=r.output??before;
  const cnt=t=>(t.match(/\?\./g)||[]).length;
  optBefore+=cnt(before);optAfterEslint+=cnt(after);
  const mp=path.join(mine,rp);optMine+=fs.existsSync(mp)?cnt(fs.readFileSync(mp,'utf8')):cnt(before);
  for(const m of r.messages){const k=m.ruleId+':'+m.messageId;remainingMsgs[k]=(remainingMsgs[k]||0)+1}
 }
 console.log(JSON.stringify({files:res.length,filesFixed:fixedFiles,optChainsBefore:optBefore,optChainsAfterEslintFix:optAfterEslint,optChainsAfterMyPass:optMine,remainingMsgs}));
})();
