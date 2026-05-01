import { namespaceMethodCallsExtractTransformer } from './namespace-method-calls-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('namespaceMethodCallsExtractTransformer', () => {
  describe('single call', () => {
    it('VALID: {StartOrchestrator.getQuest(} => returns ["getQuest"]', () => {
      const source = ContentTextStub({
        value: 'return StartOrchestrator.getQuest({ questId });',
      });

      const result = namespaceMethodCallsExtractTransformer({ source });

      expect(result).toStrictEqual(['getQuest']);
    });

    it('VALID: {MyNamespace.doThing(} => returns ["doThing"]', () => {
      const source = ContentTextStub({
        value: 'MyNamespace.doThing({ id });',
      });

      const result = namespaceMethodCallsExtractTransformer({ source });

      expect(result).toStrictEqual(['doThing']);
    });
  });

  describe('multiple distinct calls', () => {
    it('VALID: {two different namespace method calls} => returns both method names', () => {
      const source = ContentTextStub({
        value: [
          'const q = await StartOrchestrator.getQuest({ questId });',
          'await StartOrchestrator.addQuest({ data });',
        ].join('\n'),
      });

      const result = namespaceMethodCallsExtractTransformer({ source });

      expect(result).toStrictEqual(['getQuest', 'addQuest']);
    });
  });

  describe('deduplication', () => {
    it('VALID: {same method called twice} => returns method name once', () => {
      const source = ContentTextStub({
        value: [
          'const q1 = await StartOrchestrator.getQuest({ questId: id1 });',
          'const q2 = await StartOrchestrator.getQuest({ questId: id2 });',
        ].join('\n'),
      });

      const result = namespaceMethodCallsExtractTransformer({ source });

      expect(result).toStrictEqual(['getQuest']);
    });
  });

  describe('filtering', () => {
    it('VALID: {lowercase-starting identifier before dot} => not matched', () => {
      const source = ContentTextStub({
        value: 'const x = someObject.method();',
      });

      const result = namespaceMethodCallsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {uppercase-starting method name after dot} => not matched', () => {
      const source = ContentTextStub({
        value: 'const x = SomeClass.SomeStaticProp;',
      });

      const result = namespaceMethodCallsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });
  });

  describe('empty source', () => {
    it('EMPTY: {empty source} => returns empty array', () => {
      const source = ContentTextStub({ value: '' });

      const result = namespaceMethodCallsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {source with no namespace calls} => returns empty array', () => {
      const source = ContentTextStub({ value: 'const x = 42;' });

      const result = namespaceMethodCallsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });
  });
});
