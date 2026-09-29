// B13: owner index (object contracts with a `z.infer` type) + camelCase-word-boundary name matcher.
const fs=require('fs'),path=require('path');
const lib=require('../../phase34/lib/repo.cjs');const {ts,ROOT,rel}=lib;
const words=s=>s.replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g,'$1 $2').split(' ').map(x=>x.toLowerCase());
const ws=lib.workspaces();
// find z.object( literal at the root of a call chain
const rootObject=(e)=>{let cur=e;for(;;){if(ts.isCallExpression(cur)){if(ts.isPropertyAccessExpression(cur.expression)){ if(cur.expression.name.text==='object'&&cur.expression.expression.getText()==='z')return cur; cur=cur.expression.expression;continue;} return null;} if(ts.isPropertyAccessExpression(cur)){cur=cur.expression;continue}return null}};
const buildIndex=()=>{
  const owners=[];
  for(const w of ws){ if(w.isGateway) continue;
    for(const f of lib.walk(path.join(w.dir,'src'))){
      if(!/-contract\.ts$/.test(f)) continue;
      const sf=lib.parse(f);const decl={};
      for(const st of sf.statements){
        if(ts.isVariableStatement(st)&&st.declarationList.declarations.length===1){const d=st.declarationList.declarations[0];if(ts.isIdentifier(d.name)&&d.initializer){const o=rootObject(d.initializer);if(o&&o.arguments[0]&&ts.isObjectLiteralExpression(o.arguments[0])){decl[d.name.text]={keys:o.arguments[0].properties.map(p=>p.name?.getText()).filter(Boolean),exported:!!(ts.getCombinedModifierFlags(d)&ts.ModifierFlags.Export)}}}}
      }
      for(const st of sf.statements){
        if(ts.isTypeAliasDeclaration(st)&&st.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)&&ts.isTypeReferenceNode(st.type)&&/z\.(infer|output)$/.test(st.type.typeName.getText())){
          const a=st.type.typeArguments?.[0];if(a&&ts.isTypeQueryNode(a)){const c=decl[a.exprName.getText()];if(c)owners.push({owner:st.name.text,contractConst:a.exprName.getText(),keys:c.keys,file:f,pkg:w.name,words:words(st.name.text)})}
        }
      }
    }
  }
  return owners;
};
module.exports={buildIndex,words,ws};
if(require.main===module){const o=buildIndex();console.log(o.length,'owners');const names={};o.forEach(x=>{names[x.owner]=(names[x.owner]||0)+1});console.log('dupe owner names',Object.entries(names).filter(e=>e[1]>1));console.log(o.slice(0,5).map(x=>x.owner+':'+x.keys.join(',')))}
