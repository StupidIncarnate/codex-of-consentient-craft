import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ModifyQuestResult } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';

// questId is optional: a caller that discards the result and doesn't have the questId available
// at proxy-construction time (e.g. DesignStartResponderProxy, which fires-and-forgets a status
// update after scaffolding) can omit it, which falls back to calledWith([]) — a real wildcard,
// staged explicitly by whichever proxy calls it, not a hidden default.
export const orchestratorModifyQuestAdapterProxy = (): {
  returns: (params: { questId?: string; result: ModifyQuestResult }) => void;
  throws: (params: { questId?: string; error: Error }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.modifyQuest });

  return {
    returns: ({ questId, result }: { questId?: string; result: ModifyQuestResult }): void => {
      mock.calledWith(questId === undefined ? [] : [{ questId }]).resolves(result);
    },
    throws: ({ questId, error }: { questId?: string; error: Error }): void => {
      mock.calledWith(questId === undefined ? [] : [{ questId }]).rejects(error);
    },
  };
};
