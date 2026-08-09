import {
  AbsoluteFilePathStub,
  QuestBranchNameStub,
  QuestIdStub,
  QuestStub,
  RepoRootCwdStub,
} from '@dungeonmaster/shared/contracts';

import { QuestCwdResolutionStub } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution.stub';
import { QuestResumeTriggerStub } from '../../../contracts/quest-resume-trigger/quest-resume-trigger.stub';
import { questResumeTriggerStatics } from '../../../statics/quest-resume-trigger/quest-resume-trigger-statics';
import { worktreeEnsureQuestBranchBroker } from './worktree-ensure-quest-branch-broker';
import { worktreeEnsureQuestBranchBrokerProxy } from './worktree-ensure-quest-branch-broker.proxy';

describe('worktreeEnsureQuestBranchBroker', () => {
  describe('worktree present, quest carries a branch name', () => {
    it('VALID: {worktree drifted onto another branch} => checks the quest branch back out and reports it restored', async () => {
      const proxy = worktreeEnsureQuestBranchBrokerProxy();
      const branchName = QuestBranchNameStub({ value: 'quest/ensure-drift-11112222' });
      const trigger = QuestResumeTriggerStub({ value: 'dispatch-scan' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'ensure-drift' }),
        branchName,
        worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/ensure-drift-11112222' }),
      });
      proxy.setupDrifted({ currentBranchName: 'main' });
      proxy.setupCheckoutSucceeds({ branchName });

      const result = await worktreeEnsureQuestBranchBroker({
        quest,
        cwdResolution: QuestCwdResolutionStub({
          kind: 'worktree',
          cwd: RepoRootCwdStub({ value: '/repo/worktrees/ensure-drift-11112222' }),
        }),
        trigger,
      });

      expect({
        result,
        spawnedArgs: proxy.getSpawnedArgsList(),
        stderrWrites: proxy.getStderrWrites({ trigger }),
      }).toStrictEqual({
        result: { attempted: true, restored: true },
        spawnedArgs: [
          ['rev-parse', '--abbrev-ref', 'HEAD'],
          ['checkout', branchName],
        ],
        stderrWrites: [],
      });
    });

    it('VALID: {worktree already on the quest branch} => probes the branch once and runs no checkout', async () => {
      const proxy = worktreeEnsureQuestBranchBrokerProxy();
      const branchName = QuestBranchNameStub({ value: 'quest/ensure-on-branch-33334444' });
      const trigger = QuestResumeTriggerStub({ value: 'orchestration-resume' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'ensure-on-branch' }),
        branchName,
        worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/ensure-on-branch-33334444' }),
      });
      proxy.setupOnBranch({ branchName });

      const result = await worktreeEnsureQuestBranchBroker({
        quest,
        cwdResolution: QuestCwdResolutionStub({
          kind: 'worktree',
          cwd: RepoRootCwdStub({ value: '/repo/worktrees/ensure-on-branch-33334444' }),
        }),
        trigger,
      });

      expect({
        result,
        spawnedArgs: proxy.getSpawnedArgsList(),
        stderrWrites: proxy.getStderrWrites({ trigger }),
      }).toStrictEqual({
        result: { attempted: true, restored: true },
        spawnedArgs: [['rev-parse', '--abbrev-ref', 'HEAD']],
        stderrWrites: [],
      });
    });

    it('ERROR: {git rev-parse itself exits non-zero} => reports restored false and never reaches a checkout', async () => {
      const proxy = worktreeEnsureQuestBranchBrokerProxy();
      const branchName = QuestBranchNameStub({ value: 'quest/ensure-revparse-fail-bbbbcccc' });
      const trigger = QuestResumeTriggerStub({ value: 'recover-guild-layer-responder' });
      const questId = QuestIdStub({ value: 'ensure-revparse-fail' });
      const quest = QuestStub({
        id: questId,
        branchName,
        worktreePath: AbsoluteFilePathStub({
          value: '/repo/worktrees/ensure-revparse-fail-bbbbcccc',
        }),
      });
      const output = 'fatal: not a git repository (or any of the parent directories): .git';
      proxy.setupRevParseFails({ output });

      const result = await worktreeEnsureQuestBranchBroker({
        quest,
        cwdResolution: QuestCwdResolutionStub({
          kind: 'worktree',
          cwd: RepoRootCwdStub({ value: '/repo/worktrees/ensure-revparse-fail-bbbbcccc' }),
        }),
        trigger,
      });

      expect({
        result,
        spawnedArgs: proxy.getSpawnedArgsList(),
        stderrWrites: proxy.getStderrWrites({ trigger }),
      }).toStrictEqual({
        result: { attempted: true, restored: false },
        spawnedArgs: [['rev-parse', '--abbrev-ref', 'HEAD']],
        stderrWrites: [
          `[recover-guild-layer-responder] worktree restore failed for quest ${questId} on branch ${branchName}: ${output}\n`,
        ],
      });
    });
  });

  // quest-resume-worktree:observable:resume-triggers-all-three — the three pickup surfaces run the
  // SAME body, parameterised only by which one is speaking. The case list is derived from the
  // statics tuple rather than hand-written, so a fourth pickup surface added there and NOT wired
  // through this broker shows up here as a case nobody satisfied rather than as silence.
  describe.each(questResumeTriggerStatics.triggers)('trigger: %s', (triggerValue) => {
    it('ERROR: {drifted worktree, checkout exits non-zero} => reports restored false and logs under this triggers own prefix', async () => {
      const proxy = worktreeEnsureQuestBranchBrokerProxy();
      const branchName = QuestBranchNameStub({ value: 'quest/ensure-fail-55556666' });
      const trigger = QuestResumeTriggerStub({ value: triggerValue });
      const questId = QuestIdStub({ value: `ensure-fail-${triggerValue}` });
      const quest = QuestStub({
        id: questId,
        branchName,
        worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/ensure-fail-55556666' }),
      });
      const output =
        "error: pathspec 'quest/ensure-fail-55556666' did not match any file(s) known to git";
      proxy.setupDrifted({ currentBranchName: 'main' });
      proxy.setupCheckoutFails({ branchName, output });

      const result = await worktreeEnsureQuestBranchBroker({
        quest,
        cwdResolution: QuestCwdResolutionStub({
          kind: 'worktree',
          cwd: RepoRootCwdStub({ value: '/repo/worktrees/ensure-fail-55556666' }),
        }),
        trigger,
      });

      expect({
        result,
        spawnedArgs: proxy.getSpawnedArgsList(),
        stderrWrites: proxy.getStderrWrites({ trigger }),
      }).toStrictEqual({
        result: { attempted: true, restored: false },
        spawnedArgs: [
          ['rev-parse', '--abbrev-ref', 'HEAD'],
          ['checkout', branchName],
        ],
        stderrWrites: [
          `[${triggerValue}] worktree restore failed for quest ${questId} on branch ${branchName}: ${output}\n`,
        ],
      });
    });
  });

  describe('nothing to restore', () => {
    it('VALID: {repo-root resolution, quest still carries a branch name} => runs no git command at all', async () => {
      const proxy = worktreeEnsureQuestBranchBrokerProxy();
      const quest = QuestStub({
        id: QuestIdStub({ value: 'ensure-repo-root' }),
        branchName: QuestBranchNameStub({ value: 'quest/ensure-repo-root-77778888' }),
      });

      const result = await worktreeEnsureQuestBranchBroker({
        quest,
        cwdResolution: QuestCwdResolutionStub({
          kind: 'repo-root',
          cwd: RepoRootCwdStub({ value: '/test/repo/root' }),
        }),
        trigger: QuestResumeTriggerStub({ value: 'dispatch-scan' }),
      });

      expect({ result, spawnedArgs: proxy.getSpawnedArgsList() }).toStrictEqual({
        result: { attempted: false, restored: false },
        spawnedArgs: [],
      });
    });

    it('EMPTY: {worktree resolution, quest has no recorded branchName} => runs no git command at all', async () => {
      const proxy = worktreeEnsureQuestBranchBrokerProxy();
      const quest = QuestStub({ id: QuestIdStub({ value: 'ensure-no-branch' }) });

      const result = await worktreeEnsureQuestBranchBroker({
        quest,
        cwdResolution: QuestCwdResolutionStub({
          kind: 'worktree',
          cwd: RepoRootCwdStub({ value: '/repo/worktrees/ensure-no-branch-99990000' }),
        }),
        trigger: QuestResumeTriggerStub({ value: 'recover-guild-layer-responder' }),
      });

      expect({ result, spawnedArgs: proxy.getSpawnedArgsList() }).toStrictEqual({
        result: { attempted: false, restored: false },
        spawnedArgs: [],
      });
    });

    it('ERROR: {missing-worktree resolution} => runs no git command, leaving that halt route to the caller', async () => {
      const proxy = worktreeEnsureQuestBranchBrokerProxy();
      const quest = QuestStub({
        id: QuestIdStub({ value: 'ensure-missing-worktree' }),
        branchName: QuestBranchNameStub({ value: 'quest/ensure-missing-worktree-aaaabbbb' }),
      });

      const result = await worktreeEnsureQuestBranchBroker({
        quest,
        cwdResolution: QuestCwdResolutionStub({
          kind: 'missing-worktree',
          worktreePath: AbsoluteFilePathStub({
            value: '/repo/worktrees/ensure-missing-worktree-aaaabbbb',
          }),
        }),
        trigger: QuestResumeTriggerStub({ value: 'dispatch-scan' }),
      });

      expect({ result, spawnedArgs: proxy.getSpawnedArgsList() }).toStrictEqual({
        result: { attempted: false, restored: false },
        spawnedArgs: [],
      });
    });
  });
});
