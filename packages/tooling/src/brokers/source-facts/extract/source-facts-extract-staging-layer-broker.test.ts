import * as ts from '#gateway/npm/typescript';
import { sourceFactsExtractStagingLayerBroker } from './source-facts-extract-staging-layer-broker';
import { sourceFactsExtractStagingLayerBrokerProxy } from './source-facts-extract-staging-layer-broker.proxy';

const parse = ({ text }: { text: string }): ts.SourceFile =>
  ts.createSourceFile('x.proxy.ts', text, ts.ScriptTarget.Latest, true);

describe('sourceFactsExtractStagingLayerBroker', () => {
  it('VALID: {calledWith([]) and onceFor([])} => empty-address sites in line order', () => {
    sourceFactsExtractStagingLayerBrokerProxy();

    const result = sourceFactsExtractStagingLayerBroker({
      sourceFile: parse({
        text: ['handle.onceFor([]).returns(1);', 'handle.calledWith([]).returns(2);'].join('\n'),
      }),
    });

    expect(result).toStrictEqual([
      { line: 1, kind: 'empty-address', snippet: 'handle.onceFor([])' },
      { line: 2, kind: 'empty-address', snippet: 'handle.calledWith([])' },
    ]);
  });

  it('VALID: {a specific address} => not a catch-all', () => {
    sourceFactsExtractStagingLayerBrokerProxy();

    const result = sourceFactsExtractStagingLayerBroker({
      sourceFile: parse({ text: "handle.calledWith(['/a', 'utf8']).returns(1);" }),
    });

    expect(result).toStrictEqual([]);
  });

  it.each([
    'handle.calledWith([() => true]).returns(1);',
    'handle.calledWith([(): boolean => true]).returns(1);',
    'handle.calledWith([function () { return true; }]).returns(1);',
    'handle.calledWith([() => { return true; }, 2]).returns(1);',
  ])('VALID: {an accept-all predicate: %s} => accept-all-predicate', (text) => {
    sourceFactsExtractStagingLayerBrokerProxy();

    const result = sourceFactsExtractStagingLayerBroker({ sourceFile: parse({ text }) });

    expect(result.map((site) => site.kind)).toStrictEqual(['accept-all-predicate']);
  });

  it('VALID: {a predicate that tests its argument, returns something else, or holds more than one statement} => not a catch-all', () => {
    sourceFactsExtractStagingLayerBrokerProxy();

    const result = sourceFactsExtractStagingLayerBroker({
      sourceFile: parse({
        text: [
          "handle.calledWith([(value: unknown) => value === 'a']).returns(1);",
          'handle.calledWith([() => { return 1; }]).returns(1);',
          'handle.calledWith([() => { const x = 1; return true; }]).returns(1);',
        ].join('\n'),
      }),
    });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {callsMatching([]) and callsMatching with an address} => only the empty one', () => {
    sourceFactsExtractStagingLayerBrokerProxy();

    const result = sourceFactsExtractStagingLayerBroker({
      sourceFile: parse({
        text: ['handle.callsMatching([]);', "handle.callsMatching(['/a']);"].join('\n'),
      }),
    });

    expect(result).toStrictEqual([
      { line: 1, kind: 'read-all', snippet: 'handle.callsMatching([])' },
    ]);
  });

  it('VALID: {calledWith given a non-array} => ignored', () => {
    sourceFactsExtractStagingLayerBrokerProxy();

    const result = sourceFactsExtractStagingLayerBroker({
      sourceFile: parse({ text: 'handle.calledWith(addressList).returns(1); other.run([]);' }),
    });

    expect(result).toStrictEqual([]);
  });
});
