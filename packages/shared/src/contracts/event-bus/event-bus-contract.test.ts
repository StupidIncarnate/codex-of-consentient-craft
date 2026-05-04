import { eventBusContract } from './event-bus-contract';
import { ContentTextStub } from '../content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';

describe('eventBusContract', () => {
  describe('parse', () => {
    it('VALID: {stateFile + exportName} => parses successfully', () => {
      const result = eventBusContract.parse({
        stateFile: AbsoluteFilePathStub({
          value:
            '/repo/packages/orchestrator/src/state/orchestration-events/orchestration-events-state.ts',
        }),
        exportName: ContentTextStub({ value: 'orchestrationEventsState' }),
      });

      expect(result).toStrictEqual({
        stateFile:
          '/repo/packages/orchestrator/src/state/orchestration-events/orchestration-events-state.ts',
        exportName: 'orchestrationEventsState',
      });
    });
  });
});
