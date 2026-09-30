const ts=require('typescript'),path=require('path'),fs=require('fs');
const C=require('../lib/port-config.cjs');const R=C.ROOT;const O=C.OUT+'/libcopy-census';fs.mkdirSync(O,{recursive:true});
const file=R+'/tmp/libcopy-census/probe/probe.ts' /* under the root, not <out>: its imports resolve through the root's node_modules */;
const prog=ts.createProgram([file],{strict:true,moduleResolution:ts.ModuleResolutionKind.Node16,module:ts.ModuleKind.Node16,target:ts.ScriptTarget.ES2022,skipLibCheck:true,noEmit:true,types:[]});
const chk=prog.getTypeChecker();
const sf=prog.getSourceFile(file);
const alias=sf.statements.find(s=>ts.isTypeAliasDeclaration(s));
const T=chk.getTypeFromTypeNode(alias.type);
const members=T.isUnion()?T.types:[T];
const out={};
const base=new Set(['type','loc','range','parent']);
for(const m of members){
  const typeProp=m.getProperty('type'); if(!typeProp)continue;
  const tt=chk.getTypeOfSymbolAtLocation(typeProp,sf);
  const tname=tt.isStringLiteral()?tt.value:(tt.symbol&&tt.symbol.name)||chk.typeToString(tt);
  const t=(tt.flags&ts.TypeFlags.EnumLiteral)? chk.typeToString(tt).replace(/^AST_NODE_TYPES\./,''):tname;
  const props={};
  for(const p of chk.getPropertiesOfType(m)){ if(base.has(p.name))continue;
    const pt=chk.getTypeOfSymbolAtLocation(p,sf); const optional=!!(p.flags&ts.SymbolFlags.Optional);
    const s=chk.typeToString(pt);
    props[p.name]={optional,nullable:/\bnull\b/.test(s),array:chk.isArrayType(pt)||/\[\]$/.test(s),bool:/boolean|true|false/.test(s)&&!/\|\s*[A-Z]/.test(s),type:s.slice(0,80)};
  }
  out[t]=props;
}
fs.writeFileSync(O+'/reqkeys.json',JSON.stringify(out,null,1));
console.log(Object.keys(out).length,'node types');
console.log(JSON.stringify(out.CallExpression),JSON.stringify(out.Identifier));
