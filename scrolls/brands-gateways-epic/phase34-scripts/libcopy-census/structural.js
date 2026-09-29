// Inline / declared structural shapes that look like library shapes: type literals & interfaces with >=2 keys drawn from lib key families
const ts=require('typescript'),fs=require('fs');const R=process.cwd();
const scan=JSON.parse(fs.readFileSync(R+'/tmp/libcopy-census/scan.json','utf8')).files;
const FAM={
 ast:['type','name','callee','parent','body','range','loc','arguments','params','id','init','object','property','expression','declaration','source','specifiers','value','key','computed'],
 childproc:['pid','stdout','stderr','stdin','kill','on','once','exitCode','signalCode','killed'],
 fsstats:['isFile','isDirectory','isSymbolicLink','size','mtimeMs','mtime','birthtimeMs'],
 timer:['hasRef','unref','ref','refresh'],
 ws:['send','close','readyState','terminate','addEventListener','onmessage'],
 http:['status','statusText','headers','ok','json','text','url'],
 eslintctx:['report','getFilename','getSourceCode','sourceCode','getScope','options','filename'],
 zoderr:['issues','path','message'],
 nodeerr:['code','errno','syscall','path'],
};
const out=[];
for(const [rel,rec] of Object.entries(scan)){
  if(/\.(test|stub)\.tsx?$/.test(rel)||rel.includes('/contracts/'))continue; // production+proxy only; contracts handled separately
  const src=fs.readFileSync(R+'/'+rel,'utf8');
  const sf=ts.createSourceFile(rel,src,ts.ScriptTarget.Latest,true,rel.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  (function v(n){
    let members=null,kind=null,name=null;
    if(ts.isTypeLiteralNode(n)){members=n.members;kind='typeLiteral';}
    else if(ts.isInterfaceDeclaration(n)){members=n.members;kind='interface';name=n.name.text;}
    if(members&&members.length>=2){
      const keys=members.map(m=>m.name?m.name.getText().replace(/['"]/g,''):null).filter(Boolean);
      for(const [fam,ks] of Object.entries(FAM)){
        const hit=keys.filter(k=>ks.includes(k));
        const need=fam==='ast'?3:fam==='zoderr'?2:2;
        if(hit.length>=need&&hit.length>=Math.ceil(keys.length/2)){out.push({file:rel,line:sf.getLineAndCharacterOfPosition(n.getStart()).line+1,kind,name,fam,keys:keys.slice(0,8)});break;}
      }
    }
    ts.forEachChild(n,v);
  })(sf);
}
fs.writeFileSync(R+'/tmp/libcopy-census/structural.json',JSON.stringify(out));
const by={};out.forEach(o=>{const k=o.file.split('/')[1]+' / '+o.fam;by[k]=(by[k]||0)+1;});
console.log(JSON.stringify(by,null,1));
out.filter(o=>['ast','childproc','fsstats','timer','ws','eslintctx','zoderr'].includes(o.fam)).slice(0,60).forEach(o=>console.log(o.file.replace('packages/',''),o.line,o.kind,o.name||'',o.fam,o.keys.join(',')));
