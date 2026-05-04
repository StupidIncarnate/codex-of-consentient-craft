import { busEmitterSiteContract } from './bus-emitter-site-contract';
import { ContentTextStub } from '../content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';

describe('busEmitterSiteContract', () => {
  describe('parse', () => {
    it('VALID: {full record} => parses successfully', () => {
      const result = busEmitterSiteContract.parse({
        emitterFile: AbsoluteFilePathStub({
          value: '/repo/packages/orchestrator/src/responders/chat/replay/chat-replay-responder.ts',
        }),
        eventType: ContentTextStub({ value: 'chat-output' }),
        busExportName: ContentTextStub({ value: 'orchestrationEventsState' }),
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
