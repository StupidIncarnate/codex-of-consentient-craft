import json,re,collections
R='/home/brutus-home/projects/codex-of-consentient-craft/worktrees/gateway-pivot/'
calls=json.load(open(R+'tmp/libcopy-census/stubcalls-all.json'))
ts=json.load(open(R+'tmp/libcopy-census/tsestree-classify.json'))
retype=json.load(open(R+'tmp/libcopy-census/retype.json'))
GW={'Identifier','CallExpression','MemberExpression','Program','ArrowFunctionExpression','Literal','Property','ObjectExpression','BlockStatement','ExpressionStatement','VariableDeclaration','ReturnStatement','JSXElement','JSXFragment'}
def indir(f,pk,d): return f.startswith(f'packages/{pk}/src/contracts/{d}/')
def topkeys(c): return [k for k in c['keys'] if not k.startswith('>')]
def classify(stub,pk,d,okkeys,special=None,needs_gateway_stub=False):
    out=collections.Counter(); hand=[]; keycount=collections.Counter(); deleted_files=set()
    for c in calls.get(stub,[]):
        if indir(c['file'],pk,d): out['DELETED_WITH_CONTRACT']+=1; deleted_files.add(c['file']); continue
        ks=topkeys(c); 
        for k in ks: keycount[k]+=1
        if 'spread' in c['flags'] or 'nonliteral-arg' in c['flags']: out['HAND']+=1; hand.append(f"{c['file']}:{c['line']}  nonliteral/spread arg"); continue
        if special:
            r=special(c)
            if r=='MAP': out['MAP']+=1; continue
            if r: out['HAND']+=1; hand.append(f"{c['file']}:{c['line']}  {r}"); continue
        if not ks: out['MAP']+=1; continue
        bad=[k for k in ks if k not in okkeys]
        if bad: out['HAND']+=1; hand.append(f"{c['file']}:{c['line']}  key(s) without counterpart: {','.join(bad)}")
        else: out['MAP']+=1
    return dict(classes=dict(out),keyCounts=dict(keycount),handSites=hand,ownContractTestCalls=sum(1 for c in calls.get(stub,[]) if indir(c['file'],pk,d)))
M={}
def ctx_special(c):
    t=re.sub(r'\s+',' ',c['text'])
    if 'as never' in t: return 'cast to never (invalid filename shape) / getFilename cast'
    if 'getFilename' in c['keys']:
        return 'MAP' if re.search(r"getFilename:\s*\(\)\s*(:\s*\w+)?\s*=>\s*['\"]",t) else 'getFilename is a non-literal function'
    return None
M['EslintContextStub']=dict(oldFile='packages/eslint-plugin/src/contracts/eslint-context/eslint-context.stub.ts',newStub='RuleContextStub',newImport="#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub",gatewayHasStub=True,
  keyMap={'report':'report (same name; a jest mock is accepted as-is, the stub only builds one when omitted per its header)','filename':'filename','getFilename':"filename — only when the value is `() => '<literal>'`",'getScope / getSourceCode / sourceCode / options':'no counterpart (no caller passes them); real stub delegates to the real sourceCode','(new) code':'RuleContextStub also takes code'},
  **classify('EslintContextStub','eslint-plugin','eslint-context',{'report','filename'},ctx_special))
M['AstNodeStub']=dict(oldFile='packages/eslint-plugin/src/contracts/ast-node/ast-node.stub.ts',newStub='IdentifierStub (or any per-node gateway stub)',newImport='#gateway/npm/typescript-eslint__utils/identifier/identifier.stub',gatewayHasStub=True,
  keyMap={'type':'pick the per-node stub','range / loc':'real node positions come from the code string; a test passing specific loc/range needs code laid out to those positions or is HAND','parent':'real'},
  **classify('AstNodeStub','eslint-plugin','ast-node',set()))
for stub,pk,d,old,new,imp,has,km,ok in [
 ('EslintConfigStub','eslint-plugin','eslint-config','eslint-config.stub.ts','FlatConfig stub (does not exist)','#gateway/npm/typescript-eslint__utils/flat-config/flat-config.stub (proposed)',False,{'rules':'rules','plugins':'plugins','files':'files','ignores':'ignores','languageOptions':'languageOptions'},{'rules','plugins','files','ignores','languageOptions'}),
 ('EslintRulesStub','eslint-plugin','eslint-rules','eslint-rules.stub.ts','none needed: a plain TSESLint.SharedConfig.RulesRecord literal, or a gateway stub','n/a',False,{'<ruleName>':'same key, real RulesRecord'},None),
 ('LinterConfigStub','hooks','linter-config','linter-config.stub.ts','FlatConfig stub (does not exist)','#gateway/npm/eslint/... flat-config stub (proposed)',False,{'rules':'rules'},{'rules'}),
]:
    ok2=ok
    if ok2 is None:
        ok2={k for c in calls[stub] for k in topkeys(c)}
    M[stub]=dict(oldFile=f'packages/{pk}/src/contracts/{d}/{old}',newStub=new,newImport=imp,gatewayHasStub=has,keyMap=km,**classify(stub,pk,d,ok2))
