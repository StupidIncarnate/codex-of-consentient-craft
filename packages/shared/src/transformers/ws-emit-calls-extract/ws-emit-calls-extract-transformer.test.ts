import { wsEmitCallsExtractTransformer } from './ws-emit-calls-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('wsEmitCallsExtractTransformer', () => {
  describe('single-quoted type literal', () => {
    it('VALID: {single-quoted type} => returns the type literal', () => {
      const result = wsEmitCallsExtractTransformer({
        source: ContentTextStub({
          value: "orchestrationEventsState.emit({ type: 'chat-output', processId });",
        }),
      });

      expect(result).toStrictEqual(['chat-output']);
    });
  });

  describe('double-quoted type literal', () => {
    it('VALID: {double-quoted type} => returns the type literal', () => {
      const result = wsEmitCallsExtractTransformer({
        source: ContentTextStub({
          value: 'orchestrationEventsState.emit({ type: "chat-complete", processId });',
        }),
      });

      expect(result).toStrictEqual(['chat-complete']);
    });
  });

  describe('multiple emit calls', () => {
    it('VALID: {two emit calls} => returns both type literals', () => {
      const result = wsEmitCallsExtractTransformer({
        source: ContentTextStub({
          value: [
            "orchestrationEventsState.emit({ type: 'chat-output', processId });",
            "orchestrationEventsState.emit({ type: 'chat-complete', processId });",
          ].join('\n'),
        }),
      });

      expect(result).toStrictEqual(['chat-output', 'chat-complete']);
    });
  });

  describe('no emit calls', () => {
    it('EMPTY: {source with no emit calls} => returns empty array', () => {
      const result = wsEmitCallsExtractTransformer({
        source: ContentTextStub({
          value: 'const x = someOtherThing.emit({ kind: "chat-output" });',
        }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('whitespace variants', () => {
    it('VALID: {extra whitespace around braces} => returns the type literal', () => {
      const result = wsEmitCallsExtractTransformer({
        source: ContentTextStub({
          value: "orchestrationEventsState.emit( {  type:  'phase-change', processId } );",
        }),
      });

      expect(result).toStrictEqual(['phase-change']);
    });
  });
});
