import { ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { ChatStopAllResponderProxy } from './chat-stop-all-responder.proxy';

describe('ChatStopAllResponder', () => {
  describe('with active processes', () => {
    it('VALID: {two active processes} => kills all and clears state', () => {
      const proxy = ChatStopAllResponderProxy();
      const kill1 = jest.fn();
      const kill2 = jest.fn();
      const processId1 = ProcessIdStub({ value: 'chat-1' });
      const processId2 = ProcessIdStub({ value: 'chat-2' });
      const questId1 = QuestIdStub({ value: 'quest-1' });
      const questId2 = QuestIdStub({ value: 'quest-2' });
      proxy.setupWithProcess({ processId: processId1, questId: questId1, kill: kill1 });
      orchestrationProcessesState.register({
        orchestrationProcess: { processId: processId2, questId: questId2, kill: kill2 },
      });

      proxy.callResponder();

      expect(kill1).toHaveBeenCalledTimes(1);
      expect(kill2).toHaveBeenCalledTimes(1);
      expect(orchestrationProcessesState.has({ processId: processId1 })).toBe(false);
      expect(orchestrationProcessesState.has({ processId: processId2 })).toBe(false);
    });
  });

  describe('with no active processes', () => {
    it('EMPTY: {no processes} => getAll returns empty after call', () => {
      const proxy = ChatStopAllResponderProxy();
      proxy.setupEmpty();

      proxy.callResponder();

      expect(orchestrationProcessesState.getAll()).toStrictEqual([]);
    });
  });
});