M['ChildProcessStub (hooks copy)']=dict(oldFile='packages/hooks/src/contracts/child-process/child-process.stub.ts',newStub='ChildProcessStub',newImport='#gateway/node/child_process/child-process/child-process.stub',gatewayHasStub=True,keyMap={'pid':'no counterpart; gateway stub takes no args'},**classify('ChildProcessStub','hooks','child-process',set()))
M['FileStatsStub']=dict(oldFile='packages/hooks/src/contracts/file-stats/file-stats.stub.ts',newStub='StatsStub',newImport='#gateway/node/fs/stats/stats.stub',gatewayHasStub=True,keyMap={'size':'sizeBytes','isFile/isDirectory':'kind: "file"|"directory"'},**classify('FileStatsStub','hooks','file-stats',{'size'}))
def timer_special(c):
    t=re.sub(r'\s+',' ',c['text'])
    if re.search(r'hasRef:\s*\(\):\s*boolean\s*=>\s*true',t): return 'MAP'
    if re.search(r'hasRef:\s*\(\):\s*boolean\s*=>\s*false',t): return 'MAP'
    return None
M['TimerHandleStub']=dict(oldFile='packages/testing/src/contracts/timer-handle/timer-handle.stub.ts',newStub='TimeoutStub',newImport='#gateway/node/setTimeout/timeout/timeout.stub',gatewayHasStub=True,keyMap={'hasRef: () => true':'TimeoutStub()','hasRef: () => false':'TimeoutStub({ unref: true })'},**classify('TimerHandleStub','testing','timer-handle',{'hasRef'},timer_special))
def sf_special(c):
    t=re.sub(r'\s+',' ',c['text'])
    if re.search(r'value:\s*(tsSourceFile|entrySourceFile)\s*\}',t): return 'MAP'
    return 'hand-built partial source file `{ fileName }`'
M['TypescriptSourceFileStub']=dict(oldFile='packages/testing/src/contracts/typescript-source-file/typescript-source-file.stub.ts',newStub='SourceFileStub',newImport='#gateway/npm/typescript/source-file/source-file.stub',gatewayHasStub=True,keyMap={'value: <real ts.SourceFile variable>':'drop the wrap and pass the real ts.SourceFile (or SourceFileStub({ code, fileName }))','value: { fileName }':'no counterpart (hand-built partial)'},**classify('TypescriptSourceFileStub','testing','typescript-source-file',{'value'},sf_special))
def prog_special(c):
    t=re.sub(r'\s+',' ',c['text'])
    if 'getSourceFile' in t: return 'hand-built partial ts.Program `{ getSourceFile }`'
    if 'value: undefined' in t: return '`value: undefined` (not a Program)'
    return 'MAP'
M['TypescriptProgramStub']=dict(oldFile='packages/testing/src/contracts/typescript-program/typescript-program.stub.ts',newStub='none — gateway needs a ts.Program stub (real program over one in-memory file)',newImport='#gateway/npm/typescript/program/program.stub (proposed)',gatewayHasStub=False,keyMap={'value':'a real ts.Program'},**classify('TypescriptProgramStub','testing','typescript-program',{'value'},prog_special))
def nf_special(c):
    t=re.sub(r'\s+',' ',c['text'])
    return 'MAP' if 'value: ts.factory' in t else 'value is undefined/{} (not a NodeFactory)'
M['TypescriptNodeFactoryStub']=dict(oldFile='packages/testing/src/contracts/typescript-node-factory/typescript-node-factory.stub.ts',newStub='ts.factory itself, imported through #gateway/npm/typescript (no stub needed)',newImport='#gateway/npm/typescript',gatewayHasStub=True,keyMap={'value: ts.factory':'ts.factory'},**classify('TypescriptNodeFactoryStub','testing','typescript-node-factory',{'value'},nf_special))
def st_special(c):
    t=re.sub(r'\s+',' ',c['text'])
    return 'MAP' if 'ts.factory.create' in t else '`value: undefined`'
