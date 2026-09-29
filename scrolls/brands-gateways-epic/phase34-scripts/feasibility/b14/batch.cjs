// B14 batch: generate every printable data shape (one per source file, unique contract names), overlay, typecheck per package.
const fs=require('fs'),path=require('path');
const lib=require('../../phase34/lib/repo.cjs');const {ts,ROOT,rel}=lib;
const {shapes,tryPrint,folderTypeOf}=require('./census.cjs');const {genOne}=require('./gen.cjs');
const ws=lib.workspaces();
const seenFiles=new Set(),seenNames=new Set();
const res={attempted:0,generated:0,skip:{},};const overlay=new Map();const gens=[];
for(const s of shapes){ if(s.isTest||s.klass!=='data')continue; if(!tryPrint(s).ok)continue; res.attempted++;
  const f=rel(s.file); if(seenFiles.has(f)){res.skip['second shape in same file']=(res.skip['second shape in same file']||0)+1;continue}
  let g;try{g=genOne(f,s.name)}catch(e){res.skip['error: '+e.message.slice(0,60)]=(res.skip['error: '+e.message.slice(0,60)]||0)+1;continue}
  if(!g.ok){res.skip[g.reason.replace(/contract name .* already exists/,'contract name already exists')]=(res.skip[g.reason.replace(/contract name .* already exists/,'contract name already exists')]||0)+1;continue}
  const key=g.cfile; if(seenNames.has(key)){res.skip['duplicate generated contract name']=(res.skip['duplicate generated contract name']||0)+1;continue}
  seenNames.add(key);seenFiles.add(f);res.generated++;gens.push(g);
  const dir=g.dir,b=path.basename(g.cfile).replace(/-contract\.ts$/,'');
  overlay.set(g.cfile,g.contractText);overlay.set(path.join(dir,b+'.stub.ts'),g.stubText);overlay.set(path.join(dir,b+'-contract.test.ts'),g.testText);overlay.set(g.srcFile,g.srcText);
}
console.log(JSON.stringify(res));
const keyOf=d=>`${d.code}:${ts.flattenDiagnosticMessageText(d.messageText,' ')}`;
const byPkg={};for(const f of overlay.keys()){const w=lib.workspaceOf(f,ws);(byPkg[w.name]??=[]).push(f)}
let files=0,clean=0,newD=0;const kinds={};const badFiles=[];
for(const [pn,fl] of Object.entries(byPkg)){const w=ws.find(x=>x.name===pn);const options=lib.packageCompilerOptions(w.dir);
  const exist=fl.filter(f=>fs.existsSync(f));const base=lib.diagnosticsWithOverlay(exist,new Map(),options).diagnostics;
  const aft=lib.diagnosticsWithOverlay(fl,overlay,options).diagnostics;
  for(const f of fl){files++;const bk=new Set((base.get(f)??[]).map(keyOf));const add=(aft.get(f)??[]).filter(d=>!bk.has(keyOf(d)));
    if(!add.length)clean++;else{badFiles.push(rel(f));for(const d of add){newD++;const k='TS'+d.code+' '+ts.flattenDiagnosticMessageText(d.messageText,' ').slice(0,60).replace(/'[^']*'/g,'X');kinds[k]=(kinds[k]||0)+1}}}
}
const genFilesBad=new Set(badFiles);
const perShapeClean=gens.filter(g=>[g.cfile,g.srcFile].every(f=>!genFilesBad.has(rel(f)))&&![path.join(g.dir,path.basename(g.cfile).replace(/-contract\.ts$/,'.stub.ts')),path.join(g.dir,path.basename(g.cfile).replace(/\.ts$/,'.test.ts'))].some(f=>genFilesBad.has(rel(f)))).length;
console.log(JSON.stringify({filesChecked:files,filesClean:clean,newDiagnostics:newD,shapesFullyClean:perShapeClean,of:gens.length}));
console.log(Object.entries(kinds).sort((a,b)=>b[1]-a[1]).slice(0,12));
fs.writeFileSync(path.join(__dirname,'out','batch-bad-files.txt'),badFiles.join('\n'));
if(process.argv.includes('--sample-out')){for(const [f,t] of overlay){const d=path.join(ROOT,'tmp/phase34-feasibility/b14/sample-batch',rel(f));fs.mkdirSync(path.dirname(d),{recursive:true});fs.writeFileSync(d,t)}}
