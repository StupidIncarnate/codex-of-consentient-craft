/**
 * PURPOSE: Proxy for stepHandlerCommitBroker — module-mocks the three git adapters,
 * gitWorkingTreeFilesBroker, questCwdResolveBroker and questGetBroker directly, each of which
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

import {
  AbsoluteFilePathStub,
  ExitCodeStub,
  GetQuestResultStub,
  RepoRootCwdStub,
  RepoRelativePathStub,
  type ExitCode,
} from '@dungeonmaster/shared/contracts';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { gitAddAllAdapter } from '../../../adapters/git/add-all/git-add-all-adapter';
import { gitAddAllAdapterProxy } from '../../../adapters/git/add-all/git-add-all-adapter.proxy';
import { gitCommitAdapter } from '../../../adapters/git/commit/git-commit-adapter';
import { gitCommitAdapterProxy } from '../../../adapters/git/commit/git-commit-adapter.proxy';
import { gitPushAdapter } from '../../../adapters/git/push/git-push-adapter';
import { gitPushAdapterProxy } from '../../../adapters/git/push/git-push-adapter.proxy';
import { QuestCwdResolutionStub } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution.stub';
import { gitWorkingTreeFilesBroker } from '../../git/working-tree-files/git-working-tree-files-broker';
import { gitWorkingTreeFilesBrokerProxy } from '../../git/working-tree-files/git-working-tree-files-broker.proxy';
import { questCwdResolveBroker } from '../../quest/cwd-resolve/quest-cwd-resolve-broker';
import { questCwdResolveBrokerProxy } from '../../quest/cwd-resolve/quest-cwd-resolve-broker.proxy';
import { questGetBroker } from '../../quest/get/quest-get-broker';
import { questGetBrokerProxy } from '../../quest/get/quest-get-broker.proxy';
import { questWithModifyLockBrokerProxy } from '../../quest/with-modify-lock/quest-with-modify-lock-broker.proxy';

registerModuleMock({ module: '../../../adapters/git/add-all/git-add-all-adapter' });
registerModuleMock({ module: '../../../adapters/git/commit/git-commit-adapter' });
registerModuleMock({ module: '../../../adapters/git/push/git-push-adapter' });
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
  getPushCallArgs: () => unknown;
  getCommitMessage: () => unknown;
} => {
  // Inert — satisfies enforce-proxy-child-creation. The module mocks above replace every one of
  // these brokers' exports; each proxy's own internal staging is never exercised.
  gitAddAllAdapterProxy();
  gitCommitAdapterProxy();
  gitPushAdapterProxy();
  gitWorkingTreeFilesBrokerProxy();
  questCwdResolveBrokerProxy();
  questGetBrokerProxy();
  const lockProxy = questWithModifyLockBrokerProxy();
  lockProxy.setupEmpty();

  const addMock = registerMock({ fn: gitAddAllAdapter });
  addMock.calledWith([]).resolves({ exitCode: ExitCodeStub({ value: 0 }), output: '' as never });

  const commitMock = registerMock({ fn: gitCommitAdapter });
  commitMock.calledWith([]).resolves({ exitCode: ExitCodeStub({ value: 0 }), output: '' as never });

  const pushMock = registerMock({ fn: gitPushAdapter });
  pushMock.calledWith([]).resolves({ exitCode: ExitCodeStub({ value: 0 }), output: '' as never });

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
      const failingExitCode: ExitCode = ExitCodeStub({ value: 1 });
      pushMock.calledWith([]).resolves({ exitCode: failingExitCode, output: output as never });
    },

    getPushCallArgs: (): unknown => {
      const calls = [...pushMock.callsMatching([])];
      return calls[calls.length - 1]?.[0];
    },

    getCommitMessage: (): unknown => {
      const calls = [...commitMock.callsMatching([])];
      const lastCall = calls[calls.length - 1]?.[0] as { message?: unknown } | undefined;
      return lastCall?.message;
    },
  };
};
