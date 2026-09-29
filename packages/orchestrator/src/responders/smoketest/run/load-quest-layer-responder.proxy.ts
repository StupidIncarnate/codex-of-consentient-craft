/**
 * PURPOSE: Proxy for LoadQuestLayerResponder — registerModuleMock so sibling enqueue-* layer
 * responder tests can inject a known Quest without driving the file-system chain. The
 * responder's own test drives the real chain through setupPassthrough + setupQuestFound,
 * addressing this responder's own join(questPath, quest.json) call by its exact tuple — never
 * the shared real-passthrough default questFindQuestPathBrokerProxy's own join calls compose
 * (the "passthrough join composed from far away" trap).
 */

import type { FilePath } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';
import { join } from '#gateway/node/path';

import { questFindQuestPathBrokerProxy } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../../../brokers/quest/load/quest-load-broker.proxy';
import { LoadQuestLayerResponder } from './load-quest-layer-responder';

registerModuleMock({ module: './load-quest-layer-responder' });

type Quest = ReturnType<typeof QuestStub>;

export const LoadQuestLayerResponderProxy = (): {
  reset: () => void;
  setupReturnsQuest: (params: { quest: Quest }) => void;
  setupPassthrough: () => void;
  getCallArgs: () => readonly unknown[][];
  setupQuestFound: ReturnType<typeof questFindQuestPathBrokerProxy>['setupQuestFound'];
  setupQuestFile: ReturnType<typeof questLoadBrokerProxy>['setupQuestFile'];
  setupQuestFileJoin: (params: { questPath: FilePath; questFilePath: FilePath }) => void;
  getQuestFileJoinArgs: (params: { questPath: FilePath }) => readonly unknown[][];
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const loadProxy = questLoadBrokerProxy();
  const joinHandle = registerMock({ fn: join });

  const mocked = LoadQuestLayerResponder as jest.MockedFunction<typeof LoadQuestLayerResponder>;

  return {
    reset: (): void => {
      // Child proxies self-reset via jest.clearAllMocks between tests.
    },
    setupReturnsQuest: ({ quest }: { quest: Quest }): void => {
      mocked.mockResolvedValueOnce(quest);
    },
    setupPassthrough: (): void => {
      const realMod = requireActual<{ LoadQuestLayerResponder: typeof LoadQuestLayerResponder }>({
        module: './load-quest-layer-responder',
      });
      mocked.mockImplementation(realMod.LoadQuestLayerResponder);
    },
    getCallArgs: (): readonly unknown[][] => mocked.mock.calls,
    setupQuestFound: findQuestPathProxy.setupQuestFound,
    setupQuestFile: loadProxy.setupQuestFile,
    setupQuestFileJoin: ({
      questPath,
      questFilePath,
    }: {
      questPath: FilePath;
      questFilePath: FilePath;
    }): void => {
      joinHandle.calledWith([questPath, locationsStatics.quest.questFile]).returns(questFilePath);
    },
    getQuestFileJoinArgs: ({ questPath }: { questPath: FilePath }): readonly unknown[][] =>
      joinHandle.callsMatching([questPath]),
  };
};
