import * as ts from '#gateway/npm/typescript';
import { adapterAnalysisAnalyzeScopeLayerBroker } from './adapter-analysis-analyze-scope-layer-broker';
import { adapterAnalysisAnalyzeScopeLayerBrokerProxy } from './adapter-analysis-analyze-scope-layer-broker.proxy';

const scopeOf = ({
  text,
}: {
  text: string;
}): ReturnType<typeof adapterAnalysisAnalyzeScopeLayerBroker> => {
  adapterAnalysisAnalyzeScopeLayerBrokerProxy();
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
  return adapterAnalysisAnalyzeScopeLayerBroker({ sourceFile, nodes });
};

describe('adapterAnalysisAnalyzeScopeLayerBroker', () => {
  it('VALID: {default, namespace, named and aliased imports} => each local name maps to its module and imported name', () => {
    const { bindings } = scopeOf({
      text: [
        "import path from 'path';",
        "import * as fs from 'fs';",
        "import { readFile as read, writeFile, type Stats } from 'fs/promises';",
        "import type { Only } from './only';",
        "import 'side-effect';",
      ].join('\n'),
    });

    expect([...bindings.entries()]).toStrictEqual([
      ['path', { module: 'path', name: 'default' }],
      ['fs', { module: 'fs', name: '*' }],
      ['read', { module: 'fs/promises', name: 'readFile' }],
      ['writeFile', { module: 'fs/promises', name: 'writeFile' }],
    ]);
  });

  it('VALID: {parameters, variables, destructured names, functions and classes} => every declared name', () => {
    const { declared } = scopeOf({
      text: [
        'export const a = (one: number, { two }: { two: number }) => {',
        '  const three = one + two;',
        '  function four() { return three; }',
        '  class Five {}',
        '  return four() + Number(Five.length);',
        '};',
      ].join('\n'),
    });

    expect([...declared].sort()).toStrictEqual(['Five', 'a', 'four', 'one', 'three', 'two']);
  });

  it('EMPTY: {an empty file} => no bindings and no declarations', () => {
    const { bindings, declared } = scopeOf({ text: '' });

    expect({ bindings: [...bindings.entries()], declared: [...declared] }).toStrictEqual({
      bindings: [],
      declared: [],
    });
  });
});
