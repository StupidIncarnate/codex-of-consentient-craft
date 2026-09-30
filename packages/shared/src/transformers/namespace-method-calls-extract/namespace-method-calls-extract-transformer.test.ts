import { namespaceMethodCallsExtractTransformer } from './namespace-method-calls-extract-transformer';

describe('namespaceMethodCallsExtractTransformer', () => {
  describe('single call', () => {
    it('VALID: {StartOrchestrator.getQuest(} => returns ["getQuest"]', () => {
      const source = 'return StartOrchestrator.getQuest({ questId });';

      const result = namespaceMethodCallsExtractTransformer({ source });

      expect(result).toStrictEqual(['getQuest']);
    });

    it('VALID: {MyNamespace.doThing(} => returns ["doThing"]', () => {
      const source = 'MyNamespace.doThing({ id });';

      const result = namespaceMethodCallsExtractTransformer({ source });

      expect(result).toStrictEqual(['doThing']);
    });
  });

  describe('multiple distinct calls', () => {
    it('VALID: {two different namespace method calls} => returns both method names', () => {
      const source = [
        'const q = await StartOrchestrator.getQuest({ questId });',
        'await StartOrchestrator.addQuest({ data });',
      ].join('\n');

      const result = namespaceMethodCallsExtractTransformer({ source });

      expect(result).toStrictEqual(['getQuest', 'addQuest']);
    });
  });

  describe('deduplication', () => {
    it('VALID: {same method called twice} => returns method name once', () => {
      const source = [
        'const q1 = await StartOrchestrator.getQuest({ questId: id1 });',
        'const q2 = await StartOrchestrator.getQuest({ questId: id2 });',
      ].join('\n');

      const result = namespaceMethodCallsExtractTransformer({ source });

      expect(result).toStrictEqual(['getQuest']);
    });
  });

  describe('filtering', () => {
    it('VALID: {lowercase-starting identifier before dot} => not matched', () => {
      const source = 'const x = someObject.method();';

      const result = namespaceMethodCallsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {uppercase-starting method name after dot} => not matched', () => {
      const source = 'const x = SomeClass.SomeStaticProp;';

      const result = namespaceMethodCallsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });
  });

  describe('empty source', () => {
    it('EMPTY: {empty source} => returns empty array', () => {
      const source = '';

      const result = namespaceMethodCallsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {source with no namespace calls} => returns empty array', () => {
      const source = 'const x = 42;';

      const result = namespaceMethodCallsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });
  });
});
