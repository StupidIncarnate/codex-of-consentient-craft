import { eventBusContract } from './event-bus-contract';

describe('eventBusContract', () => {
  describe('parse', () => {
    it('VALID: {stateFile + exportName} => parses successfully', () => {
      const result = eventBusContract.parse({
        stateFile:
          '/repo/packages/orchestrator/src/state/orchestration-events/orchestration-events-state.ts',
        exportName: 'orchestrationEventsState',
      });

      expect(result).toStrictEqual({
        stateFile:
          '/repo/packages/orchestrator/src/state/orchestration-events/orchestration-events-state.ts',
        exportName: 'orchestrationEventsState',
      });
    });
  });
});
