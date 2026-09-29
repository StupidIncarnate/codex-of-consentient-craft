import json,re,glob,os,sys
R='/home/brutus-home/projects/codex-of-consentient-craft/worktrees/gateway-pivot/'
S=json.load(open(R+'tmp/libcopy-census/scan.json'))['files']
CAND=[l.split() for l in '''eslint-plugin ast-node
eslint-plugin eslint-config
eslint-plugin eslint-context
eslint-plugin eslint-plugin
eslint-plugin eslint-rule
eslint-plugin eslint-rules
eslint-plugin tsconfig-options
eslint-plugin tsestree
hooks child-process
hooks file-stats
hooks eslint-instance
hooks eslint-options
hooks eslint-raw-message
hooks lint-message
hooks lint-result
hooks linter-config
hooks partial-eslint-config
hooks raw-eslint-config
hooks is-node-error
mcp mcp-server-client
mcp json-rpc-error
mcp json-rpc-request
mcp json-rpc-response
mcp tool-call-result
mcp tool-call-content
mcp tool-list-result
mcp tool
mcp tool-registration
orchestrator killable-process
orchestrator monitorable-process
orchestrator rate-limits-watch-handle
orchestrator spawn-options-snapshot
server ws-client
server zod-issue-error
siegelense zod-issue-error
siegelense decoded-frame
testing timer-handle
testing armed-timer
testing typescript-node-factory
testing typescript-program
testing typescript-source-file
testing typescript-statement
testing endpoint-control
tooling exec-error
hydration type-diagnostic
hydration http-response
hydration-recipes dm-http-response
shared process-signal
shared directory-entry
shared exec-result
web elk-position-map
cli tsconfig-compiler-options
ward tsconfig-json
ward typescript-module-shape
ward open-handle
ward eslint-json-report
ward jest-json-report
ward playwright-json-report
testing playwright-line-results
testing network-log-entry
testing ws-log-entry
testing mock-spawn-result'''.split('\n')]
def kind(f):
    if f.endswith('.stub.ts'): return 'stub'
    if f.endswith('.proxy.ts') or f.endswith('.proxy.tsx'): return 'proxy'
    if re.search(r'\.(test|spec)\.tsx?$',f) or '/test/' in f: return 'test'
    return 'prod'
res={}
for pk,d in CAND:
    base=f'packages/{pk}/src/contracts/{d}/'
    cf=R+base+d+'-contract.ts'
    if not os.path.exists(cf): print('MISSING',base); continue
    src=open(cf).read()
    names=re.findall(r'export (?:const|type|interface) (\w+)',src)
    stubf=glob.glob(R+base+'*.stub.ts'); stubname=None
    if stubf: 
        m=re.findall(r'export const (\w+Stub)',open(stubf[0]).read()); stubname=m[0] if m else None
    users={'prod':set(),'test':set(),'stub':set(),'proxy':set()}
    stubcalls={'files':set(),'n':0}
    for f,rec in S.items():
        if f.startswith(base): continue
        for n in names:
            m=rec['imports'].get(n)
            if m and (d in m or m.startswith('@dungeonmaster')) and (f.startswith(f'packages/{pk}/') or m.startswith('@dungeonmaster')):
                users[kind(f)].add(f)
        if stubname and rec['calls'].get(stubname) and not f.startswith(base):
            stubcalls['n']+=rec['calls'][stubname]; stubcalls['files'].add(f)
    res[f'{pk}:{d}']={'lines':len(src.split('\n')),'names':names,'stub':stubname,'users':{k:sorted(v) for k,v in users.items()},'stubcalls':{'n':stubcalls['n'],'files':sorted(stubcalls['files'])}}
    print(f"{pk}:{d:28s} lines={len(src.split(chr(10))):4d} prod={len(users['prod'])} test={len(users['test'])} stubf={len(users['stub'])} proxy={len(users['proxy'])} stub={stubname} calls={stubcalls['n']} in {len(stubcalls['files'])} files")
json.dump(res,open(R+'tmp/libcopy-census/users.json','w'),indent=1)
