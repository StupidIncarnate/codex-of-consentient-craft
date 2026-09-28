import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { questFindQuestPathBrokerProxy } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../../../brokers/quest/load/quest-load-broker.proxy';
import { QuestLoadResponder } from './quest-load-responder';

export const QuestLoadResponderProxy = (): {
  callResponder: typeof QuestLoadResponder;
  setupQuestFound: ReturnType<typeof questFindQuestPathBrokerProxy>['setupQuestFound'];
  setupQuestFile: ReturnType<typeof questLoadBrokerProxy>['setupQuestFile'];
  // Exact-tuple join staging, not the shared real-passthrough default: `questFindQuestPathBrokerProxy`
  // resolves questPath through its own join tuples, and this responder's own SEPARATE
  // join(questPath, quest.json) call needs its own address — see the "passthrough join composed
  // from far away" trap.
  setupQuestFileJoin: (params: { questPath: FilePath; questFilePath: FilePath }) => void;
  getQuestFileJoinArgs: (params: { questPath: FilePath }) => readonly unknown[][];
} => {
  const findProxy = questFindQuestPathBrokerProxy();
  const loadProxy = questLoadBrokerProxy();
  const joinHandle = registerMock({ fn: join });

  return {
    callResponder: QuestLoadResponder,
    setupQuestFound: findProxy.setupQuestFound,
    setupQuestFile: loadProxy.setupQuestFile,
    setupQuestFileJoin: ({ questPath, questFilePath }): void => {
      joinHandle.calledWith([questPath, locationsStatics.quest.questFile]).returns(questFilePath);
    },
    getQuestFileJoinArgs: ({ questPath }): readonly unknown[][] =>
      joinHandle.callsMatching([questPath]),
  };
};
