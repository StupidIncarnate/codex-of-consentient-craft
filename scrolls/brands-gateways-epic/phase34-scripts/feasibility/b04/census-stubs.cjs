const fs=require('fs'),path=require('path');const lib=require('../../phase34/lib/repo.cjs');const {ts,ROOT,rel}=lib;
const files=[...lib.walk(path.join(ROOT,'packages/eslint-plugin')),...lib.walk(path.join(ROOT,'packages/local-eslint'))].filter(f=>/Tsestree|EslintContextStub/.test(fs.readFileSync(f,'utf8')));
const types={},ctxKeys={},nodeKeys={};let roots=0,nested=0,ctx=0,ctxShapes={};
for(const f of files){const sf=lib.parse(f);
 const visit=(n,inStub)=>{
  if(ts.isCallExpression(n)&&ts.isIdentifier(n.expression)){
   const nm=n.expression.text;
   if(nm==='TsestreeStub'){ if(inStub)nested++; else roots++;
     const a=n.arguments[0]; if(a&&ts.isObjectLiteralExpression(a)) for(const p of a.properties){const k=p.name?.getText(sf)??'...';nodeKeys[k]=(nodeKeys[k]||0)+1; if(k==='type'&&ts.isPropertyAssignment(p)){const t=p.initializer.getText(sf).replace('TsestreeNodeType.','');types[t]=(types[t]||0)+1}}
     n.arguments.forEach(x=>visit(x,true));return;}
   if(nm==='EslintContextStub'){ctx++;const a=n.arguments[0];if(a&&ts.isObjectLiteralExpression(a)){const ks=a.properties.map(p=>p.name?.getText(sf)??'...').sort().join(',');ctxShapes[ks]=(ctxShapes[ks]||0)+1;for(const p of a.properties){const k=p.name?.getText(sf)??'...';ctxKeys[k]=(ctxKeys[k]||0)+1}}else ctxShapes['<none>']=(ctxShapes['<none>']||0)+1}
  }
  ts.forEachChild(n,c=>visit(c,inStub));};
 visit(sf,false);}
const top=(o,n=30)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n);
console.log({files:files.length,roots,nested,ctx});
console.log('TYPES',top(types,45).map(e=>e.join(':')).join(' '));
console.log('NODEKEYS',top(nodeKeys,40).map(e=>e.join(':')).join(' '));
console.log('CTXKEYS',top(ctxKeys).map(e=>e.join(':')).join(' '));
console.log('CTXSHAPES',top(ctxShapes,15).map(e=>e.join(' => ')).join('\n'));
