/**
 * PURPOSE: Proxy for stepHandlerCommitBroker — stages the git gateway calls through their own proxies
 * and module-mocks gitWorkingTreeFilesBroker, questCwdResolveBroker and questGetBroker directly, each of which
 * carries its own dedicated test suite, exactly as the ward and riftcarver handler proxies treat
 * their own sibling brokers. `questWithModifyLockBroker` runs REAL (a plain in-memory mutex, reset
 * between tests via its own proxy) so the lock's real behaviour is exercised rather than assumed.
 *
 * USAGE:
 * const proxy = stepHandlerCommitBrokerProxy();
 * proxy.setupQuest({ quest });
 * proxy.setupWorktree({ questId: quest.id, worktreePath: '/repo/worktrees/add-auth' });
 * proxy.setupWorkingTreeFiles({ files: ['packages/auth/src/x.ts'] });
 * const result = await stepHandlerCommitBroker({ args: [], questId, workItemId, onLine: () => undefined });
 */

import { GetQuestResultStub } from '@dungeonmaster/shared/contracts/get-quest-result/get-quest-result.stub';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { addAllProxy } from '#gateway/bin/git/add-all/add-all.proxy';
import { commitProxy } from '#gateway/bin/git/commit/commit.proxy';
import { pushProxy } from '#gateway/bin/git/push/push.proxy';
import { QuestCwdResolutionStub } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution.stub';
import { gitWorkingTreeFilesBroker } from '../../git/working-tree-files/git-working-tree-files-broker';
import { gitWorkingTreeFilesBrokerProxy } from '../../git/working-tree-files/git-working-tree-files-broker.proxy';
import { questCwdResolveBroker } from '../../quest/cwd-resolve/quest-cwd-resolve-broker';
import { questCwdResolveBrokerProxy } from '../../quest/cwd-resolve/quest-cwd-resolve-broker.proxy';
import { questGetBroker } from '../../quest/get/quest-get-broker';
import { questGetBrokerProxy } from '../../quest/get/quest-get-broker.proxy';
import { questWithModifyLockBrokerProxy } from '../../quest/with-modify-lock/quest-with-modify-lock-broker.proxy';

registerModuleMock({ module: '../../git/working-tree-files/git-working-tree-files-broker' });
registerModuleMock({ module: '../../quest/cwd-resolve/quest-cwd-resolve-broker' });
registerModuleMock({ module: '../../quest/get/quest-get-broker' });

type QuestResult = ReturnType<typeof GetQuestResultStub>;
type Quest = NonNullable<QuestResult['quest']>;

const DEFAULT_WORKTREE_PATH = '/repo/worktrees/add-auth';

export const stepHandlerCommitBrokerProxy = (): {
  setupWorktree: (params: { questId: Quest['id']; worktreePath: string }) => void;
  setupWorktreeMissing: (params: { questId: Quest['id']; worktreePath: string }) => void;
  setupQuest: (params: { quest: Quest }) => void;
  setupWorkingTreeFiles: (params: { files: readonly string[] }) => void;
  setupPushFails: (params: { output: string }) => void;
  getPushCall: () => unknown;
  getCommitMessage: () => unknown;
} => {
  // Inert — satisfies enforce-proxy-child-creation. The module mocks above replace every one of
  // these brokers' exports; each proxy's own internal staging is never exercised.
  const gitAddAllProxy = addAllProxy();
  const gitCommitProxy = commitProxy();
  gitAddAllProxy.setupResult({ exitCode: 0, output: '' });
  gitCommitProxy.returnsMatchingMessage({
    message: (arg: unknown): boolean => typeof arg === 'string',
    allowEmpty: true,
    exitCode: 0,
    output: '',
  });

  const gitPushProxy = pushProxy();
  gitPushProxy.setupPlainPush({ exitCode: 0, output: '' });
  gitWorkingTreeFilesBrokerProxy();
  questCwdResolveBrokerProxy();
  questGetBrokerProxy();
  const lockProxy = questWithModifyLockBrokerProxy();
  lockProxy.setupEmpty();

  const workingTreeMock = registerMock({ fn: gitWorkingTreeFilesBroker });
  const cwdMock = registerMock({ fn: questCwdResolveBroker });
  const getMock = registerMock({ fn: questGetBroker });

  return {
    setupWorktree: ({
      questId,
      worktreePath,
    }: {
      questId: Quest['id'];
      worktreePath: string;
    }): void => {
      cwdMock.calledWith([{ questId }]).resolves(
        QuestCwdResolutionStub({
          kind: 'worktree',
          cwd: worktreePath,
        }),
      );
    },

    setupWorktreeMissing: ({
      questId,
      worktreePath,
    }: {
      questId: Quest['id'];
      worktreePath: string;
    }): void => {
      cwdMock.calledWith([{ questId }]).resolves(
        QuestCwdResolutionStub({
          kind: 'missing-worktree',
          worktreePath,
        }),
      );
    },

    // Stages the quest read, the default worktree the quest resolves to, and a clean tree in it —
    // each addressed by the exact argument the broker passes. `setupWorktree`,
    // `setupWorktreeMissing` and `setupWorkingTreeFiles` restage the same addresses afterwards.
    setupQuest: ({ quest }: { quest: Quest }): void => {
      getMock
        .calledWith([{ input: { questId: quest.id } }])
        .resolves(GetQuestResultStub({ success: true, quest }));
      cwdMock.calledWith([{ questId: quest.id }]).resolves(
        QuestCwdResolutionStub({
          kind: 'worktree',
          cwd: DEFAULT_WORKTREE_PATH,
        }),
      );
      workingTreeMock.calledWith([{ cwd: DEFAULT_WORKTREE_PATH }]).resolves([]);
    },

    setupWorkingTreeFiles: ({ files }: { files: readonly string[] }): void => {
      workingTreeMock
        .calledWith([{ cwd: DEFAULT_WORKTREE_PATH }])
        .resolves(files.map((file) => file));
    },

    setupPushFails: ({ output }: { output: string }): void => {
      gitPushProxy.setupPlainPush({ exitCode: 1, output });
    },

    getPushCall: (): unknown => gitPushProxy.getCallsFor().at(-1)?.at(0),

    getCommitMessage: (): unknown => {
      const calls = gitCommitProxy.getCallsFor({
        message: (arg: unknown): boolean => typeof arg === 'string',
        allowEmpty: true,
      });
      const lastCall = calls.at(-1);
      if (lastCall === undefined) {
        return undefined;
      }
      const item = lastCall.at(0);
      if (typeof item === 'object' && item !== null && 'args' in item) {
        const args = Array.isArray(item.args) ? item.args : [];
        const messageIndex = 2;
        return args[messageIndex];
      }
      return undefined;
    },
  };
};
