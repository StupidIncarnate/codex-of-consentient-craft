import sys,glob,re
import os as _os
# Root: MIGRATE_ROOT or cwd. Scratch: MIGRATE_OUT or <root>/tmp (phase34-scripts/lib/port-config.cjs).
R=_os.path.join(_os.environ.get('MIGRATE_ROOT') or _os.getcwd(),'')
O=_os.path.join(_os.environ.get('MIGRATE_OUT') or R+'tmp','')
N=45
for a in sys.argv[1:]:
    pk,name=a.split(':')
    for f in sorted(glob.glob(R+f'packages/{pk}/src/contracts/{name}/{name}-contract.ts')):
        s=open(f).read(); s=re.sub(r'^/\*\*.*?\*/\n','',s,flags=re.S)
        t=s.split('\n')
        print('#####',f[len(R):],len(t)); print('\n'.join(t[:N]))
