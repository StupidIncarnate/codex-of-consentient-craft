# After `usage-sweep.py --apply`: every changed file must differ from HEAD on comment lines only, line count unchanged.
import subprocess,re,sys
cm=re.compile(r'^\s*(\*|//|/\*)')
files=subprocess.check_output(['git','diff','--name-only'],text=True).split()
bad=0
for f in files:
    if not f.endswith(('.ts','.tsx')): continue
    old=subprocess.check_output(['git','show','HEAD:'+f],text=True).split('\n'); new=open(f).read().split('\n')
    if len(old)!=len(new): print('LINE COUNT',f); bad+=1; continue
    for i,(a,b) in enumerate(zip(old,new),1):
        if a!=b and not (cm.match(a) and cm.match(b)): print('CODE LINE CHANGED',f,i); bad+=1
print('files checked',len(files),'violations',bad)
sys.exit(1 if bad else 0)
