import { wsEdgeContract } from './ws-edge-contract';
import { ContentTextStub } from '../content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';

describe('wsEdgeContract', () => {
  describe('parse', () => {
    it('VALID: {full paired edge with gateway} => parses successfully', () => {
      const result = wsEdgeContract.parse({
        eventType: ContentTextStub({ value: 'chat-output' }),
        emitterFile: AbsoluteFilePathStub({
          value: '/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.ts',
        }),
        consumerFiles: [
          AbsoluteFilePathStub({
            value: '/repo/packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts',
          }),
        ],
        wsGatewayFile: AbsoluteFilePathStub({
          value: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
        }),
        paired: true,
      });

      expect(result).toStrictEqual({
        eventType: 'chat-output',
        emitterFile:
          '/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.ts',
        consumerFiles: ['/repo/packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts'],
        wsGatewayFile: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
        paired: true,
      });
    });

    it('VALID: {null emitterFile and gateway, paired=false} => parses successfully', () => {
      const result = wsEdgeContract.parse({
        eventType: ContentTextStub({ value: 'chat-output' }),
        emitterFile: null,
        consumerFiles: [
          AbsoluteFilePathStub({
            value: '/repo/packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts',
          }),
        ],
        wsGatewayFile: null,
        paired: false,
      });

      expect(result).toStrictEqual({
        eventType: 'chat-output',
        emitterFile: null,
        consumerFiles: ['/repo/packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts'],
        wsGatewayFile: null,
        paired: false,
      });
    });

    it('VALID: {empty consumerFiles, gateway present} => parses successfully', () => {
      const result = wsEdgeContract.parse({
        eventType: ContentTextStub({ value: 'chat-complete' }),
        emitterFile: AbsoluteFilePathStub({
          value: '/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.ts',
        }),
        consumerFiles: [],
        wsGatewayFile: AbsoluteFilePathStub({
          value: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
        }),
        paired: false,
      });

      expect(result).toStrictEqual({
        eventType: 'chat-complete',
        emitterFile:
          '/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.ts',
        consumerFiles: [],
        wsGatewayFile: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
        paired: false,
      });
    });
  });
});
