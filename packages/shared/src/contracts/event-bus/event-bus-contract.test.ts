import { eventBusContract } from './event-bus-contract';
import { EventBusStub } from './event-bus.stub';

describe('eventBusContract', () => {
  describe('parse', () => {
    it('VALID: {stateFile + exportName} => parses successfully', () => {
      const result = eventBusContract.parse(EventBusStub());

      expect(result).toStrictEqual({
        stateFile:
          '/repo/packages/orchestrator/src/state/orchestration-events/orchestration-events-state.ts',
        exportName: 'orchestrationEventsState',
      });
    });
  });
});
