// standalone scalar brand contracts and how many files touch them
const fs=require('fs'),path=require('path');const lib=require('../../lib/repo.cjs');const {ts,ROOT,rel}=lib;
const ws=lib.workspaces();
const scalars=[];
for(const w of ws){ if(w.isGateway)continue;
 for(const f of lib.walk(path.join(w.dir,'src'))){ if(!/-contract\.ts$/.test(f))continue;
  const sf=lib.parse(f);
  for(const st of sf.statements){ if(!ts.isVariableStatement(st))continue;
   for(const d of st.declarationList.declarations){ if(!ts.isIdentifier(d.name)||!d.initializer)continue;
    const t=d.initializer.getText(sf); if(!/\.brand</.test(t)||/z\.object|z\.array|z\.record|z\.enum|z\.union|z\.discriminated|z\.tuple|z\.literal/.test(t))continue;
    if(!/^z\s*\.\s*(string|number)\(/.test(t.replace(/\s+/g,' ')))continue;
    const kind=/^z\s*\.\s*number/.test(t)?'number':'string';
    // type name
    let tname=null;for(const s2 of sf.statements)if(ts.isTypeAliasDeclaration(s2)&&s2.type.getText(sf).includes(`typeof ${d.name.text}`))tname=s2.name.text;
    scalars.push({name:d.name.text,type:tname,kind,file:f,pkg:w.name,init:t.replace(/\s+/g,' ')});
 }}}}
// usage counts
const all=[];for(const w of ws){if(w.isGateway)continue;for(const d of ['src','test','e2e'])for(const f of lib.walk(path.join(w.dir,d)))all.push(f)}
const texts=new Map(all.map(f=>[f,fs.readFileSync(f,'utf8')]));
for(const s of scalars){const re=new RegExp(`\\b(${s.name}|${s.type}|${s.type}Stub)\\b`);s.files=all.filter(f=>f!==s.file&&re.test(texts.get(f))&&!f.startsWith(path.dirname(s.file)+'/')||false);}
scalars.sort((a,b)=>a.files.length-b.files.length);
console.log('standalone scalar brands',scalars.length);
const buckets={0:0,'1-3':0,'4-10':0,'11-40':0,'41+':0};scalars.forEach(s=>{const n=s.files.length;buckets[n===0?0:n<=3?'1-3':n<=10?'4-10':n<=40?'11-40':'41+']++});console.log(buckets);
for(const s of scalars.filter(s=>s.files.length>=3&&s.files.length<=6).slice(0,8))console.log('small',s.files.length,s.name,s.type,s.kind,rel(s.file));
for(const s of scalars.filter(s=>s.files.length>=20&&s.files.length<=45).slice(0,8))console.log('medium',s.files.length,s.name,s.type,s.kind,s.init.slice(0,70));
fs.writeFileSync(path.join(lib.workDir(__dirname),'out-scalars.json'),JSON.stringify(scalars.map(s=>({...s,file:rel(s.file),files:s.files.map(rel)})),null,1));
