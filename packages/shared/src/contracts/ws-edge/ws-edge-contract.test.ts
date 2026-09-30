import { wsEdgeContract } from './ws-edge-contract';
import { WsEdgeStub } from './ws-edge.stub';

describe('wsEdgeContract', () => {
  describe('parse', () => {
    it('VALID: {full paired edge with gateway} => parses successfully', () => {
      const edge = WsEdgeStub();

      const result = wsEdgeContract.parse({
        eventType: 'chat-output',
        emitterFile:
          '/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.ts',
        consumerFiles: ['/repo/packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts'],
        wsGatewayFile: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
        paired: true,
      });

      expect(result).toStrictEqual(edge);
    });

    it('VALID: {null emitterFile and gateway, paired=false} => parses successfully', () => {
      const result = wsEdgeContract.parse({
        eventType: 'chat-output',
        emitterFile: null,
        consumerFiles: ['/repo/packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts'],
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
        eventType: 'chat-complete',
        emitterFile:
          '/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.ts',
        consumerFiles: [],
        wsGatewayFile: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
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
