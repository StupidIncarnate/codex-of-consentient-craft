import * as ts from '#gateway/npm/typescript';
import { adapterAnalysisAnalyzeCallsLayerBroker } from './adapter-analysis-analyze-calls-layer-broker';
import { adapterAnalysisAnalyzeCallsLayerBrokerProxy } from './adapter-analysis-analyze-calls-layer-broker.proxy';
import { adapterAnalysisAnalyzeScopeLayerBroker } from './adapter-analysis-analyze-scope-layer-broker';

const callsOf = ({
  text,
  workspaceScope = '@acme',
}: {
  text: string;
  workspaceScope?: string | null;
}): ReturnType<typeof adapterAnalysisAnalyzeCallsLayerBroker> => {
  adapterAnalysisAnalyzeCallsLayerBrokerProxy();
  const sourceFile = ts.createSourceFile('x.ts', text, ts.ScriptTarget.Latest, true);
  const nodes: ts.Node[] = [];
  const pending: ts.Node[] = [sourceFile];
  while (pending.length > 0) {
    const node = pending.pop();
    if (node !== undefined) {
      nodes.push(node);
      ts.forEachChild(node, (child) => {
        pending.push(child);
      });
    }
  }
  nodes.sort((a, b) => a.pos - b.pos);
  const { bindings, declared } = adapterAnalysisAnalyzeScopeLayerBroker({ sourceFile, nodes });
  return adapterAnalysisAnalyzeCallsLayerBroker({
    nodes,
    bindings,
    declared,
    workspaceScope,
    workspacePackageNames: [],
  });
};

describe('adapterAnalysisAnalyzeCallsLayerBroker', () => {
  it('VALID: {a named outside import called twice} => two outside calls, one per site', () => {
    const result = callsOf({
      text: "import { stat } from 'fs/promises'; stat('/a'); stat('/b');",
    });

    expect(result).toStrictEqual({
      outsideCalls: [
        { module: 'fs/promises', name: 'stat' },
        { module: 'fs/promises', name: 'stat' },
      ],
      reasons: [],
    });
  });

  it('VALID: {a default import called directly} => the default name', () => {
    const result = callsOf({ text: "import debug from 'debug'; debug('x');" });

    expect(result).toStrictEqual({
      outsideCalls: [{ module: 'debug', name: 'default' }],
      reasons: [],
    });
  });

  it('VALID: {a member chain on a namespace import} => the dotted path is the name', () => {
    const result = callsOf({ text: "import * as fs from 'fs'; fs.promises.readFile('/a');" });

    expect(result).toStrictEqual({
      outsideCalls: [{ module: 'fs', name: 'promises.readFile' }],
      reasons: [],
    });
  });

  it('VALID: {a repo import ending in Adapter, another repo import, and a parse} => adapter, repo code, nothing', () => {
    const result = callsOf({
      text: [
        "import { xAdapter } from './x-adapter';",
        "import { thing } from './thing';",
        "import { thingContract } from './thing-contract';",
        'xAdapter(); thing(); thingContract.parse(1); thingContract.safeParse(1);',
      ].join('\n'),
    });

    expect(result).toStrictEqual({
      outsideCalls: [],
      reasons: ['calls-adapter', 'calls-repo-code'],
    });
  });

  it('VALID: {workspaceScope: null and a scoped import} => the import counts as outside', () => {
    const result = callsOf({
      text: "import { thing } from '@acme/shared/things'; thing();",
      workspaceScope: null,
    });

    expect(result).toStrictEqual({
      outsideCalls: [{ module: '@acme/shared/things', name: 'thing' }],
      reasons: [],
    });
  });

  it('VALID: {new on a namespace member and new Map} => the constructor is the call, built-ins skipped', () => {
    const result = callsOf({
      text: "import * as ws from 'ws'; new ws.Server({}); new Map();",
    });

    expect(result).toStrictEqual({
      outsideCalls: [{ module: 'ws', name: 'Server' }],
      reasons: [],
    });
  });

  it('EMPTY: {no calls} => nothing', () => {
    const result = callsOf({ text: 'export const value = 1;' });

    expect(result).toStrictEqual({ outsideCalls: [], reasons: [] });
  });
});
