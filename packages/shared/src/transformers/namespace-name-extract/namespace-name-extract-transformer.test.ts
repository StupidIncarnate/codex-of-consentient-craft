import { namespaceNameExtractTransformer } from './namespace-name-extract-transformer';

describe('namespaceNameExtractTransformer', () => {
  it('VALID: {StartOrchestrator.startQuest call} => returns ContentText StartOrchestrator', () => {
    const result = namespaceNameExtractTransformer({
      source: 'return StartOrchestrator.startQuest({ questId });',
    });

    expect(String(result)).toBe('StartOrchestrator');
  });

  it('VALID: {MyNamespace.doThing call} => returns ContentText MyNamespace', () => {
    const result = namespaceNameExtractTransformer({
      source: 'const result = MyNamespace.doThing(params);',
    });

    expect(String(result)).toBe('MyNamespace');
  });

  it('EMPTY: {no namespace call in source} => returns null', () => {
    const result = namespaceNameExtractTransformer({
      source: 'const x = regularFunction(params);',
    });

    expect(result).toBe(null);
  });

  it('VALID: {multiple namespace calls} => returns first namespace', () => {
    const result = namespaceNameExtractTransformer({
      source: 'StartOrchestrator.getQuest({ questId }); OtherNS.doThing({});',
    });

    expect(String(result)).toBe('StartOrchestrator');
  });
});
