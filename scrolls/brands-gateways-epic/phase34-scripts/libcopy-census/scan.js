// Walk every packages/* (not @gateway) ts/tsx file; record per-file: import specifiers (name->module), call counts by identifier name,
// identifier references, casts (as X, as unknown as X), interface/type declarations, z.custom<T>
const ts=require('typescript'),fs=require('fs'),path=require('path');
const C=require('../lib/port-config.cjs');const R=C.ROOT;const O=C.OUT+'/libcopy-census';fs.mkdirSync(O,{recursive:true});
const out={files:{}};
function walk(d,cb){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['node_modules','dist','.git','coverage'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p,cb);else if(/\.(ts|tsx)$/.test(e.name)&&!e.name.endsWith('.d.ts'))cb(p);}}
for(const pk of fs.readdirSync(R+'/packages')){ if('packages/'+pk===C.GATEWAY_DIR)continue; const pd=R+'/packages/'+pk; if(!fs.statSync(pd).isDirectory())continue; walk(pd,f=>{
  const rel=path.relative(R,f); const src=fs.readFileSync(f,'utf8'); const sf=ts.createSourceFile(f,src,ts.ScriptTarget.Latest,true,f.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const rec={imports:{},calls:{},refs:{},decls:[],casts:[],customs:[],lines:src.split('\n').length};
  const lc=n=>sf.getLineAndCharacterOfPosition(n.getStart()).line+1;
  (function v(n){
    if(ts.isImportDeclaration(n)&&n.importClause){const m=n.moduleSpecifier.text;const c=n.importClause;if(c.name)rec.imports[c.name.text]=m;if(c.namedBindings){if(ts.isNamedImports(c.namedBindings))for(const e of c.namedBindings.elements)rec.imports[(e.propertyName||e.name).text]=m;else rec.imports[c.namedBindings.name.text]=m;}}
    if(ts.isCallExpression(n)&&ts.isIdentifier(n.expression)){rec.calls[n.expression.text]=(rec.calls[n.expression.text]||0)+1;}
    if(ts.isInterfaceDeclaration(n)||ts.isTypeAliasDeclaration(n)){const ex=!!(n.modifiers&&n.modifiers.some(m=>m.kind===ts.SyntaxKind.ExportKeyword));rec.decls.push({name:n.name.text,kind:ts.isInterfaceDeclaration(n)?'interface':'type',exported:ex,line:lc(n),text:n.getText().slice(0,400),members:ts.isInterfaceDeclaration(n)?n.members.map(m=>m.name?m.name.getText():'?'):(ts.isTypeLiteralNode(n.type)?n.type.members.map(m=>m.name?m.name.getText():'?'):null)});}
    if(ts.isAsExpression(n)){rec.casts.push({line:lc(n),text:n.getText().slice(0,160),type:n.type.getText().slice(0,120)});}
    if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&n.expression.name.text==='custom'&&n.typeArguments){rec.customs.push({line:lc(n),text:n.getText().slice(0,160)});}
    ts.forEachChild(n,v);
  })(sf);
  out.files[rel]=rec;
});}
fs.writeFileSync(O+'/scan.json',JSON.stringify(out));
console.log(Object.keys(out.files).length);
