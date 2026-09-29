const ts=require('typescript'),fs=require('fs');
const R=process.cwd();
const req=JSON.parse(fs.readFileSync(R+'/tmp/libcopy-census/reqkeys.json','utf8'));
const scan=JSON.parse(fs.readFileSync(R+'/tmp/libcopy-census/scan.json','utf8')).files;
const GW=new Set(['Identifier','CallExpression','MemberExpression','Program','ArrowFunctionExpression','Literal','Property','ObjectExpression','BlockStatement','ExpressionStatement','VariableDeclaration','ReturnStatement','JSXElement','JSXFragment']);
const STUB='TsestreeStub';
const out=[];
const skip=new Set(['type','parent','range','loc']);
for(const [rel,rec] of Object.entries(scan)){
  if(!rec.calls[STUB])continue;
  const src=fs.readFileSync(R+'/'+rel,'utf8');
  const sf=ts.createSourceFile(rel,src,ts.ScriptTarget.Latest,true);
  const kind=/\.proxy\.tsx?$/.test(rel)?'proxy':/\.(test|spec)\.tsx?$/.test(rel)||rel.includes('/test/')?'test':rel.endsWith('.stub.ts')?'stub':'prod';
  const lineOf=n=>sf.getLineAndCharacterOfPosition(n.getStart()).line+1;
  const isStub=n=>ts.isCallExpression(n)&&ts.isIdentifier(n.expression)&&n.expression.text===STUB;
  const collect=(call,acc)=>{ // acc: {nodes:[],flags:Set}
    const arg=call.arguments[0];
    if(!arg){acc.nodes.push({type:'Identifier',keys:[],dflt:true,line:lineOf(call)});return;}
    if(!ts.isObjectLiteralExpression(arg)){acc.flags.add('nonliteral-arg');return;}
    let type='Identifier';const keys=[];let parentVal=null;
    for(const p of arg.properties){
      if(ts.isSpreadAssignment(p)){acc.flags.add('spread');continue;}
      const k=p.name?p.name.getText().replace(/['"]/g,''):'?';
      if(k==='type'&&ts.isPropertyAssignment(p)){type=p.initializer.getText().replace(/^.*\./,'').replace(/['"]/g,'');continue;}
      if(k==='parent'&&ts.isPropertyAssignment(p)){parentVal=p.initializer.getText();  if(parentVal!=='null'){acc.flags.add('parent-supplied');} }
      keys.push(k);
      if(ts.isPropertyAssignment(p)){(function w(x){ if(isStub(x)){collect(x,acc);return;} ts.forEachChild(x,w);})(p.initializer);}
      else if(ts.isShorthandPropertyAssignment(p)) {}
    }
    acc.nodes.push({type,keys,line:lineOf(call)});
  };
  (function v(n,inside){
    if(isStub(n)){
      if(!inside){const acc={nodes:[],flags:new Set()};collect(n,acc);
        const missing=[],unknown=[],defaulted=[];
        for(const nd of acc.nodes){const props=req[nd.type]; if(!props){acc.flags.add('unknown-type:'+nd.type);continue;}
          for(const k of nd.keys){ if(skip.has(k))continue; if(!(k in props)) unknown.push(nd.type+'.'+k);}
          for(const [k,d] of Object.entries(props)){ if(skip.has(k))continue; const essential=!d.optional&&!d.array&&!d.nullable&&!d.bool&&!/undefined/.test(d.type)&&k!=='decorators'; if(!essential||nd.keys.includes(k))continue; const scalar=/^(ExportAndImportKind|ValueOf<[A-Za-z]+>|ImportKind|ExportKind|string|number|bigint|boolean|null|undefined|RegExp|'[^']*'|"[^"]*"|\||\s)+$/.test(d.type); const key=nd.type+'.'+k; if(key==='Identifier.name'){defaulted.push(key);continue;} if(k==='body'&&/^(ArrowFunctionExpression|FunctionDeclaration|FunctionExpression|ClassDeclaration|ClassExpression)$/.test(nd.type)){defaulted.push(key);continue;} if(scalar&&key!=='Literal.value')continue; missing.push(key);} }
        const root=acc.nodes[acc.nodes.length-1]; // collect pushes children first, root last
        let cls='PRINT';
        const flags=[...acc.flags];
        if(acc.flags.has('spread')||acc.flags.has('nonliteral-arg')||[...acc.flags].some(f=>f.startsWith('unknown-type')))cls='HAND';
        else if(missing.length||unknown.length||acc.flags.has('parent-supplied'))cls='HAND';
        else if(!acc.nodes.some(nd=>nd.keys.length)&&acc.nodes.length===1&&acc.nodes[0].dflt)cls='MAP';
        out.push({nodeKeys:acc.nodes.map(n=>[n.type,n.keys]),defaulted,file:rel,line:lineOf(n),kind,cls,rootType:root?root.type:null,nodes:acc.nodes.length,types:[...new Set(acc.nodes.map(x=>x.type))],missing,unknown,flags});
      }
      ts.forEachChild(n,c=>v(c,true));return;}
    ts.forEachChild(n,c=>v(c,inside));
  })(sf,false);
}
fs.writeFileSync(R+'/tmp/libcopy-census/tsestree-classify.json',JSON.stringify(out,null,0));
const only=(c,pred)=>c.cls==='HAND'&&pred;
console.log('HAND solely parent-supplied',out.filter(c=>c.cls==='HAND'&&c.flags.length===1&&c.flags[0]==='parent-supplied'&&!c.missing.length&&!c.unknown.length).length);
console.log('HAND with missing/unknown structural',out.filter(c=>c.cls==='HAND'&&(c.missing.length||c.unknown.length)).length);
console.log('PRINT with defaulted fields',out.filter(c=>c.cls==='PRINT'&&c.defaulted.length).length);
fs.writeFileSync(R+'/tmp/libcopy-census/tsestree-hand-sites.txt',out.filter(c=>c.cls==='HAND').map(c=>c.file+':'+c.line+'  root='+c.rootType+'  '+[...c.missing.map(x=>'missing '+x),...c.unknown.map(x=>'unknown '+x),...c.flags].join('; ')).join('\n'));
const cnt=(f)=>out.reduce((m,c)=>{const k=f(c);m[k]=(m[k]||0)+1;return m;},{});
console.log('outer',out.length,JSON.stringify(cnt(c=>c.cls)));
console.log('root types',JSON.stringify(Object.entries(cnt(c=>c.rootType)).sort((a,b)=>b[1]-a[1])));
console.log('root with gateway stub',out.filter(c=>GW.has(c.rootType)).length,'without',out.filter(c=>!GW.has(c.rootType)).length);
const nt=cnt(c=>c.types.join('|'));
const allTypes={};out.forEach(c=>c.types.forEach(t=>allTypes[t]=(allTypes[t]||0)+1));
console.log('node types used (calls containing)',JSON.stringify(Object.entries(allTypes).sort((a,b)=>b[1]-a[1])));
const hm={};out.filter(c=>c.cls==='HAND').forEach(c=>{const rs=[...c.missing.map(x=>'missing '+x),...c.unknown.map(x=>'unknown '+x),...c.flags.map(f=>'flag '+f)];rs.forEach(r=>hm[r]=(hm[r]||0)+1);});
console.log('HAND reasons',JSON.stringify(Object.entries(hm).sort((a,b)=>b[1]-a[1]).slice(0,60)));
console.log('by file class',JSON.stringify(cnt(c=>c.kind)));
