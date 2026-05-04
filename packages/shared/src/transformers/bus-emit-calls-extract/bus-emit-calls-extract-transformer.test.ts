import { busEmitCallsExtractTransformer } from './bus-emit-calls-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('busEmitCallsExtractTransformer', () => {
  describe('source has emit call matching the bus name', () => {
    it('VALID: {single emit with single-quoted type} => returns one event type', () => {
      const result = busEmitCallsExtractTransformer({
        source: ContentTextStub({
          value: "myBus.emit({ type: 'chat-output', payload });",
        }),
        busExportName: ContentTextStub({ value: 'myBus' }),
      });

      expect(result.map(String)).toStrictEqual(['chat-output']);
    });

    it('VALID: {multiple emits with different types} => returns all types in order', () => {
      const result = busEmitCallsExtractTransformer({
        source: ContentTextStub({
          value: [
            "myBus.emit({ type: 'chat-output', payload });",
            "myBus.emit({ type: 'chat-complete', payload });",
          ].join('\n'),
        }),
        busExportName: ContentTextStub({ value: 'myBus' }),
      });

      expect(result.map(String)).toStrictEqual(['chat-output', 'chat-complete']);
    });

    it('VALID: {double-quoted type literal} => returns the type', () => {
      const result = busEmitCallsExtractTransformer({
        source: ContentTextStub({
          value: 'otherBus.emit({ type: "phase-change", processId });',
        }),
        busExportName: ContentTextStub({ value: 'otherBus' }),
      });

      expect(result.map(String)).toStrictEqual(['phase-change']);
    });
  });

  describe('source has emit call matching a different bus', () => {
    it('EMPTY: {emit on unrelated bus} => returns empty array', () => {
      const result = busEmitCallsExtractTransformer({
        source: ContentTextStub({
          value: "otherBus.emit({ type: 'chat-output', payload });",
        }),
        busExportName: ContentTextStub({ value: 'myBus' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('source has no emit calls', () => {
    it('EMPTY: {no emit pattern} => returns empty array', () => {
      const result = busEmitCallsExtractTransformer({
        source: ContentTextStub({
          value: 'export const foo = () => {};',
        }),
        busExportName: ContentTextStub({ value: 'myBus' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
