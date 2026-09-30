// Classify every `Tsestree` type reference so a retype script knows the target: visitor key -> TSESTree.<Key>, else TSESTree.Node
const ts=require('typescript'),fs=require('fs');const C=require('../lib/port-config.cjs');const R=C.ROOT;const O=C.OUT+'/libcopy-census';fs.mkdirSync(O,{recursive:true});
const scan=JSON.parse(fs.readFileSync(O+'/scan.json','utf8')).files;
const AST=new Set(Object.keys(JSON.parse(fs.readFileSync(O+'/reqkeys.json','utf8'))));
const rows=[];
for(const [rel,rec] of Object.entries(scan)){
  if(!('Tsestree' in rec.imports))continue;
  const kind=/\.stub\.tsx?$/.test(rel)?'stub':/\.proxy\.tsx?$/.test(rel)?'proxy':/\.(test|spec)\.tsx?$/.test(rel)||rel.includes('/test/')?'test':'prod';
  const src=fs.readFileSync(R+'/'+rel,'utf8');const sf=ts.createSourceFile(rel,src,ts.ScriptTarget.Latest,true);
  const line=n=>sf.getLineAndCharacterOfPosition(n.getStart()).line+1;
  (function v(n){
    if(ts.isTypeReferenceNode(n)&&ts.isIdentifier(n.typeName)&&n.typeName.text==='Tsestree'){
      let cls='other',key=null;
      // climb through union / array / parens
      let p=n.parent,shape='plain';
      while(p&&(ts.isUnionTypeNode(p)||ts.isArrayTypeNode(p)||ts.isParenthesizedTypeNode(p)||ts.isTypeOperatorNode(p))){ if(ts.isArrayTypeNode(p))shape='array'; if(ts.isUnionTypeNode(p)&&shape==='plain')shape='nullable-union'; p=p.parent; }
      if(ts.isParameter(p)){
        const fn=p.parent; const holder=fn&&fn.parent;
        if(holder&&ts.isPropertyAssignment(holder)){const k=holder.name.getText().replace(/['"]/g,'');const base=k.split(':')[0];key=k; cls=AST.has(base)?'visitor-key':'visitor-selector';}
        else if(holder&&ts.isVariableDeclaration(holder)) cls='named-fn-param';
        else cls='param-other';
      } else if(ts.isPropertySignature(p)){ // in type literal e.g. {node: Tsestree}
        const tl=p.parent; const par=tl&&tl.parent;
        if(par&&ts.isParameter(par)) cls='destructured-param'; else cls='type-literal-field';
      } else if(ts.isFunctionTypeNode(p.parent||p)||ts.isFunctionLike(p)) cls='return-type';
      else if(ts.isTypeAliasDeclaration(p)) cls='alias';
      else if(ts.isTypeReferenceNode(p)) cls='generic-arg';
      rows.push({file:rel,line:line(n),kind,cls,key,shape});
    }
    ts.forEachChild(n,v);
  })(sf);
}
fs.writeFileSync(O+'/retype.json',JSON.stringify(rows));
const cnt=(f)=>rows.reduce((m,r)=>{const k=f(r);m[k]=(m[k]||0)+1;return m;},{});
console.log('refs',rows.length,JSON.stringify(cnt(r=>r.kind)));
console.log(JSON.stringify(cnt(r=>r.kind+':'+r.cls)));
console.log('visitor keys',JSON.stringify(Object.entries(cnt(r=>r.key)).filter(e=>e[0]!=='null').sort((a,b)=>b[1]-a[1]).slice(0,60)));
console.log('shapes',JSON.stringify(cnt(r=>r.shape)));
const perFile={};rows.filter(r=>r.kind==='prod').forEach(r=>{(perFile[r.file]=perFile[r.file]||new Set()).add(r.cls);});
const allVisitor=Object.entries(perFile).filter(([f,s])=>[...s].every(c=>c==='visitor-key'||c==='visitor-selector')).length;
console.log('prod files',Object.keys(perFile).length,'files where every ref is visitor-keyed',allVisitor);
