import { wsEdgeContract } from './ws-edge-contract';
import { ContentTextStub } from '../content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';

describe('wsEdgeContract', () => {
  describe('parse', () => {
    it('VALID: {full paired edge} => parses successfully', () => {
      const result = wsEdgeContract.parse({
        eventType: ContentTextStub({ value: 'chat-output' }),
        emitterFile: AbsoluteFilePathStub({
          value: '/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.ts',
        }),
        consumerFiles: [
          AbsoluteFilePathStub({
            value: '/repo/packages/server/src/bindings/use-quest-chat/use-quest-chat-binding.ts',
          }),
        ],
        paired: true,
      });

      expect(result).toStrictEqual({
        eventType: 'chat-output',
        emitterFile:
          '/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.ts',
        consumerFiles: [
          '/repo/packages/server/src/bindings/use-quest-chat/use-quest-chat-binding.ts',
        ],
        paired: true,
      });
    });

    it('VALID: {null emitterFile, paired=false} => parses successfully', () => {
      const result = wsEdgeContract.parse({
        eventType: ContentTextStub({ value: 'chat-output' }),
        emitterFile: null,
        consumerFiles: [
          AbsoluteFilePathStub({
            value: '/repo/packages/server/src/bindings/use-quest-chat/use-quest-chat-binding.ts',
          }),
        ],
        paired: false,
      });

      expect(result).toStrictEqual({
        eventType: 'chat-output',
        emitterFile: null,
        consumerFiles: [
          '/repo/packages/server/src/bindings/use-quest-chat/use-quest-chat-binding.ts',
        ],
        paired: false,
      });
    });

    it('VALID: {empty consumerFiles} => parses successfully', () => {
      const result = wsEdgeContract.parse({
        eventType: ContentTextStub({ value: 'chat-complete' }),
        emitterFile: AbsoluteFilePathStub({
          value: '/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.ts',
        }),
        consumerFiles: [],
        paired: false,
      });

      expect(result).toStrictEqual({
        eventType: 'chat-complete',
        emitterFile:
          '/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.ts',
        consumerFiles: [],
        paired: false,
      });
    });
  });
});
