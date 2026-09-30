#!/usr/bin/env python3
"""Z10 comment sweep. DRY RUN by default: writes tmp/z-plan/usage-sweep.diff and a hand-queue, touches no source.
--apply rewrites comment lines only (asserts every changed line still starts with *, // or /*).
Scope: comment lines naming a *Contract / *Stub that nothing exports and whose deleted source (tmp/deletions) was a scalar brand."""
import os,re,sys,difflib,collections,json
APPLY='--apply' in sys.argv
skip=('node_modules','dist','.git','.ward','tmp')
def walk(base):
    for root,d,fs in os.walk(base):
        d[:]=[x for x in d if x not in skip]
        for f in fs:
            if f.endswith(('.ts','.tsx')): yield os.path.join(root,f)
files=list(walk('packages'))
texts={p:open(p,errors='ignore').read() for p in files}
exp=set()
for t in texts.values():
    exp.update(re.findall(r'export (?:const|function|type) (\w+)',t))
# scalar brands deleted: name -> default literal
scalar={}; default={}
for root,d,fs in os.walk('tmp/deletions'):
    for f in fs:
        p=os.path.join(root,f)
        if f.endswith('-contract.ts') and 'packages/' in p:
            t=open(p,errors='ignore').read()
            m=re.search(r'export const (\w+Contract)\s*=\s*(z\.(?:string|number|enum|coerce|literal)[\s\S]*?\.brand<)',t)
            if m and 'z.object' not in t.split('.brand<')[0]: scalar[m.group(1)]=True
        if f.endswith('.stub.ts') and 'packages/' in p:
            t=open(p,errors='ignore').read()
            m=re.search(r'export const (\w+Stub)\s*=',t); d2=re.search(r"value:\s*('[^']*'|\"[^\"]*\"|[\d_]+)\s*,?\s*\}\s*\)?\s*[,:=]",t)
            if m and m.group(1) not in default and d2: default[m.group(1)]=d2.group(1)
def balanced(s,i):          # s[i]=='(' -> index after matching ')', or -1
    depth=0; q=None
    for j in range(i,len(s)):
        c=s[j]
        if q:
            if c=='\\': continue
            if c==q: q=None
            continue
        if c in '\'"`': q=c
        elif c=='(' : depth+=1
        elif c==')':
            depth-=1
            if depth==0: return j+1
    return -1
cm=re.compile(r'^(\s*)(\*|//|/\*)')
pc=re.compile(r'\b([a-z][A-Za-z0-9]*Contract)\.parse\(')
st=re.compile(r'\b([A-Z][A-Za-z0-9]*Stub)\(')
def live(n): return n in exp
def fix(line,hand):
    out=line
    for m in list(pc.finditer(line))[::-1]:
        n=m.group(1)
        if live(n) or n not in scalar: 
            if not live(n): hand.append(('unknown-contract',n)); 
            continue
        e=balanced(out,m.end()-1)
        if e<0: hand.append(('multiline',n)); continue
        arg=out[m.end():e-1].strip()
        if not arg: continue
        out=out[:m.start()]+arg+out[e:]
    for m in list(st.finditer(out))[::-1]:
        n=m.group(1)
        if live(n): continue
        e=balanced(out,m.end()-1)
        if e<0: hand.append(('multiline',n)); continue
        arg=out[m.end():e-1].strip()
        if arg in('','{}'):
            if n in default: out=out[:m.start()]+default[n]+out[e:]
            else: hand.append(('no-default',n))
        else:
            mm=re.fullmatch(r'\{\s*value:\s*(.+?)\s*,?\s*\}',arg,re.S)
            if mm: out=out[:m.start()]+mm.group(1)+out[e:]
            else: hand.append(('extra-keys',n))
    # prose mentions left behind
    for n in set(re.findall(r'\b([a-z][A-Za-z0-9]*Contract|[A-Z][A-Za-z0-9]*Stub)\b',out)):
        if not live(n) and n in scalar or (n.endswith('Stub') and n in default and not live(n)): hand.append(('prose',n))
    return out
diff=[];stats=collections.Counter();handq=collections.defaultdict(list);changed=set()
for p,t in texts.items():
    lines=t.split('\n'); new=list(lines)
    for i,l in enumerate(lines):
        if not cm.match(l): continue
        if not re.search(r'\b(?:[a-z][A-Za-z0-9]*Contract|[A-Z][A-Za-z0-9]*Stub)\b',l): continue
        hand=[]; o=fix(l,hand)
        if o!=l:
            assert cm.match(o) and o.count('*/')==l.count('*/'),(p,i,o)
            new[i]=o; stats['lines_rewritten']+=1; changed.add(p)
        for h in hand: handq[p].append((i+1,h[0],h[1],l.strip()[:150])); stats['hand_'+h[0]]+=1
    if new!=lines:
        diff+=list(difflib.unified_diff(lines,new,p,p,lineterm='',n=0))
        if APPLY: open(p,'w').write('\n'.join(new))
open('tmp/z-plan/usage-sweep.diff','w').write('\n'.join(diff))
json.dump(handq,open('tmp/z-plan/usage-sweep-hand.json','w'),indent=1)
print(dict(stats),'files_changed',len(changed),'files_with_hand',len(handq),'APPLY' if APPLY else 'DRY-RUN')
