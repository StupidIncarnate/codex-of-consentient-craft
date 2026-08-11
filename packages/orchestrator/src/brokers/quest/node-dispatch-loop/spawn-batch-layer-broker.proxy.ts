import { AbsoluteFilePathStub, RepoRootCwdStub } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
} from '@dungeonmaster/testing/register-mock';

import { QuestCwdResolutionStub } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution.stub';
import { questCwdResolveBroker } from '../cwd-resolve/quest-cwd-resolve-broker';
import { questCwdResolveBrokerProxy } from '../cwd-resolve/quest-cwd-resolve-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { spawnOneAgentLayerBrokerProxy } from './spawn-one-agent-layer-broker.proxy';

// The batch layer's cwd resolution is mocked at the module boundary — questCwdResolveBroker's own
// worktree / repo-root / missing-worktree branching has its own test suite; here it only supplies
// the resolved cwd (or the missing path) per quest.
registerModuleMock({ module: '../cwd-resolve/quest-cwd-resolve-broker' });

export const spawnBatchLayerBrokerProxy = (): {
  setupQuestContext: (params: { questId: QuestId; guildPath: string }) => void;
  setupQuestWorktree: (params: { questId: QuestId; worktreePath: string }) => void;
  setupQuestWorktreeMissing: (params: { questId: QuestId; worktreePath: string }) => void;
  setupModifySucceeds: (params: { times: number }) => void;
  setupModifyRejectsOnce: (params: { error: Error }) => void;
  setupSpawnEmitsSessionThenExits: (params: { sessionId: string; exitCode: number }) => void;
  setupSpawnExitsWithoutSession: (params: { exitCode: number }) => void;
  getModifyCallInputs: () => readonly unknown[];
  getCwdResolveCalls: () => readonly unknown[];
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
  // Wired to satisfy enforce-proxy-child-creation; the module mock above supplies the actual
  // return values, so this child's own internal fs/broker mocks are never exercised.
  questCwdResolveBrokerProxy();

  const cwdMock = registerMock({ fn: questCwdResolveBroker });

  // Deterministic `startedAt` on the pre-stamp. toISOString takes no identifying argument, so
  // `[]` is the honest address.
  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns('2024-01-15T10:00:00.000Z');

  return {
    // The batch layer resolves cwd ONCE PER UNIQUE questId (deduped across however many agents in
    // the batch share it), so questId is the real, meaningful address — keying on it is what lets
    // a multi-quest batch test stage a DIFFERENT resolution per quest correctly, rather than
    // trusting the resolution order to match staging order.
    setupQuestContext: ({ questId, guildPath }: { questId: QuestId; guildPath: string }): void => {
      cwdMock
        .calledWith([{ questId }])
        .resolves(
          QuestCwdResolutionStub({ kind: 'repo-root', cwd: RepoRootCwdStub({ value: guildPath }) }),
        );
    },

    setupQuestWorktree: ({
      questId,
      worktreePath,
    }: {
      questId: QuestId;
      worktreePath: string;
    }): void => {
      cwdMock.calledWith([{ questId }]).resolves(
        QuestCwdResolutionStub({
          kind: 'worktree',
          cwd: RepoRootCwdStub({ value: worktreePath }),
        }),
      );
    },

    setupQuestWorktreeMissing: ({
      questId,
      worktreePath,
    }: {
      questId: QuestId;
      worktreePath: string;
    }): void => {
      cwdMock.calledWith([{ questId }]).resolves(
        QuestCwdResolutionStub({
          kind: 'missing-worktree',
          worktreePath: AbsoluteFilePathStub({ value: worktreePath }),
        }),
      );
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

    getCwdResolveCalls: (): readonly unknown[] => cwdMock.callsMatching([]).map((call) => call[0]),

    getSpawnedCwd: (): unknown => oneAgentProxy.getSpawnedCwd(),

    getSpawnedArgs: (): unknown => oneAgentProxy.getSpawnedArgs(),
  };
};
