import { AbsoluteFilePathStub, GuildStub } from '@dungeonmaster/shared/contracts';
import type { GuildId, QuestId } from '@dungeonmaster/shared/contracts';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/testing';
import { registerModuleMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { agentSpawnUnifiedBrokerProxy } from '../../agent/spawn-unified/agent-spawn-unified-broker.proxy';
import { guildGetBrokerProxy } from '../../guild/get/guild-get-broker.proxy';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

// The batch layer's quest→guild lookup is mocked at the module boundary — its fs-walk behavior
// has its own test suite; here it only supplies the guildId for cwd resolution.
registerModuleMock({ module: '../find-quest-path/quest-find-quest-path-broker' });

const PROCESS_UUID = '00000000-0000-4000-8000-00000000d15b';

export const spawnBatchLayerBrokerProxy = (): {
  setupQuestContext: (params: { questId: QuestId; guildId: GuildId; guildPath: string }) => void;
  setupModifySucceeds: (params: { times: number }) => void;
  setupModifyRejectsOnce: (params: { error: Error }) => void;
  setupSpawnEmitsSessionThenExits: (params: { sessionId: string; exitCode: number }) => void;
  setupSpawnExitsWithoutSession: (params: { exitCode: number }) => void;
  getModifyCallInputs: () => readonly unknown[];
  getFindQuestPathCalls: () => readonly unknown[];
  getSpawnedCwd: () => unknown;
  getSpawnedArgs: () => unknown;
} => {
  const spawnProxy = agentSpawnUnifiedBrokerProxy();
  const guildProxy = guildGetBrokerProxy();
  const cwdProxy = cwdResolveBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  // Instantiate the fs-level child proxy so its mock chain stays wired (dependency-discovery
  // lint); the module mock above supplies the actual return values.
  questFindQuestPathBrokerProxy();

  const findMock = questFindQuestPathBroker as jest.MockedFunction<typeof questFindQuestPathBroker>;

  // Deterministic processId for the stderr tag + registerProcess assertion.
  registerSpyOn({ object: crypto, method: 'randomUUID' }).mockReturnValue(PROCESS_UUID);
  registerSpyOn({ object: Date.prototype, method: 'toISOString' }).mockReturnValue(
    '2024-01-15T10:00:00.000Z',
  );

  return {
    setupQuestContext: ({
      questId,
      guildId,
      guildPath,
    }: {
      questId: QuestId;
      guildId: GuildId;
      guildPath: string;
    }): void => {
      findMock.mockResolvedValueOnce({
        questPath: AbsoluteFilePathStub({ value: `${guildPath}/quests/${questId}` }),
        guildId,
      });
      guildProxy.setupDirectGuild({ guild: GuildStub({ id: guildId, path: guildPath }) });
      cwdProxy.setupRepoRootFoundAtStart({ startPath: guildPath });
    },

    setupModifySucceeds: ({ times }: { times: number }): void => {
      Array.from({ length: times }).forEach(() => {
        modifyProxy.setupResolveSuccessOnce();
      });
    },

    setupModifyRejectsOnce: ({ error }: { error: Error }): void => {
      modifyProxy.setupReject({ error });
    },

    setupSpawnEmitsSessionThenExits: ({
      sessionId,
      exitCode,
    }: {
      sessionId: string;
      exitCode: number;
    }): void => {
      spawnProxy.setupSpawnAndEmitLines({
        lines: [JSON.stringify({ session_id: sessionId })],
        exitCode,
      });
    },

    setupSpawnExitsWithoutSession: ({ exitCode }: { exitCode: number }): void => {
      spawnProxy.setupSpawnAndEmitLines({ lines: [], exitCode });
    },

    getModifyCallInputs: (): readonly unknown[] => modifyProxy.getCallInputs(),

    getFindQuestPathCalls: (): readonly unknown[] => findMock.mock.calls.map((call) => call[0]),

    getSpawnedCwd: (): unknown => spawnProxy.getSpawnedCwd(),

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),
  };
};
