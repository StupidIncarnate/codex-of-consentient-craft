import { eventBusContextContract } from './event-bus-context-contract';
import { EventBusContextStub } from './event-bus-context.stub';

describe('eventBusContextContract', () => {
  describe('parse', () => {
    it('VALID: {empty arrays via stub} => parses successfully', () => {
      const result = EventBusContextStub();

      expect(result).toStrictEqual({
        buses: [],
        emitterSites: [],
        subscriberFiles: [],
      });
    });

    it('VALID: {direct parse with empty arrays} => parses successfully', () => {
      const result = eventBusContextContract.parse({
        buses: [],
        emitterSites: [],
        subscriberFiles: [],
      });

      expect(result).toStrictEqual({
        buses: [],
        emitterSites: [],
        subscriberFiles: [],
      });
    });
  });
});
