import type { QuestBranchName } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import type { QuestResumeTrigger } from '../../../contracts/quest-resume-trigger/quest-resume-trigger-contract';
import { worktreeResumeRestoreBrokerProxy } from '../resume-restore/worktree-resume-restore-broker.proxy';

export const worktreeEnsureQuestBranchBrokerProxy = (): {
  setupOnBranch: (params: { branchName: QuestBranchName }) => void;
  setupDrifted: (params: { currentBranchName: string }) => void;
  setupCheckoutSucceeds: (params: { branchName: QuestBranchName }) => void;
  setupCheckoutFails: (params: { branchName: QuestBranchName; output: string }) => void;
  setupRevParseFails: (params: { output: string }) => void;
  getSpawnedArgsList: () => readonly unknown[];
  getStderrWrites: (params: { trigger: QuestResumeTrigger }) => readonly unknown[];
} => {
  // Composed rather than re-mocked: this broker's whole job is to run the restore body, so the
  // git spawns underneath it stay the boundary and the restore itself runs for real.
  const restoreProxy = worktreeResumeRestoreBrokerProxy();
  // A failed restore is logged, never thrown, so stderr is the only surface it leaves. Staged
  // record-and-swallow so test output stays clean; the writes are read back through the filter
  // below rather than asserted on the raw shared spy.
  const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrSpy.calledWith([]).implement(() => true);

  return {
    setupOnBranch: restoreProxy.setupOnBranch,
    setupDrifted: restoreProxy.setupDrifted,
    setupCheckoutSucceeds: restoreProxy.setupCheckoutSucceeds,
    setupCheckoutFails: restoreProxy.setupCheckoutFails,
    setupRevParseFails: restoreProxy.setupRevParseFails,
    getSpawnedArgsList: restoreProxy.getSpawnedArgsList,

    // Filtered by trigger prefix because the shared stderr spy carries every proxy's lines — and
    // because the prefix is the ONE thing that differs between the three pickup surfaces, so a
    // test asking for one trigger's lines is asking exactly the discriminating question.
    getStderrWrites: ({ trigger }: { trigger: QuestResumeTrigger }): readonly unknown[] =>
      stderrSpy
        .callsMatching([])
        .map((call) => call[0])
        .filter((message) => String(message).startsWith(`[${trigger}]`)),
  };
};
