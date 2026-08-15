import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  AbsoluteFilePathStub,
  ErrorMessageStub,
  FileContentsStub,
  FileNameStub,
  OperationItemStub,
  QuestBranchNameStub,
  QuestIdStub,
  QuestStub,
  QuestTitleStub,
  RepoRelativePathStub,
} from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { OrchestrationStartResponder } from './orchestration-start-responder';
import { questBranchStatics } from '../../../statics/quest-branch/quest-branch-statics';
import { gitWorktreeFixtureHarness } from '../../../../test/harnesses/git-worktree-fixture/git-worktree-fixture.harness';
import { orchestrationEnvironmentHarness } from '../../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { orchestrationQuestHarness } from '../../../../test/harnesses/orchestration-quest/orchestration-quest.harness';
import { questSeedHarness } from '../../../../test/harnesses/quest-seed/quest-seed.harness';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

// Derived from the statics rather than hardcoded, so a status added to the union is picked up
// automatically instead of silently skipping the new member (see questStatusMetadataStatics'
// own consumers, e.g. orchestration-start-responder.test.ts, for the same derivation).
const ALL_STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];
const NON_STARTABLE_STATUSES = ALL_STATUSES.filter(
  (status) => !questStatusMetadataStatics.statuses[status].isStartable,
);

// Hand-computed from questToGitNamesTransformer's own rules (verified in its dedicated test
// suite, quest-to-git-names-transformer.test.ts: 'VALID: {title longer than slugMaxLength} =>
// slug truncated to exactly slugMaxLength characters'). A title with no space/hyphen at all has
// no break opportunity, so the slug is the title itself lowercased and hard-truncated at
// slugMaxLength with no trailing-hyphen cleanup needed — the hostile/extreme member of this
// bundle's input class (every other title in this file is a short, well-behaved phrase).
const HOSTILE_TITLE = QuestTitleStub({ value: 'x'.repeat(questBranchStatics.slugMaxLength + 12) });
const HOSTILE_QUEST_ID = QuestIdStub({ value: '7bc217a1-41e8-40bd-9e25-803d2716b3e8' });
const TAKEN_BRANCH_NAME_STRING = `quest/${'x'.repeat(questBranchStatics.slugMaxLength)}-7bc217a1`;

