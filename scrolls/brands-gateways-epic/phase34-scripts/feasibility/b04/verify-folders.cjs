// verify-sample on (whole-package production overlay) + a folder sample, checking only the folder sample's files
const fs=require('fs'),path=require('path'),cp=require('child_process');
const dir=process.argv[2];const files=[];
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).forEach(e=>{const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.tsx?$/.test(p))files.push(path.relative(dir,p))});
walk(dir);
const r=cp.spawnSync('node',['tmp/phase34/lib/verify-sample.cjs','tmp/phase34-feasibility/b04/sample-all',dir,'--no-exports-overlay','--check='+files.join(',')],{encoding:'utf8',maxBuffer:1<<28});
const out=(r.stdout||'')+(r.stderr||'');
fs.writeFileSync(process.argv[3],out);
console.log(out.split('\n').filter(l=>/typecheck:|files checked|NEW|NOT RESOLVED/.test(l)).join('\n'));
