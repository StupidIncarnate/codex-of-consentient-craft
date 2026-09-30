import { busSubscriberFileContract } from './bus-subscriber-file-contract';

describe('busSubscriberFileContract', () => {
  describe('parse', () => {
    it('VALID: {subscriberFile + busExportName} => parses successfully', () => {
      const result = busSubscriberFileContract.parse({
        subscriberFile: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
        busExportName: 'orchestrationEventsState',
      });

      expect(result).toStrictEqual({
        subscriberFile: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
        busExportName: 'orchestrationEventsState',
      });
    });
  });
});
