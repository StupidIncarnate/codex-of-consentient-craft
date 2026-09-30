// Dead re-parses: `xContract.parse(arg)` where the checker says arg is already assignable to the parse's own result type.
// Counts them, rewrites them to `arg` on an overlay (production files), and typechecks the touched packages.
// Usage: node .../dead-reparse.cjs [--pkgs=a,b] [--sample-out=dir]
const fs=require('fs'),path=require('path');const lib=require('../../lib/repo.cjs');const {ts,ROOT,rel}=lib;
const arg=n=>process.argv.find(a=>a.startsWith(`--${n}=`))?.slice(n.length+3);const only=arg('pkgs')?.split(',');
const ws=lib.workspaces();
const res={sites:0,dead:0,deadProd:0,deadTest:0,byContract:{},scalarDead:0,objectDead:0,files:new Set()};
const overlay=new Map();const perPkg={};
for(const w of ws){ if(w.isGateway||(only&&!only.includes(w.short)))continue;
  const svc=lib.makeLanguageService(w.dir,new Map());const program=svc.service.getProgram();const checker=program.getTypeChecker();
  const files=svc.fileNames.filter(f=>!f.includes('/dist/'));let pk={sites:0,dead:0};
  for(const f of files){ const sf=program.getSourceFile(f); if(!sf)continue; const isTest=lib.isTestSupport(f);
    const edits=[];
    const visit=n=>{
      if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&n.expression.name.text==='parse'&&ts.isIdentifier(n.expression.expression)&&/Contract$/.test(n.expression.expression.text)&&n.arguments.length===1){
        res.sites++;pk.sites++;
        const a=n.arguments[0];const at=checker.getTypeAtLocation(a);const rt=checker.getTypeAtLocation(n);
        if(!(at.flags&(ts.TypeFlags.Any|ts.TypeFlags.Unknown|ts.TypeFlags.Never))&&!(rt.flags&(ts.TypeFlags.Any|ts.TypeFlags.Unknown))&&checker.isTypeAssignableTo(at,rt)){
          res.dead++;pk.dead++;if(isTest)res.deadTest++;else res.deadProd++;
          const nm=n.expression.expression.text;res.byContract[nm]=(res.byContract[nm]||0)+1;
          const isObj=(rt.flags&ts.TypeFlags.Object)!==0&&!(rt.isIntersection&&rt.isIntersection()&&rt.types.some(t=>t.flags&(ts.TypeFlags.StringLike|ts.TypeFlags.NumberLike)));
          if(isObj)res.objectDead++;else res.scalarDead++;
          res.files.add(f);
          if(!isTest){const t=a.getText(sf);const needP=ts.isBinaryExpression(a)||ts.isConditionalExpression(a)||ts.isAsExpression(a)||ts.isArrowFunction(a)||ts.isAwaitExpression(a)||ts.isSpreadElement(a);edits.push({start:n.getStart(sf),end:n.end,text:needP?`(${t})`:t})}
        }
      }
      ts.forEachChild(n,visit)};
    visit(sf);
    if(edits.length){ // nested dead parses: drop containers, second pass would redo
      const flat=edits.filter(e=>!edits.some(o=>o!==e&&o.start>=e.start&&o.end<=e.end));
      let text=fs.readFileSync(f,'utf8');text=lib.applyEdits(text,flat);
      // drop imports that became unused
      const sf2=lib.parse(f,text);const drop=[];
      for(const st of sf2.statements){ if(!ts.isImportDeclaration(st)||!st.importClause?.namedBindings||!ts.isNamedImports(st.importClause.namedBindings)||st.importClause.name)continue;
        const els=st.importClause.namedBindings.elements;const used=nm=>{let hit=false;const v=x=>{if(hit||ts.isImportDeclaration(x))return;if(ts.isIdentifier(x)&&x.text===nm)hit=true;ts.forEachChild(x,v)};sf2.statements.forEach(v);return hit};
        const keep=els.filter(e=>used(e.name.text)||!/Contract$/.test(e.name.text));
        if(keep.length===els.length)continue;
        if(!keep.length){const le=text.indexOf('\n',st.end);drop.push({start:st.getStart(sf2),end:le===-1?st.end:le+1,text:''})}else drop.push({start:st.getStart(sf2),end:st.end,text:`import${st.importClause.isTypeOnly?' type':''} { ${keep.map(e=>e.getText(sf2)).join(', ')} } from ${st.moduleSpecifier.getText(sf2)};`});}
      overlay.set(f,lib.applyEdits(text,drop));
    }
  }
  perPkg[w.short]=pk;console.error(w.short,pk);
}
const out={...res,files:res.files.size,byContract:Object.entries(res.byContract).sort((a,b)=>b[1]-a[1]).slice(0,12)};
console.log(JSON.stringify(out));
// verify: touched packages, whole package
const keyOf=d=>`${d.code}:${ts.flattenDiagnosticMessageText(d.messageText,' ')}`;
const by={};for(const f of overlay.keys())(by[lib.workspaceOf(f,ws).name]??=[]).push(f);
let newD=0,clean=0;const bad=[];
for(const [pn,fl] of Object.entries(by)){const w=ws.find(x=>x.name===pn);const options=lib.packageCompilerOptions(w.dir);const pf=lib.walk(w.dir).filter(f=>!f.includes('/dist/'));
  const base=lib.diagnosticsWithOverlay(pf,new Map(),options).diagnostics;const aft=lib.diagnosticsWithOverlay(pf,overlay,options).diagnostics;
  for(const f of pf){const bk=new Set((base.get(f)??[]).map(keyOf));const add=(aft.get(f)??[]).filter(d=>!bk.has(keyOf(d)));if(overlay.has(f)&&!add.length)clean++;if(add.length){newD+=add.length;bad.push([rel(f),...add.slice(0,2).map(d=>lib.formatDiagnostic(d).slice(0,220))])}}
  console.error('verified',pn)}
console.log(JSON.stringify({prodFilesRewritten:overlay.size,zeroNewDiagnosticsFiles:clean,newDiagnostics:newD}));bad.slice(0,8).forEach(b=>console.log(b.join('\n   ')));
const so=arg('sample-out');if(so)for(const [f,t] of overlay){const d=path.join(ROOT,so,rel(f));fs.mkdirSync(path.dirname(d),{recursive:true});fs.writeFileSync(d,t)}
