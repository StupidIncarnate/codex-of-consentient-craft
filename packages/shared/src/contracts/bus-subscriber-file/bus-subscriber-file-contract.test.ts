import { busSubscriberFileContract } from './bus-subscriber-file-contract';
import { BusSubscriberFileStub } from './bus-subscriber-file.stub';

describe('busSubscriberFileContract', () => {
  describe('parse', () => {
    it('VALID: {subscriberFile + busExportName} => parses successfully', () => {
      const result = busSubscriberFileContract.parse(BusSubscriberFileStub());

      expect(result).toStrictEqual({
        subscriberFile: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
        busExportName: 'orchestrationEventsState',
      });
    });
  });
});
