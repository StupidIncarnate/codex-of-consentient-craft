import * as ts from '#gateway/npm/typescript';
import { adapterAnalysisAnalyzeStructureLayerBroker } from './adapter-analysis-analyze-structure-layer-broker';
import { adapterAnalysisAnalyzeStructureLayerBrokerProxy } from './adapter-analysis-analyze-structure-layer-broker.proxy';

const reasonsOf = ({
  text,
}: {
  text: string;
}): ReturnType<typeof adapterAnalysisAnalyzeStructureLayerBroker> => {
  adapterAnalysisAnalyzeStructureLayerBrokerProxy();
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
  return adapterAnalysisAnalyzeStructureLayerBroker({ nodes });
};

describe('adapterAnalysisAnalyzeStructureLayerBroker', () => {
  it('VALID: {try with catch} => try-catch', () => {
    const result = reasonsOf({ text: 'try { run(); } catch (error) { throw error; }' });

    expect(result).toStrictEqual(['try-catch']);
  });

  it('VALID: {try with only finally} => nothing', () => {
    const result = reasonsOf({ text: 'try { run(); } finally { done(); }' });

    expect(result).toStrictEqual([]);
  });

  it.each([
    'if (a) { b(); }',
    'const x = a ? 1 : 2;',
    'switch (a) { default: break; }',
    'for (let i = 0; i < 1; i += 1) { b(); }',
    'for (const i of a) { b(i); }',
    'for (const i in a) { b(i); }',
    'while (a) { b(); }',
    'do { b(); } while (a);',
    'const x = a && b;',
    'const x = a || b;',
    'const x = a ?? b;',
  ])('VALID: {%s} => branching', (text) => {
    const result = reasonsOf({ text });

    expect(result).toStrictEqual(['branching']);
  });

  it('VALID: {a plain call and an addition} => nothing', () => {
    const result = reasonsOf({ text: 'const x = a + b; run(x);' });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {try/catch and an if} => both reasons, try-catch first', () => {
    const result = reasonsOf({ text: 'try { if (a) { b(); } } catch (error) { throw error; }' });

    expect(result).toStrictEqual(['try-catch', 'branching']);
  });
});