M['TypescriptStatementStub']=dict(oldFile='packages/testing/src/contracts/typescript-statement/typescript-statement.stub.ts',newStub='the ts.factory-built ts.Statement itself',newImport='#gateway/npm/typescript',gatewayHasStub=True,keyMap={'value: ts.factory.create…':'the same expression, unwrapped'},**classify('TypescriptStatementStub','testing','typescript-statement',{'value'},st_special))
for stub,pk,d,newname,km in [
 ('JsonRpcRequestStub','mcp','json-rpc-request','none — gateway has only CallToolRequest stub; needs JSONRPCRequest stub',{'id':'id','method':'method','params':'params'}),
 ('JsonRpcResponseStub','mcp','json-rpc-response','none — needs JSONRPCResponse stub',{'id':'id','result':'result','error':'error'}),
 ('ToolCallResultStub','mcp','tool-call-result','none — needs CallToolResult stub',{'content':'content','isError':'isError'}),
 ('ToolListResultStub','mcp','tool-list-result','none — needs ListToolsResult stub',{'tools':'tools'}),
]:
    M[stub]=dict(oldFile=f'packages/{pk}/src/contracts/{d}/{d}.stub.ts',newStub=newname,newImport='#gateway/npm/modelcontextprotocol__sdk__types (proposed subpaths)',gatewayHasStub=False,keyMap=km,**classify(stub,pk,d,set(km)))
M['WsClientStub']=dict(oldFile='packages/server/src/contracts/ws-client/ws-client.stub.ts',newStub='none — gateway needs a WSContext stub (hono/ws)',newImport='#gateway/npm/hono... (proposed)',gatewayHasStub=False,keyMap={'send':'send (WSContext.send takes string|ArrayBuffer|Uint8Array)'},**classify('WsClientStub','server','ws-client',{'send'}))
M['ZodIssueErrorStub (server, siegelense)']=dict(oldFile='packages/{server,siegelense}/src/contracts/zod-issue-error/zod-issue-error.stub.ts',newStub='none — a real z.ZodError built via #gateway/npm/zod',newImport='#gateway/npm/zod',gatewayHasStub=False,keyMap={'issues':'new ZodError(issues)'},**classify('ZodIssueErrorStub','server','zod-issue-error',{'issues'}))
M['SpawnOptionsSnapshotStub']=dict(oldFile='packages/orchestrator/src/contracts/spawn-options-snapshot/spawn-options-snapshot.stub.ts',newStub='UNCLEAR — copy of a SpawnOptions subset',newImport='n/a',gatewayHasStub=False,keyMap={},**classify('SpawnOptionsSnapshotStub','orchestrator','spawn-options-snapshot',set()))
# TsestreeStub
tc=collections.Counter(c['cls'] for c in ts if not c['file'].startswith('packages/eslint-plugin/src/contracts/tsestree/'))
tdel=sum(1 for c in ts if c['file'].startswith('packages/eslint-plugin/src/contracts/tsestree/'))
hand=[f"{c['file']}:{c['line']}  root={c['rootType']}  "+'; '.join(c['missing'][:3]+c['unknown'][:3]+c['flags']) for c in ts if c['cls']=='HAND']
rootNoStub=collections.Counter(c['rootType'] for c in ts if c['rootType'] not in GW)
own=collections.defaultdict(collections.Counter)
for c in ts:
    for t,ks in c['nodeKeys']:
        for k in ks: own[t][k]+=1
M['TsestreeStub']=dict(oldFile='packages/eslint-plugin/src/contracts/tsestree/tsestree.stub.ts',newStub='per-node gateway stubs (14 exist) or a { code }-printing stub',newImport="#gateway/npm/typescript-eslint__utils/<kebab-node>/<kebab-node>.stub (Identifier, CallExpression, MemberExpression, Program, ArrowFunctionExpression, Literal, Property, ObjectExpression, BlockStatement, ExpressionStatement, VariableDeclaration, ReturnStatement, JSXElement, JSXFragment exist)",gatewayHasStub='partial',
  keyMap={'type':'chooses the stub (or the printer template)','name/value/callee/arguments/object/property/body/params/... (all real TSESTree fields)':'expressed in the printed code string','parent: null':'ignore','parent: <node>':'HAND: real parent comes from parsing; the printer must be told which enclosing shape to print'},
  classes={'MAP':tc['MAP'],'PRINT':tc['PRINT'],'HAND':tc['HAND'],'DELETED_WITH_CONTRACT':tdel},
  outerCalls=len(ts),
  rootTypesWithoutGatewayStub=dict(rootNoStub),
  callsWhoseRootHasGatewayStub=sum(1 for c in ts if c['rootType'] in GW),
  printWithInventedDefaults=sum(1 for c in ts if c['cls']=='PRINT' and c['defaulted']),
  handReasons=dict(collections.Counter(r for c in ts if c['cls']=='HAND' for r in ([('missing '+x) for x in c['missing']]+[('unknown key '+x) for x in c['unknown']]+[('flag '+f) for f in c['flags']])).most_common(40)),
  ownKeysByNodeType={t:dict(v.most_common()) for t,v in sorted(own.items())},
  handSitesFile='tmp/libcopy-census/tsestree-hand-sites.txt',handSiteCount=len(hand))
