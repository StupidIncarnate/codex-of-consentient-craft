import { busEmitterSiteContract } from './bus-emitter-site-contract';

describe('busEmitterSiteContract', () => {
  describe('parse', () => {
    it('VALID: {full record} => parses successfully', () => {
      const result = busEmitterSiteContract.parse({
        emitterFile: '/repo/packages/orchestrator/src/responders/chat/replay/chat-replay-responder.ts',
        eventType: 'chat-output',
        busExportName: 'orchestrationEventsState',
      });

      expect(result).toStrictEqual({
        emitterFile:
          '/repo/packages/orchestrator/src/responders/chat/replay/chat-replay-responder.ts',
        eventType: 'chat-output',
        busExportName: 'orchestrationEventsState',
      });
    });
  });
});
