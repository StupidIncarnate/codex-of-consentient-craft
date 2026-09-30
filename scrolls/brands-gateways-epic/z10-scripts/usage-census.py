# Census: identifiers ending Contract or Stub named in comment lines of packages/**/src|test that no file exports.
import os,re,sys,json,collections
skip=('node_modules','dist','.git','.ward','tmp')
files=[]
for root,d,fs in os.walk('packages'):
    d[:]=[x for x in d if x not in skip]
    for f in fs:
        if f.endswith(('.ts','.tsx')) and '/@types' not in root: files.append(os.path.join(root,f))
exp=set(); 
ex=re.compile(r'export (?:const|function|type) (\w+)')
exl=re.compile(r'export \{([^}]*)\}')
texts={}
for p in files:
    t=open(p,errors='ignore').read(); texts[p]=t
    for m in ex.finditer(t): exp.add(m.group(1))
    for m in exl.finditer(t):
        for n in m.group(1).split(','): exp.add(n.strip().split(' as ')[-1].replace('type ','').strip())
ident=re.compile(r'\b([a-z][A-Za-z0-9]*Contract|[A-Z][A-Za-z0-9]*Stub)\b')
cm=re.compile(r'^\s*(\*|//|/\*)')
hits=collections.defaultdict(list)
for p,t in texts.items():
    for i,l in enumerate(t.split('\n'),1):
        if cm.match(l):
            for m in ident.finditer(l):
                n=m.group(1)
                if n not in exp: hits[n].append((p,i,l.strip()))
mode=sys.argv[1] if len(sys.argv)>1 else 'summary'
if mode=='summary':
    files_by=collections.defaultdict(set)
    for n,v in hits.items():
        for p,i,l in v: files_by[n].add(p)
    allf=set(); tot=0
    for n in sorted(hits,key=lambda n:-len(hits[n])):
        print(len(hits[n]),len(files_by[n]),n); allf|=files_by[n]; tot+=len(hits[n])
    print('TOTAL lines',tot,'files',len(allf))
else:
    for p,i,l in hits.get(mode,[]): print(f"{p}:{i}: {l[:160]}")
