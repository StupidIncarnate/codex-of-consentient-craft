import sys,glob,re
R='/home/brutus-home/projects/codex-of-consentient-craft/worktrees/gateway-pivot/'
N=45
for a in sys.argv[1:]:
    pk,name=a.split(':')
    for f in sorted(glob.glob(R+f'packages/{pk}/src/contracts/{name}/{name}-contract.ts')):
        s=open(f).read(); s=re.sub(r'^/\*\*.*?\*/\n','',s,flags=re.S)
        t=s.split('\n')
        print('#####',f[len(R):],len(t)); print('\n'.join(t[:N]))
