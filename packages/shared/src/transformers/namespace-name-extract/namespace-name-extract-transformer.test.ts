import { namespaceNameExtractTransformer } from './namespace-name-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('namespaceNameExtractTransformer', () => {
  it('VALID: {StartOrchestrator.startQuest call} => returns ContentText StartOrchestrator', () => {
    const result = namespaceNameExtractTransformer({
      source: ContentTextStub({
        value: 'return StartOrchestrator.startQuest({ questId });',
      }),
    });

    expect(String(result)).toBe('StartOrchestrator');
  });

  it('VALID: {MyNamespace.doThing call} => returns ContentText MyNamespace', () => {
    const result = namespaceNameExtractTransformer({
      source: ContentTextStub({
        value: 'const result = MyNamespace.doThing(params);',
      }),
    });

    expect(String(result)).toBe('MyNamespace');
  });

  it('EMPTY: {no namespace call in source} => returns null', () => {
    const result = namespaceNameExtractTransformer({
      source: ContentTextStub({
        value: 'const x = regularFunction(params);',
      }),
    });

    expect(result).toBe(null);
  });

  it('VALID: {multiple namespace calls} => returns first namespace', () => {
    const result = namespaceNameExtractTransformer({
      source: ContentTextStub({
        value: 'StartOrchestrator.getQuest({ questId }); OtherNS.doThing({});',
      }),
    });

    expect(String(result)).toBe('StartOrchestrator');
  });
});
