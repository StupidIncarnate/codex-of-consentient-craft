import { busSubscriberFileContract } from './bus-subscriber-file-contract';
import { ContentTextStub } from '../content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';

describe('busSubscriberFileContract', () => {
  describe('parse', () => {
    it('VALID: {subscriberFile + busExportName} => parses successfully', () => {
      const result = busSubscriberFileContract.parse({
        subscriberFile: AbsoluteFilePathStub({
          value: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
        }),
        busExportName: ContentTextStub({ value: 'orchestrationEventsState' }),
      });

      expect(result).toStrictEqual({
        subscriberFile: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
        busExportName: 'orchestrationEventsState',
      });
    });
  });
});
