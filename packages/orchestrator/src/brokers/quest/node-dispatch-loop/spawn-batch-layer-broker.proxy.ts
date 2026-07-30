import { AbsoluteFilePathStub, GuildStub } from '@dungeonmaster/shared/contracts';
import type { GuildId, QuestId } from '@dungeonmaster/shared/contracts';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/testing';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
} from '@dungeonmaster/testing/register-mock';

import { guildGetBrokerProxy } from '../../guild/get/guild-get-broker.proxy';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { spawnOneAgentLayerBrokerProxy } from './spawn-one-agent-layer-broker.proxy';

// The batch layer's quest→guild lookup is mocked at the module boundary — its fs-walk behavior
// has its own test suite; here it only supplies the guildId for cwd resolution.
registerModuleMock({ module: '../find-quest-path/quest-find-quest-path-broker' });

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
  // The batch layer's own pre-stamp goes through questModifyBroker, so its proxy is wired here
  // too. Constructed BEFORE the per-agent proxy: quest-modify's proxy stages randomUUID as a
  // sticky passthrough, and the per-agent proxy's deterministic processId staging has to be the
  // later registration at the same `[]` address to win.
  questModifyBrokerProxy();
  // Owns the spawn, the sessionId stamp, the modify staging, and the deterministic processId —
  // the batch layer delegates every per-agent concern to it.
  const oneAgentProxy = spawnOneAgentLayerBrokerProxy();
  const guildProxy = guildGetBrokerProxy();
  const cwdProxy = cwdResolveBrokerProxy();
  // Instantiate the fs-level child proxy so its mock chain stays wired (dependency-discovery
  // lint); the module mock above supplies the actual return values.
  questFindQuestPathBrokerProxy();

  const findMock = registerMock({ fn: questFindQuestPathBroker });

  // Deterministic `startedAt` on the pre-stamp. toISOString takes no identifying argument, so
  // `[]` is the honest address.
  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns('2024-01-15T10:00:00.000Z');

  return {
    // The batch layer resolves guild context ONCE PER UNIQUE questId (deduped across however
    // many agents in the batch share it), so questId is the real, meaningful address — keying
    // on it is what lets a multi-quest batch test stage a DIFFERENT guild per quest correctly,
    // rather than trusting the resolution order to match staging order.
    setupQuestContext: ({
      questId,
      guildId,
      guildPath,
    }: {
      questId: QuestId;
      guildId: GuildId;
      guildPath: string;
    }): void => {
      findMock.calledWith([{ questId }]).resolves({
        questPath: AbsoluteFilePathStub({ value: `${guildPath}/quests/${questId}` }),
        guildId,
      });
      guildProxy.setupDirectGuild({ guild: GuildStub({ id: guildId, path: guildPath }) });
      cwdProxy.setupRepoRootFoundAtStart({ startPath: guildPath });
    },

    setupModifySucceeds: ({ times }: { times: number }): void => {
      oneAgentProxy.setupModifySucceeds({ times });
    },

    setupModifyRejectsOnce: ({ error }: { error: Error }): void => {
      oneAgentProxy.setupModifyRejectsOnce({ error });
    },

    setupSpawnEmitsSessionThenExits: ({
      sessionId,
      exitCode,
    }: {
      sessionId: string;
      exitCode: number;
    }): void => {
      oneAgentProxy.setupSpawnEmitsSessionThenExits({ sessionId, exitCode });
    },

    setupSpawnExitsWithoutSession: ({ exitCode }: { exitCode: number }): void => {
      oneAgentProxy.setupSpawnExitsWithoutSession({ exitCode });
    },

    getModifyCallInputs: (): readonly unknown[] => oneAgentProxy.getModifyCallInputs(),

    getFindQuestPathCalls: (): readonly unknown[] =>
      findMock.callsMatching([]).map((call) => call[0]),

    getSpawnedCwd: (): unknown => oneAgentProxy.getSpawnedCwd(),

    getSpawnedArgs: (): unknown => oneAgentProxy.getSpawnedArgs(),
  };
};