describe('OrchestrationStartResponder (integration) — real quest.json + real git, no proxies', () => {
  const envHarness = orchestrationEnvironmentHarness();
  const questHelper = orchestrationQuestHarness();
  const seeder = questSeedHarness();
  const git = gitWorktreeFixtureHarness();

  // quest-start-worktree:observable:bad-status-leaves-quest — "quest.json status field is
  // unchanged from its pre-request value, and quest.json contains no branchName, baseBranch or
  // worktreePath key". Start writes no git context at any status, so the second half holds for the
  // startable counter-case below too; what these cases pin is that a refused Start writes NOTHING
  // AT ALL, not even the relay seed.
  describe('reject-not-startable leaves quest.json exactly as it was', () => {
    it.each(NON_STARTABLE_STATUSES)(
      'ERROR: {status: %s} => rejects and quest.json is byte-identical before and after',
      async (status) => {
        const testbed = installTestbedCreateBroker({
          baseName: BaseNameStub({ value: `osr-bad-status-${status}` }),
        });
        envHarness.setupHome({ tempDir: testbed.guildPath });
        const questId = QuestIdStub({ value: `bad-status-${status}` });
        const quest = QuestStub({
          id: questId,
          folder: `001-bad-status-${status}`,
          status,
        });
        seeder.seed({ tempDir: testbed.guildPath, quest });

        const before = await questHelper.reload({ questId });

        const thrown: unknown = await OrchestrationStartResponder({ questId }).catch(
          (error: unknown) => error,
        );

        const after = await questHelper.reload({ questId });

        testbed.cleanup();

        expect({
          errorMessage: (thrown as Error).message,
          gitKeysAfter: {
            branchName: after.branchName,
            baseBranch: after.baseBranch,
            worktreePath: after.worktreePath,
          },
          after,
        }).toStrictEqual({
          errorMessage: `Quest must be in a startable status (approved or design_approved). Current status: ${status}`,
          // The observable's second half, asserted directly on the post-request state. Reading it
          // off `after === before` alone would only hold while QuestStub happens to omit these
          // three keys; the day it defaults one, that inference goes quiet instead of red.
          gitKeysAfter: {
            branchName: undefined,
            baseBranch: undefined,
            worktreePath: undefined,
          },
          after: before,
        });
      },
    );

    // The discriminating counter-case: without this, an implementation that rejected EVERY
    // status (startable or not) would make every case above pass for the wrong reason. Uses the
    // idempotent-skip path (branchName + worktreePath already recorded) plus an already-seeded
    // locked ward item so the request completes with no real git call at all — the only
    // remaining real I/O is the guild lookup used to compute the queue entry's guildSlug, which
    // is why this is the one case in the block that registers a real guild.
    it('VALID: {status: approved, worktree already recorded} => the SAME route starts successfully, proving the guard rejects only non-startable statuses', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'osr-bad-status-counterexample' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });
      const { guild } = await questHelper.createGuildAndQuest({ testbed });
      const questId = QuestIdStub({ value: 'startable-counterexample' });
      const quest = QuestStub({
        id: questId,
        folder: '001-startable-counterexample',
        status: 'approved',
        branchName: QuestBranchNameStub({ value: 'quest/already-recorded-aaaaaaaa' }),
        worktreePath: AbsoluteFilePathStub({ value: '/tmp/already-recorded-worktree' }),
        operations: [OperationItemStub({ role: 'ward', status: 'pending', locked: true })],
      });
      seeder.seed({ tempDir: testbed.guildPath, quest, guildId: guild.id });

      await OrchestrationStartResponder({ questId });

      const after = await questHelper.reload({ questId });

      testbed.cleanup();

      expect(after.status).toBe('in_progress');
    });
  });

  // quest-start-worktree:observable:name-taken-leaves-existing-branch — "`git rev-parse
  // quest/<slug>-<id8>` resolves to the same commit sha before and after the request". Governed by
  // design decision `start-errors-on-existing-branch`: a branch owned by other work is left EXACTLY
  // as it was — not advanced, not adopted, not deleted. Start holds that trivially because it runs
  // no git at all; the branch collision is riftcarver's to detect, from the relay, against the same
  // real repo. Driven end-to-end against REAL git rather than a mock precisely so "Start ran no git"
  // is measured on disk instead of on a spy.
  describe('Start leaves the repository untouched and seeds the carve onto the relay', () => {
    it('VALID: {a branch already owns the exact name the carve will compute, pinned at an earlier commit than the advanced base} => Start succeeds, the branch sha is unchanged, and no worktree exists on disk', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'osr-name-taken' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });
      const { guild } = await questHelper.createGuildAndQuest({ testbed });
      const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });

      const { baseRef } = await git.initRepoWithPackages({
        repoPath,
        initialBranchName: FileNameStub({ value: 'main' }),
        packageNames: [FileNameStub({ value: 'shared' })],
      });

      // Pin the pre-existing branch at the FIRST commit, then advance main past it — a
      // single-commit repo could not tell "unchanged" from "re-cut", since both would read the
      // same sha.
      await git.createBranchAt({
        repoPath,
        branchName: FileNameStub({ value: TAKEN_BRANCH_NAME_STRING }),
        fromRef: baseRef,
      });
      await git.commitFile({
        repoPath,
        relativePath: RepoRelativePathStub({ value: 'ADVANCE.md' }),
        content: FileContentsStub({ value: 'advance main past the taken branch\n' }),
        message: ErrorMessageStub({ value: 'advance main' }),
      });

      const questId = HOSTILE_QUEST_ID;
      const quest = QuestStub({
        id: questId,
        folder: '001-name-taken',
        title: HOSTILE_TITLE,
        status: 'approved',
      });
      seeder.seed({ tempDir: testbed.guildPath, quest, guildId: guild.id });

      const existingBranchShaBefore = await git.gitRevParseOrNull({
        repoPath,
        ref: ErrorMessageStub({ value: TAKEN_BRANCH_NAME_STRING }),
      });

      await OrchestrationStartResponder({ questId });

      const existingBranchShaAfter = await git.gitRevParseOrNull({
        repoPath,
        ref: ErrorMessageStub({ value: TAKEN_BRANCH_NAME_STRING }),
      });
      const worktreesDirExists = git.pathExists({
        absolutePath: AbsoluteFilePathStub({ value: `${testbed.guildPath}/worktrees` }),
      });
      const after = await questHelper.reload({ questId });

      testbed.cleanup();

      expect({
        status: after.status,
        // Sliced rather than indexed: the seeded ledger's HEAD is the invariant, and a slice states
        // "there is a first item and it is this" in one value instead of reading undefined as a pass.
        headOfRelay: after.operations
          .slice(0, 1)
          .map((operation) => ({ role: operation.role, status: operation.status })),
        gitKeysAfter: {
          branchName: after.branchName,
          baseBranch: after.baseBranch,
          worktreePath: after.worktreePath,
          baseRef: after.baseRef,
        },
        worktreesDirExists,
        existingBranchShaBefore,
        existingBranchShaAfter,
      }).toStrictEqual({
        status: 'in_progress',
        headOfRelay: [{ role: 'riftcarver', status: 'in_progress' }],
        gitKeysAfter: {
          branchName: undefined,
          baseBranch: undefined,
          worktreePath: undefined,
          baseRef: undefined,
        },
        worktreesDirExists: false,
        existingBranchShaBefore: baseRef,
        existingBranchShaAfter: baseRef,
      });
    }, 30_000);
  });
});
