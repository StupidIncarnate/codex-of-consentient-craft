/**
 * PURPOSE: Proxy for questRunStepBroker — stages the quest file at its exact path so the real
 * questOperationsUpdateBroker runs twice (the `in_progress` stamp, then the record) and every read
 * of that path is answered, and STUBS the handler itself. What this broker adds is the RECORD;
 * which handler ran and how it classified is `stepHandlerRunBroker`'s own suite.
 *
 * USAGE:
 * const proxy = questRunStepBrokerProxy();
 * proxy.setupQuest({ quest });
 * proxy.handlerReturns({ result: StepHandlerResultStub({ outcome: 'done' }) });
 * // ...call questRunStepBroker...
 * expect(proxy.getPersistedQuest().workItems[0].declaredWord).toBe('done');
 *
 * Each update reads the SEEDED quest: the read is staged once, statically, by its path. The record
 * update depends only on the seeded work item, and `getAllPersistedQuests` still shows the
 * `in_progress` stamp as the first of the two writes.
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

import type { StepHandlerResultStub } from '../../../contracts/step-handler-result/step-handler-result.stub';
import { stepHandlerRunBroker } from '../../step-handler/run/step-handler-run-broker';
import { stepHandlerRunBrokerProxy } from '../../step-handler/run/step-handler-run-broker.proxy';
import { questOperationsUpdateBrokerProxy } from '../operations-update/quest-operations-update-broker.proxy';

registerModuleMock({ module: '../../step-handler/run/step-handler-run-broker' });

type QuestInput = ReturnType<typeof QuestStub>;
type StepHandlerResult = ReturnType<typeof StepHandlerResultStub>;
// The handler's own parameter object. `callsMatching` hands back `unknown[][]`, which is genuinely
// all the mock knows; naming the shape through the function it recorded is the one place that
// information exists.
type HandlerCall = Parameters<typeof stepHandlerRunBroker>[0];

// `stepHandlerWardBrokerProxy`, composed through `stepHandlerRunBrokerProxy`, module-mocks
// `questFindQuestPathBroker` to answer `guilds/g1/quests/add-auth` for every quest in any suite that
// loads it, this one included. The quest file is staged where that lookup points, not under the
// quest stub's own folder.
const MOCKED_GUILD_DIR = 'g1';
const MOCKED_QUEST_FOLDER = 'add-auth';

export const questRunStepBrokerProxy = (): {
  setupQuest: (params: { quest: QuestInput }) => void;
  handlerReturns: (params: { result: StepHandlerResult }) => void;
  getHandlerCalls: () => readonly HandlerCall[];
  getPersistedQuest: () => Quest;
  getAllPersistedQuests: () => readonly Quest[];
} => {
  // Composed first: the ward handler's proxy stages its own `questFindQuestPathBroker` answer, and
  // the update proxy's real-broker default for that function would replace it if it came later.
  const updateProxy = questOperationsUpdateBrokerProxy();
  stepHandlerRunBrokerProxy();
  const handlerHandle = registerMock({ fn: stepHandlerRunBroker });

  return {
    setupQuest: ({ quest }: { quest: QuestInput }): void => {
      updateProxy.setupQuestOnDisk({
        quest,
        guildDirName: MOCKED_GUILD_DIR,
        folderName: MOCKED_QUEST_FOLDER,
      });
    },

    handlerReturns: ({ result }: { result: StepHandlerResult }): void => {
      handlerHandle.calledWith([]).resolves(result);
    },

    getHandlerCalls: (): readonly HandlerCall[] =>
      handlerHandle.callsMatching([]).map((call) => call[0] as HandlerCall),

    getPersistedQuest: (): Quest => updateProxy.getLastPersistedQuest(),

    getAllPersistedQuests: (): readonly Quest[] => updateProxy.getAllPersistedQuests(),
  };
};
