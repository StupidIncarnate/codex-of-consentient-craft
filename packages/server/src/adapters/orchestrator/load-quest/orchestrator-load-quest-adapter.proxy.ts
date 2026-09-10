import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';

type Quest = ReturnType<typeof QuestStub>;

export const orchestratorLoadQuestAdapterProxy = (): {
  returns: (params: { questId: QuestId; quest: Quest }) => void;
  throws: (params: { questId: QuestId; error: Error }) => void;
  // ONE-SHOT staging, consumed in REGISTRATION order (first registered answers the first call
  // for that questId, whatever finishes it — see mock-staged-best-match-transformer). Lets a test
  // hand two SUCCESSIVE calls for the same questId two DIFFERENT quest snapshots, which a sticky
  // `returns()` cannot do (a later `returns()` for the same questId overwrites every prior call).
  returnsOnce: (params: { questId: QuestId; quest: Quest }) => void;
  // Same one-shot ordering as `returnsOnce`, but resolves after `delayMs` instead of immediately —
  // for reproducing two overlapping loads that finish OUT OF the order they were issued in.
  returnsOnceDelayed: (params: { questId: QuestId; quest: Quest; delayMs: number }) => void;
} => {
  const mock = registerMock({ fn: StartOrchestrator.loadQuest });

  return {
    returns: ({ questId, quest }: { questId: QuestId; quest: Quest }): void => {
      mock.calledWith([{ questId }]).resolves(quest);
    },
    throws: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      mock.calledWith([{ questId }]).rejects(error);
    },
    returnsOnce: ({ questId, quest }: { questId: QuestId; quest: Quest }): void => {
      mock.onceFor([{ questId }]).resolves(quest);
    },
    returnsOnceDelayed: ({
      questId,
      quest,
      delayMs,
    }: {
      questId: QuestId;
      quest: Quest;
      delayMs: number;
    }): void => {
      mock.onceFor([{ questId }]).implement(
        async () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(quest);
            }, delayMs);
          }),
      );
    },
  };
};