# type retype table
rc=collections.Counter((r['kind'],r['cls']) for r in retype)
vk=collections.Counter(r['key'] for r in retype if r['key'])
M['_typeMap']={
 'Tsestree':{'copyFile':'packages/eslint-plugin/src/contracts/tsestree/tsestree-contract.ts','realType':'TSESTree.Node (generic) / TSESTree.<Key> in a visitor','importFrom':"#gateway/npm/typescript-eslint__utils  (import type { TSESTree })",
   'rules':['parameter of an arrow that is a property value in the rule visitor object, key K: TSESTree.K (strip ":exit"; for a compound selector "A > B[x] > C" use the rightmost type C; for "A, B" use TSESTree.A | TSESTree.B; attribute/pseudo selectors ([..], :not(..)) are dropped)','`{ node }: { node: Tsestree }` in guards/transformers: TSESTree.Node (narrow per function by hand when it first checks node.type)','`Tsestree | undefined` / `Tsestree | null` / `Tsestree[]`: same rule with the wrapper kept','return type Tsestree: TSESTree.Node'],
   'refCounts':{f'{k[0]}:{k[1]}':v for k,v in sorted(rc.items())},'visitorKeyHistogram':dict(vk.most_common(25)),
   'prodFilesWhereEveryRefIsVisitorKeyed':71,'prodFilesWithRefs':171},
 'TsestreeNodeType (test alias from tsestree.stub)':{'realType':'AST_NODE_TYPES','importFrom':'#gateway/npm/typescript-eslint__utils','files':'58 test files + 7 prod (tsestreeNodeTypeStatics)'},
 'EslintContext':{'realType':'TSESLint.RuleContext<string, unknown[]>  (rules typed via TSESLint.RuleModule<MessageIds, Options>; helpers taking a context use Readonly<TSESLint.RuleContext<MessageIds, Options>>)','importFrom':'#gateway/npm/typescript-eslint__utils'},
 'EslintSourceCode':{'realType':'TSESLint.SourceCode'},'EslintScope':{'realType':'TSESLint.Scope.Scope'},'EslintComment':{'realType':'TSESTree.Comment'},'EslintRuleFixer':{'realType':'TSESLint.RuleFixer'},
 'EslintRule':{'realType':'TSESLint.RuleModule<string, unknown[]> (meta: TSESLint.RuleMetaData<string>)'},
 'AstNode':{'realType':'TSESTree.Node'},'EslintConfig / LinterConfig':{'realType':'TSESLint.FlatConfig.Config'},'EslintRules':{'realType':'TSESLint.SharedConfigurationSettings / Linter.RulesRecord (rules record)'},
 'EslintPlugin':{'realType':'TSESLint.FlatConfig.Plugin'},'TimerHandle':{'realType':'NodeJS.Timeout','importFrom':'global (no import)'},'ChildProcess (hooks)':{'realType':'ChildProcess from #gateway/node/child_process'},'FileStats':{'realType':'Stats from #gateway/node/fs'},
 'TypescriptSourceFile':{'realType':'ts.SourceFile','importFrom':'#gateway/npm/typescript'},'TypescriptProgram':{'realType':'ts.Program'},'TypescriptNodeFactory':{'realType':'ts.NodeFactory'},'TypescriptStatement':{'realType':'ts.Statement'},
 'McpServerClient':{'realType':'none (dead)'},'JsonRpcRequest/Response/Error':{'realType':'JSONRPCRequest / JSONRPCResponse / JSONRPCError from #gateway/npm/modelcontextprotocol__sdk__types'},'ToolCallResult/ToolCallContent':{'realType':'CallToolResult (content item: TextContent)'},'ToolListResult':{'realType':'ListToolsResult'},'Tool':{'realType':'Tool (SDK)'},
 'WsClient':{'realType':'WSContext (hono/ws)'},'ZodIssueError':{'realType':'z.ZodError (z.core.$ZodIssue[])'},'ProcessSignal':{'realType':'NodeJS.Signals'},'ExecError':{'realType':'child_process ExecException / SpawnSyncReturns error'},
 'is-node-error guard':{'realType':'NodeJS.ErrnoException via the gateway fs error guard (#gateway/node/fs is-fs-error)'},
}
json.dump(M,open(R+'tmp/libcopy-census/stub-map.json','w'),indent=1)
for k,v in M.items():
    if k.startswith('_'): continue
    print(f"{k:40s} {v.get('classes')} own-contract-test-calls={v.get('ownContractTestCalls','-')} gatewayStub={v['gatewayHasStub']}")
print('hand sites tsestree',len(hand))
