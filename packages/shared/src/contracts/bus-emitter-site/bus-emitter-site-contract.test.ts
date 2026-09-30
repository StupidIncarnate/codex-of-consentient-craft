import { busEmitterSiteContract } from './bus-emitter-site-contract';
import { BusEmitterSiteStub } from './bus-emitter-site.stub';

describe('busEmitterSiteContract', () => {
  describe('parse', () => {
    it('VALID: {stub defaults} => parses to the stub record', () => {
      const site = BusEmitterSiteStub();

      expect(busEmitterSiteContract.parse(site)).toStrictEqual(site);
    });

    it('VALID: {full record} => parses successfully', () => {
      const result = busEmitterSiteContract.parse({
        emitterFile:
          '/repo/packages/orchestrator/src/responders/chat/replay/chat-replay-responder.ts',
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
