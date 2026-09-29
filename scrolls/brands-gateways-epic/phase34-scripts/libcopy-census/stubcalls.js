// Usage: node stubcalls.js <StubName> ... ; for each outermost call of the stub in packages/* (not @gateway), record arg shape.
const ts=require('typescript'),fs=require('fs'),path=require('path');
const R=process.cwd();
const names=process.argv.slice(2);
const scan=JSON.parse(fs.readFileSync(R+'/tmp/libcopy-census/scan.json','utf8')).files;
const out={};
for(const n of names)out[n]=[];
for(const [rel,rec] of Object.entries(scan)){
  if(!names.some(n=>rec.calls[n]&&!(rec.imports[n]||'').startsWith('#gateway')))continue;
  const src=fs.readFileSync(R+'/'+rel,'utf8');
  const sf=ts.createSourceFile(rel,src,ts.ScriptTarget.Latest,true,rel.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const kind=rel.endsWith('.stub.ts')?'stub':/\.proxy\.tsx?$/.test(rel)?'proxy':/\.(test|spec)\.tsx?$/.test(rel)||rel.includes('/test/')?'test':'prod';
  const nodeTypeOf=(o)=>{for(const p of o.properties){if(ts.isPropertyAssignment(p)&&p.name.getText()==='type'){const t=p.initializer.getText();return t.replace(/^.*\./,'').replace(/['"]/g,'');}}return null;};
  const describe=(call,depth,inner)=>{ // returns {keys:[], types:[], flags:Set}
    const info={keys:[],types:[],flags:new Set(),nested:0};
    const arg=call.arguments[0];
    if(!arg){info.flags.add('noargs');return info;}
    if(!ts.isObjectLiteralExpression(arg)){info.flags.add('nonliteral-arg');return info;}
    const t=nodeTypeOf(arg); info.types.push(t||'(default Identifier)');
    for(const p of arg.properties){
      if(ts.isSpreadAssignment(p)){info.flags.add('spread');continue;}
      const k=p.name?p.name.getText():'?'; info.keys.push(k);
      const walk=(e)=>{ // find nested stub calls in value
        (function w(x){ if(ts.isCallExpression(x)&&ts.isIdentifier(x.expression)&&x.expression.text===stubName){const d=describe(x,depth+1,true);info.keys.push(...d.keys.map(z=>'>'+z));info.types.push(...d.types);d.flags.forEach(f=>info.flags.add(f));info.nested++;return;} ts.forEachChild(x,w);})(e);
      };
      if(ts.isPropertyAssignment(p)) walk(p.initializer);
    }
    return info;
  };
  let stubName;
  for(const n of names){ if(!rec.calls[n]||(rec.imports[n]||'').startsWith('#gateway'))continue; stubName=n;
    (function v(node,inside){
      if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text===n){
        if(!inside){ const d=describe(node,0,false); out[n].push({file:rel,line:sf.getLineAndCharacterOfPosition(node.getStart()).line+1,kind,keys:d.keys,types:d.types,flags:[...d.flags],nested:d.nested,text:node.getText().slice(0,300)}); }
        // still visit children for non-stub content but mark inside for nested stub calls
        ts.forEachChild(node,c=>v(c,true)); return;
      }
      ts.forEachChild(node,c=>v(c,inside));
    })(sf,false);
  }
}
fs.writeFileSync(R+'/tmp/libcopy-census/stubcalls-all.json',JSON.stringify(out));
for(const n of names){const a=out[n];const kc={};a.forEach(c=>c.keys.forEach(k=>kc[k]=(kc[k]||0)+1));console.log(n,'outer calls',a.length,'by kind',JSON.stringify(a.reduce((m,c)=>(m[c.kind]=(m[c.kind]||0)+1,m),{})));console.log(' keys',JSON.stringify(Object.entries(kc).sort((x,y)=>y[1]-x[1])));console.log(' flags',JSON.stringify(a.reduce((m,c)=>(c.flags.forEach(f=>m[f]=(m[f]||0)+1),m),{})));}
