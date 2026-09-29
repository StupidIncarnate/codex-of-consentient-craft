/**
 * PURPOSE: Proxy for stepHandlerCommitBroker — stages the git gateway calls through their own proxies
 * and module-mocks gitWorkingTreeFilesBroker, questCwdResolveBroker and questGetBroker directly, each of which
 * carries its own dedicated test suite, exactly as the ward and riftcarver handler proxies treat
 * their own sibling brokers. `questWithModifyLockBroker` runs REAL (a plain in-memory mutex, reset
 * between tests via its own proxy) so the lock's real behaviour is exercised rather than assumed.
 *
 * USAGE:
 * const proxy = stepHandlerCommitBrokerProxy();
 * proxy.setupWorktree({ worktreePath: '/repo/worktrees/add-auth' });
 * proxy.setupQuest({ quest });
 * proxy.setupWorkingTreeFiles({ files: ['packages/auth/src/x.ts'] });
 * const result = await stepHandlerCommitBroker({ args: [], questId, workItemId, onLine: () => undefined });
 */

import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';
import { GetQuestResultStub } from '@dungeonmaster/shared/contracts/get-quest-result/get-quest-result.stub';
import { RepoRootCwdStub } from '@dungeonmaster/shared/contracts/repo-root-cwd/repo-root-cwd.stub';
import { RepoRelativePathStub } from '@dungeonmaster/shared/contracts/repo-relative-path/repo-relative-path.stub';
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

export const stepHandlerCommitBrokerProxy = (): {
  setupWorktree: (params: { worktreePath: string }) => void;
  setupWorktreeMissing: (params: { worktreePath: string }) => void;
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
  workingTreeMock.calledWith([]).resolves([]);

  const cwdMock = registerMock({ fn: questCwdResolveBroker });
  cwdMock.calledWith([]).resolves(
    QuestCwdResolutionStub({
      kind: 'worktree',
      cwd: RepoRootCwdStub({ value: '/repo/worktrees/add-auth' }),
    }),
  );

  const getMock = registerMock({ fn: questGetBroker });

  return {
    setupWorktree: ({ worktreePath }: { worktreePath: string }): void => {
      cwdMock.calledWith([]).resolves(
        QuestCwdResolutionStub({
          kind: 'worktree',
          cwd: RepoRootCwdStub({ value: worktreePath }),
        }),
      );
    },

    setupWorktreeMissing: ({ worktreePath }: { worktreePath: string }): void => {
      cwdMock.calledWith([]).resolves(
        QuestCwdResolutionStub({
          kind: 'missing-worktree',
          worktreePath: AbsoluteFilePathStub({ value: worktreePath }),
        }),
      );
    },

    setupQuest: ({ quest }: { quest: Quest }): void => {
      getMock.calledWith([]).resolves(GetQuestResultStub({ success: true, quest }));
    },

    setupWorkingTreeFiles: ({ files }: { files: readonly string[] }): void => {
      workingTreeMock
        .calledWith([])
        .resolves(files.map((file) => RepoRelativePathStub({ value: file })));
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
