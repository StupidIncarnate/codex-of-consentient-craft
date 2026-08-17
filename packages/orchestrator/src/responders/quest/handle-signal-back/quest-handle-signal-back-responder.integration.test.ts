import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  AbsoluteFilePathStub,
  BaseBranchNameStub,
  ErrorMessageStub,
  FileContentsStub,
  FileNameStub,
  FlowNodeStub,
  FlowOffMapSignoffStub,
  FlowStub,
  OperationItemIdStub,
  OperationItemStub,
  QuestBlightLedgerEntryStub,
  QuestBranchNameStub,
  QuestStub,
  QuestWorkItemIdStub,
  RepoRelativePathStub,
  SignoffStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { qaOffMapProbeStatics } from '@dungeonmaster/shared/statics';

import { QuestHandleSignalBackResponder } from './quest-handle-signal-back-responder';
import { gitWorktreeAddAdapter } from '../../../adapters/git/worktree-add/git-worktree-add-adapter';
import { blightChecklistBuildTransformer } from '../../../transformers/blight-checklist-build/blight-checklist-build-transformer';
import { orchestrationEnvironmentHarness } from '../../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { orchestrationQuestHarness } from '../../../../test/harnesses/orchestration-quest/orchestration-quest.harness';
import { gitWorktreeFixtureHarness } from '../../../../test/harnesses/git-worktree-fixture/git-worktree-fixture.harness';

// The off-map probe families every flow decomposes into — Siegemaster's charter alone, absent from
// Flowrider's denominator. Derived from the probe statics, whose colocated test pins its keys 1:1
// with qaOffMapFamilyContract's options.
const OFF_MAP_FAMILIES = Object.keys(qaOffMapProbeStatics.byFamily);

// One disposition a reviewer-minion round left behind, for the fixtures whose gate is the
// commit-before-signal one rather than review coverage.
const REVIEW_ITEM_ID = 'packages/orchestrator/src/foo/foo-broker.ts:craft';

// The two files the review-range fixtures commit, ONE PER ROUND, into `packages/shared/` — which
// `initRepoWithPackages` creates, so `commitFile` can write into it without a mkdir. Neither is
// declaration-shaped, so each crosses all five concerns.
const ALPHA_FILE = RepoRelativePathStub({ value: 'packages/shared/alpha-broker.ts' });
const BETA_FILE = RepoRelativePathStub({ value: 'packages/shared/beta-broker.ts' });

// The quest's own pinned review base. The review-coverage gate reads it only as "this quest has a
// review surface at all" — the RANGE it measures is the work item's own startRef, never this.
const RANGE_BASE_REF = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef' as never;

// The two dispositions that are honest answers rather than a review — both clear a unit, which is
// the property the gate's satisfiability rests on.
const HONEST_DISPOSITIONS = ['gap', 'recorded'] as const;

// The review-coverage gate rebuilds the standards-review checklist over `<startRef>..HEAD` — every
// commit the signalling work item made — and refuses `done` while any unit on it carries no
// blightLedger disposition. These drive the real responder against a REAL git worktree with REAL
// commits, because the range IS the measurement: a mocked file list would prove the wiring and
// nothing about what `git diff <startRef>...HEAD` actually reports across two round commits.
describe('QuestHandleSignalBackResponder (integration) — review-coverage gate', () => {
  const envHarness = orchestrationEnvironmentHarness();
  const questHelper = orchestrationQuestHarness();
  const git = gitWorktreeFixtureHarness();

  it('ERROR: {codeweaver done, two files committed since its startRef and one dispositioned} => refused naming the outstanding unit, and persists NOTHING', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'sb-review-refuse' }),
    });
    envHarness.setupHome({ tempDir: testbed.guildPath });

    const { questId } = await questHelper.createGuildAndQuest({ testbed });

    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });
    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' })],
    });

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/review-refuse-a1b2c3d4`,
    });
    const branchName = QuestBranchNameStub({ value: 'quest/review-refuse-a1b2c3d4' });
    await gitWorktreeAddAdapter({
      cwd: repoPath,
      worktreePath,
      branchName,
      baseBranch: BaseBranchNameStub({ value: 'main' }),
      mode: 'create-branch',
    });

    // The fork point `agentPromptGetBroker` stamps at the item's FIRST prompt fetch.
    const startRef = await git.gitRevParseOrNull({
      repoPath: worktreePath,
      ref: ErrorMessageStub({ value: 'HEAD' }),
    });

    // TWO commits after it — one per round. `HEAD~1` would see only the second.
    await git.commitFile({
      repoPath: worktreePath,
      relativePath: ALPHA_FILE,
      content: FileContentsStub({ value: 'export const alphaBroker = (): number => 1;\n' }),
      message: ErrorMessageStub({ value: 'round 1' }),
    });
    await git.commitFile({
      repoPath: worktreePath,
      relativePath: BETA_FILE,
      content: FileContentsStub({ value: 'export const betaBroker = (): number => 2;\n' }),
      message: ErrorMessageStub({ value: 'round 2' }),
    });

    const cwOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000d1' });
    const cwWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

    // Round 1's reviewer dispositioned every unit of ALPHA and never reached BETA. Derived from the
    // same transformer the checklist is built by, so the ids are the real ones rather than a
    // hand-typed guess that would leave the gate refusing for the wrong reason.
    await questHelper.seedInProgressRelay({
      questId,
      baseRef: RANGE_BASE_REF,
      worktreePath,
      branchName,
      planningNotes: QuestStub({
        planningNotes: {
          blightLedger: blightChecklistBuildTransformer({
            changedFiles: [ALPHA_FILE],
            baseRef: RANGE_BASE_REF,
          }).items.map((item) =>
            QuestBlightLedgerEntryStub({
              itemId: item.id,
              workItemId: cwWorkItemId,
              createdAt: new Date().toISOString(),
            }),
          ),
        },
      }).planningNotes,
      operations: [
        OperationItemStub({
          id: cwOpId,
          role: 'codeweaver',
          text: 'core: config adapter',
          status: 'in_progress',
        }),
      ],
      workItems: [
        WorkItemStub({
          id: cwWorkItemId,
          role: 'codeweaver',
          status: 'in_progress',
          spawnerType: 'agent',
          startRef: String(startRef) as never,
          relatedDataItems: [`operations/${String(cwOpId)}`],
          dependsOn: [],
          createdAt: new Date().toISOString(),
        }),
      ],
    });

    const before = await questHelper.readQuestFileRaw({ questId });

    await expect(
      QuestHandleSignalBackResponder({
        questId,
        workItemId: cwWorkItemId,
        signal: 'complete',
        operationItemId: cwOpId,
        operationStatus: 'done',
      }),
    ).rejects.toThrow(
      new RegExp(
        `signal-back refused: operationStatus 'done' means every review unit your commits produced carries a disposition.*- ${String(BETA_FILE)}:craft.*Dispatch a \`reviewer-minion\``,
        'su',
      ),
    );

    // Byte-identical: a refused gate persists nothing, so the session can dispatch a reviewer and
    // signal again against the same work item.
    const after = await questHelper.readQuestFileRaw({ questId });
    const reloaded = await questHelper.reload({ questId });

    testbed.cleanup();

    expect({
      unchanged: String(after) === String(before),
      operationStatus: reloaded.operations.find((op) => op.id === cwOpId)?.status,
      workItemStatus: reloaded.workItems.find((wi) => wi.id === cwWorkItemId)?.status,
    }).toStrictEqual({
      unchanged: true,
      operationStatus: 'in_progress',
      workItemStatus: 'in_progress',
    });
  }, 30_000);

  it('VALID: {codeweaver done, every unit across BOTH round commits dispositioned} => the gate clears and quest.json records the completion with NO review item appended', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'sb-review-clear' }),
    });
    envHarness.setupHome({ tempDir: testbed.guildPath });

    const { questId } = await questHelper.createGuildAndQuest({ testbed });

    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });
    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' })],
    });

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/review-clear-a1b2c3d4`,
    });
    const branchName = QuestBranchNameStub({ value: 'quest/review-clear-a1b2c3d4' });
    await gitWorktreeAddAdapter({
      cwd: repoPath,
      worktreePath,
      branchName,
      baseBranch: BaseBranchNameStub({ value: 'main' }),
      mode: 'create-branch',
    });

    const startRef = await git.gitRevParseOrNull({
      repoPath: worktreePath,
      ref: ErrorMessageStub({ value: 'HEAD' }),
    });

    await git.commitFile({
      repoPath: worktreePath,
      relativePath: ALPHA_FILE,
      content: FileContentsStub({ value: 'export const alphaBroker = (): number => 1;\n' }),
      message: ErrorMessageStub({ value: 'round 1' }),
    });
    await git.commitFile({
      repoPath: worktreePath,
      relativePath: BETA_FILE,
      content: FileContentsStub({ value: 'export const betaBroker = (): number => 2;\n' }),
      message: ErrorMessageStub({ value: 'round 2' }),
    });

    const cwOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000d2' });
    const cwWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

    await questHelper.seedInProgressRelay({
      questId,
      baseRef: RANGE_BASE_REF,
      worktreePath,
      branchName,
      planningNotes: QuestStub({
        planningNotes: {
          blightLedger: blightChecklistBuildTransformer({
            changedFiles: [ALPHA_FILE, BETA_FILE],
            baseRef: RANGE_BASE_REF,
          }).items.map((item) =>
            QuestBlightLedgerEntryStub({
              itemId: item.id,
              workItemId: cwWorkItemId,
              createdAt: new Date().toISOString(),
            }),
          ),
        },
      }).planningNotes,
      operations: [
        OperationItemStub({
          id: cwOpId,
          role: 'codeweaver',
          text: 'core: config adapter',
          status: 'in_progress',
        }),
      ],
      workItems: [
        WorkItemStub({
          id: cwWorkItemId,
          role: 'codeweaver',
          status: 'in_progress',
          spawnerType: 'agent',
          startRef: String(startRef) as never,
          relatedDataItems: [`operations/${String(cwOpId)}`],
          dependsOn: [],
          createdAt: new Date().toISOString(),
        }),
      ],
    });

    const result = await QuestHandleSignalBackResponder({
      questId,
      workItemId: cwWorkItemId,
      signal: 'complete',
      operationItemId: cwOpId,
      operationStatus: 'done',
    });

    const after = await questHelper.reload({ questId });

    testbed.cleanup();

    // The regression guard for the deleted relay role, read off real disk: the ledger holds
    // exactly the one operation item it was seeded with, and the work-item list exactly the one
    // session that signalled. A re-added auto-append would put a second role in either list.
    expect({
      responderResult: result,
      operationRoles: after.operations.map(({ role }) => role),
      operationStatuses: after.operations.map(({ status }) => status),
      workItemRoles: after.workItems.map(({ role }) => role),
      workItemStatuses: after.workItems.map(({ status }) => status),
    }).toStrictEqual({
      responderResult: { success: true },
      operationRoles: ['codeweaver'],
      operationStatuses: ['complete'],
      workItemRoles: ['codeweaver'],
      workItemStatuses: ['complete'],
    });
  }, 30_000);

  // The gate refuses ABSENCE, not honesty. `gap` (the concern cannot be assessed at this layer) and
  // `recorded` (a real finding handed to a named owner) are the answers a reviewer gives when
  // `reviewed` would be a lie — if either left its unit outstanding the gate would only be
  // satisfiable by lying, which is the failure mode a computed gate exists to remove.
  it.each(HONEST_DISPOSITIONS)(
    "VALID: {codeweaver done, every unit dispositioned '%s'} => accepted exactly as 'reviewed' would be",
    async (disposition) => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: `sb-review-${disposition}` }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });
      await git.initRepoWithPackages({
        repoPath,
        initialBranchName: FileNameStub({ value: 'main' }),
        packageNames: [FileNameStub({ value: 'shared' })],
      });

      const worktreePath = AbsoluteFilePathStub({
        value: `${testbed.guildPath}/worktrees/review-${disposition}-a1b2c3d4`,
      });
      const branchName = QuestBranchNameStub({ value: `quest/review-${disposition}-a1b2c3d4` });
      await gitWorktreeAddAdapter({
        cwd: repoPath,
        worktreePath,
        branchName,
        baseBranch: BaseBranchNameStub({ value: 'main' }),
        mode: 'create-branch',
      });

      const startRef = await git.gitRevParseOrNull({
        repoPath: worktreePath,
        ref: ErrorMessageStub({ value: 'HEAD' }),
      });

      await git.commitFile({
        repoPath: worktreePath,
        relativePath: ALPHA_FILE,
        content: FileContentsStub({ value: 'export const alphaBroker = (): number => 1;\n' }),
        message: ErrorMessageStub({ value: 'round 1' }),
      });

      const cwOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000d4' });
      const cwWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        baseRef: RANGE_BASE_REF,
        worktreePath,
        branchName,
        planningNotes: QuestStub({
          planningNotes: {
            blightLedger: blightChecklistBuildTransformer({
              changedFiles: [ALPHA_FILE],
              baseRef: RANGE_BASE_REF,
            }).items.map((item) =>
              QuestBlightLedgerEntryStub({
                itemId: item.id,
                disposition,
                workItemId: cwWorkItemId,
                createdAt: new Date().toISOString(),
              }),
            ),
          },
        }).planningNotes,
        operations: [
          OperationItemStub({
            id: cwOpId,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'in_progress',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: cwWorkItemId,
            role: 'codeweaver',
            status: 'in_progress',
            spawnerType: 'agent',
            startRef: String(startRef) as never,
            relatedDataItems: [`operations/${String(cwOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      const result = await QuestHandleSignalBackResponder({
        questId,
        workItemId: cwWorkItemId,
        signal: 'complete',
        operationItemId: cwOpId,
        operationStatus: 'done',
      });

      const after = await questHelper.reload({ questId });

      testbed.cleanup();

      expect({
        responderResult: result,
        operationStatuses: after.operations.map(({ status }) => status),
        workItemStatuses: after.workItems.map(({ status }) => status),
      }).toStrictEqual({
        responderResult: { success: true },
        operationStatuses: ['complete'],
        workItemStatuses: ['complete'],
      });
    },
    30_000,
  );

  // A hydrated quest, or an item that predates the field, has no fork point to measure from. The
  // relay must not wedge on a work item that could never satisfy the gate.
  it('EMPTY: {codeweaver done, work item carrying NO startRef} => signals fine even with an empty blightLedger', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'sb-review-nostart' }),
    });
    envHarness.setupHome({ tempDir: testbed.guildPath });

    const { questId } = await questHelper.createGuildAndQuest({ testbed });

    const cwOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000d5' });
    const cwWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

    await questHelper.seedInProgressRelay({
      questId,
      baseRef: RANGE_BASE_REF,
      operations: [
        OperationItemStub({
          id: cwOpId,
          role: 'codeweaver',
          text: 'core: config adapter',
          status: 'in_progress',
        }),
      ],
      workItems: [
        WorkItemStub({
          id: cwWorkItemId,
          role: 'codeweaver',
          status: 'in_progress',
          spawnerType: 'agent',
          relatedDataItems: [`operations/${String(cwOpId)}`],
          dependsOn: [],
          createdAt: new Date().toISOString(),
        }),
      ],
    });

    const result = await QuestHandleSignalBackResponder({
      questId,
      workItemId: cwWorkItemId,
      signal: 'complete',
      operationItemId: cwOpId,
      operationStatus: 'done',
    });

    const after = await questHelper.reload({ questId });

    testbed.cleanup();

    expect({
      responderResult: result,
      blightLedger: after.planningNotes.blightLedger,
      operationStatuses: after.operations.map(({ status }) => status),
      workItemStatuses: after.workItems.map(({ status }) => status),
    }).toStrictEqual({
      responderResult: { success: true },
      blightLedger: [],
      operationStatuses: ['complete'],
      workItemStatuses: ['complete'],
    });
  }, 30_000);

  // An empty range is a REAL state, not a skip: a round that committed nothing has nothing to
  // review, exactly as `git commit --allow-empty` satisfies the commit gate above.
  it('EMPTY: {codeweaver done, startRef equal to HEAD so the range holds no commits} => accepted with an empty blightLedger', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'sb-review-emptyrange' }),
    });
    envHarness.setupHome({ tempDir: testbed.guildPath });

    const { questId } = await questHelper.createGuildAndQuest({ testbed });

    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });
    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' })],
    });

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/review-empty-a1b2c3d4`,
    });
    const branchName = QuestBranchNameStub({ value: 'quest/review-empty-a1b2c3d4' });
    await gitWorktreeAddAdapter({
      cwd: repoPath,
      worktreePath,
      branchName,
      baseBranch: BaseBranchNameStub({ value: 'main' }),
      mode: 'create-branch',
    });

    // Stamped, then nothing committed after it.
    const startRef = await git.gitRevParseOrNull({
      repoPath: worktreePath,
      ref: ErrorMessageStub({ value: 'HEAD' }),
    });

    const cwOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000d6' });
    const cwWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

    await questHelper.seedInProgressRelay({
      questId,
      baseRef: RANGE_BASE_REF,
      worktreePath,
      branchName,
      operations: [
        OperationItemStub({
          id: cwOpId,
          role: 'codeweaver',
          text: 'core: config adapter',
          status: 'in_progress',
        }),
      ],
      workItems: [
        WorkItemStub({
          id: cwWorkItemId,
          role: 'codeweaver',
          status: 'in_progress',
          spawnerType: 'agent',
          startRef: String(startRef) as never,
          relatedDataItems: [`operations/${String(cwOpId)}`],
          dependsOn: [],
          createdAt: new Date().toISOString(),
        }),
      ],
    });

    const result = await QuestHandleSignalBackResponder({
      questId,
      workItemId: cwWorkItemId,
      signal: 'complete',
      operationItemId: cwOpId,
      operationStatus: 'done',
    });

    const after = await questHelper.reload({ questId });

    testbed.cleanup();

    expect({
      responderResult: result,
      blightLedger: after.planningNotes.blightLedger,
      operationStatuses: after.operations.map(({ status }) => status),
      workItemStatuses: after.workItems.map(({ status }) => status),
    }).toStrictEqual({
      responderResult: { success: true },
      blightLedger: [],
      operationStatuses: ['complete'],
      workItemStatuses: ['complete'],
    });
  }, 30_000);
});

// §4.3 of the post-mortem measured a session dying ONE gate short of its commit while holding a
// fully verified, twice-green artifact — the re-carve destroyed it, 101 minutes of wall clock for
// 11 minutes of work, with no trace in quest.json that any of it happened. These drive the real
// responder against a REAL git worktree, because `git ls-files --others` is the half of the
// measurement no unit-level fake can prove.
describe('QuestHandleSignalBackResponder (integration) — commit-before-signal gate', () => {
  const envHarness = orchestrationEnvironmentHarness();
  const questHelper = orchestrationQuestHarness();
  const git = gitWorktreeFixtureHarness();

  it('ERROR: {codeweaver done, worktree carrying an uncommitted net-new file} => throws naming that path and persists NOTHING', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'sb-dirty-tree' }),
    });
    envHarness.setupHome({ tempDir: testbed.guildPath });

    const { questId } = await questHelper.createGuildAndQuest({ testbed });

    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });
    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' })],
    });

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/dirty-tree-a1b2c3d4`,
    });
    const branchName = QuestBranchNameStub({ value: 'quest/dirty-tree-a1b2c3d4' });
    await gitWorktreeAddAdapter({
      cwd: repoPath,
      worktreePath,
      branchName,
      baseBranch: BaseBranchNameStub({ value: 'main' }),
      mode: 'create-branch',
    });

    // Never committed and never `git add`ed — exactly the shape of a net-new file a worker just
    // wrote, and exactly what `git diff HEAD --name-only` alone would report as a clean tree.
    const strayPath = RepoRelativePathStub({ value: 'packages/shared/stray-broker.ts' });
    git.dirtyTrackedFile({
      repoPath: worktreePath,
      relativePath: strayPath,
      content: FileContentsStub({ value: 'export const strayBroker = (): number => 1;\n' }),
    });

    const cwOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000d3' });
    const cwWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

    await questHelper.seedInProgressRelay({
      questId,
      worktreePath,
      branchName,
      planningNotes: QuestStub({
        planningNotes: {
          blightLedger: [
            QuestBlightLedgerEntryStub({
              itemId: REVIEW_ITEM_ID,
              workItemId: cwWorkItemId,
              createdAt: new Date().toISOString(),
            }),
          ],
        },
      }).planningNotes,
      operations: [
        OperationItemStub({
          id: cwOpId,
          role: 'codeweaver',
          text: 'core: config adapter',
          status: 'in_progress',
        }),
      ],
      workItems: [
        WorkItemStub({
          id: cwWorkItemId,
          role: 'codeweaver',
          status: 'in_progress',
          spawnerType: 'agent',
          relatedDataItems: [`operations/${String(cwOpId)}`],
          dependsOn: [],
          createdAt: new Date().toISOString(),
        }),
      ],
    });

    const before = await questHelper.readQuestFileRaw({ questId });
    const seeded = await questHelper.reload({ questId });

    // The gate only binds on a quest whose OWN worktree resolves and whose tree really is dirty, so
    // both preconditions are asserted rather than assumed: a seed that dropped worktreePath, or a
    // stray file git never saw, would make the refusal below unreachable and this test vacuous.
    expect({
      seededWorktreePath: String(seeded.worktreePath),
      porcelain: String(await git.gitStatusPorcelain({ repoPath: worktreePath })),
    }).toStrictEqual({
      seededWorktreePath: String(worktreePath),
      porcelain: `?? ${String(strayPath)}`,
    });

    await expect(
      QuestHandleSignalBackResponder({
        questId,
        workItemId: cwWorkItemId,
        signal: 'complete',
        operationItemId: cwOpId,
        operationStatus: 'done',
      }),
    ).rejects.toThrow(
      new RegExp(
        `signal-back refused: the quest worktree still carries 1 uncommitted change\\(s\\).*- ${String(strayPath)}.*Commit this round`,
        'su',
      ),
    );

    const after = await questHelper.readQuestFileRaw({ questId });

    testbed.cleanup();

    expect(String(after)).toBe(String(before));
  }, 30_000);

  it("ERROR: {codeweaver 'blocked' on the same dirty worktree} => refused too, because a blocked quest hands its work forward through git as well", async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'sb-dirty-blocked' }),
    });
    envHarness.setupHome({ tempDir: testbed.guildPath });

    const { questId } = await questHelper.createGuildAndQuest({ testbed });

    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });
    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' })],
    });

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/dirty-blocked-a1b2c3d4`,
    });
    const branchName = QuestBranchNameStub({ value: 'quest/dirty-blocked-a1b2c3d4' });
    await gitWorktreeAddAdapter({
      cwd: repoPath,
      worktreePath,
      branchName,
      baseBranch: BaseBranchNameStub({ value: 'main' }),
      mode: 'create-branch',
    });

    const strayPath = RepoRelativePathStub({ value: 'packages/shared/stray-broker.ts' });
    git.dirtyTrackedFile({
      repoPath: worktreePath,
      relativePath: strayPath,
      content: FileContentsStub({ value: 'export const strayBroker = (): number => 1;\n' }),
    });

    const cwOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000d4' });
    const cwWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

    await questHelper.seedInProgressRelay({
      questId,
      worktreePath,
      branchName,
      operations: [
        OperationItemStub({
          id: cwOpId,
          role: 'codeweaver',
          text: 'core: config adapter',
          status: 'in_progress',
        }),
      ],
      workItems: [
        WorkItemStub({
          id: cwWorkItemId,
          role: 'codeweaver',
          status: 'in_progress',
          spawnerType: 'agent',
          relatedDataItems: [`operations/${String(cwOpId)}`],
          dependsOn: [],
          createdAt: new Date().toISOString(),
        }),
      ],
    });

    const before = await questHelper.readQuestFileRaw({ questId });
    const seeded = await questHelper.reload({ questId });

    // Same precondition as the `done` case: the gate only binds on a quest whose OWN worktree
    // resolves, so a seed that dropped worktreePath would make the refusal below unreachable.
    expect(String(seeded.worktreePath)).toBe(String(worktreePath));

    await expect(
      QuestHandleSignalBackResponder({
        questId,
        workItemId: cwWorkItemId,
        signal: 'complete',
        operationItemId: cwOpId,
        operationStatus: 'blocked',
      }),
    ).rejects.toThrow(
      /signal-back refused: the quest worktree still carries 1 uncommitted change/u,
    );

    const after = await questHelper.readQuestFileRaw({ questId });
    const reloaded = await questHelper.reload({ questId });

    testbed.cleanup();

    expect({
      unchanged: String(after) === String(before),
      questStatus: reloaded.status,
      workItemStatus: reloaded.workItems.find((wi) => wi.id === cwWorkItemId)?.status,
    }).toStrictEqual({
      unchanged: true,
      questStatus: 'in_progress',
      workItemStatus: 'in_progress',
    });
  }, 30_000);

  it('VALID: {codeweaver done, freshly carved worktree with nothing uncommitted} => the gate clears and the outcome applies', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'sb-clean-tree' }),
    });
    envHarness.setupHome({ tempDir: testbed.guildPath });

    const { questId } = await questHelper.createGuildAndQuest({ testbed });

    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });
    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' })],
    });

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/clean-tree-a1b2c3d4`,
    });
    const branchName = QuestBranchNameStub({ value: 'quest/clean-tree-a1b2c3d4' });
    await gitWorktreeAddAdapter({
      cwd: repoPath,
      worktreePath,
      branchName,
      baseBranch: BaseBranchNameStub({ value: 'main' }),
      mode: 'create-branch',
    });

    const cwOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000d5' });
    const cwWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

    await questHelper.seedInProgressRelay({
      questId,
      worktreePath,
      branchName,
      planningNotes: QuestStub({
        planningNotes: {
          blightLedger: [
            QuestBlightLedgerEntryStub({
              itemId: REVIEW_ITEM_ID,
              workItemId: cwWorkItemId,
              createdAt: new Date().toISOString(),
            }),
          ],
        },
      }).planningNotes,
      operations: [
        OperationItemStub({
          id: cwOpId,
          role: 'codeweaver',
          text: 'core: config adapter',
          status: 'in_progress',
        }),
      ],
      workItems: [
        WorkItemStub({
          id: cwWorkItemId,
          role: 'codeweaver',
          status: 'in_progress',
          spawnerType: 'agent',
          relatedDataItems: [`operations/${String(cwOpId)}`],
          dependsOn: [],
          createdAt: new Date().toISOString(),
        }),
      ],
    });

    const result = await QuestHandleSignalBackResponder({
      questId,
      workItemId: cwWorkItemId,
      signal: 'complete',
      operationItemId: cwOpId,
      operationStatus: 'done',
    });

    const after = await questHelper.reload({ questId });

    testbed.cleanup();

    expect({
      responderResult: result,
      operationStatus: after.operations.find((op) => op.id === cwOpId)?.status,
      workItemStatus: after.workItems.find((wi) => wi.id === cwWorkItemId)?.status,
    }).toStrictEqual({
      responderResult: { success: true },
      operationStatus: 'complete',
      workItemStatus: 'complete',
    });
  }, 30_000);
});

// signoff-flow-outstanding-transformer.test.ts already cover exhaustively.
describe('QuestHandleSignalBackResponder (integration) — the two sign-off tracks', () => {
  const envHarness = orchestrationEnvironmentHarness();
  const questHelper = orchestrationQuestHarness();

  describe("flowrider: 'done' is refused while runtime units carry no flowriderSignoff", () => {
    it('ERROR: {done, one unsigned runtime terminal} => throws naming the unit and the field, and persists NOTHING', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'sb-flowrider-refuse' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const flowOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000f1' });
      const flowWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard' })],
            edges: [],
          }),
        ],
        operations: [
          OperationItemStub({
            id: flowOpId,
            role: 'flowrider',
            text: 'Flowrider: author the flow-perspective test suites across every quest flow',
            status: 'in_progress',
            locked: true,
            flowIds: [],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: flowWorkItemId,
            role: 'flowrider',
            status: 'in_progress',
            spawnerType: 'agent',
            relatedDataItems: [`operations/${String(flowOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      const before = await questHelper.readQuestFileRaw({ questId });

      await expect(
        QuestHandleSignalBackResponder({
          questId,
          workItemId: flowWorkItemId,
          signal: 'complete',
          operationItemId: flowOpId,
          operationStatus: 'done',
        }),
      ).rejects.toThrow(
        /signal-back refused: operationStatus 'done'.*`flowriderSignoff`.*1 still carry none.*- login-flow:terminal:dashboard/su,
      );

      const after = await questHelper.readQuestFileRaw({ questId });
      const afterQuest = await questHelper.reload({ questId });
      const workItem = afterQuest.workItems.find((wi) => wi.id === flowWorkItemId);
      const operation = afterQuest.operations.find((op) => op.id === flowOpId);

      testbed.cleanup();

      expect(after).toBe(before);
      expect({
        workItemStatus: workItem?.status,
        operationStatus: operation?.status,
      }).toStrictEqual({ workItemStatus: 'in_progress', operationStatus: 'in_progress' });
    }, 30_000);

    it('VALID: {done, one unit `confirmed` and one `unconfirmable`} => both verdicts clear the gate, operation + work item complete', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'sb-flowrider-admit' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const flowOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000f2' });
      const flowWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        planningNotes: QuestStub({
          planningNotes: {
            blightLedger: [
              QuestBlightLedgerEntryStub({
                itemId: REVIEW_ITEM_ID,
                workItemId: flowWorkItemId,
                createdAt: new Date().toISOString(),
              }),
            ],
          },
        }).planningNotes,
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({
                id: 'dashboard',
                label: 'Dashboard',
                flowriderSignoff: SignoffStub({
                  workItemId: flowWorkItemId,
                  evidence:
                    'packages/web/src/flows/login/login.e2e.ts:42 — red when the redirect is removed',
                }),
              }),
              FlowNodeStub({
                id: 'rate-limited',
                label: 'Rate limited',
                flowriderSignoff: SignoffStub({
                  verdict: 'unconfirmable',
                  evidence:
                    'the rate limiter needs 100 real requests, which the suite cannot issue',
                  question: 'can the limiter threshold be injected for tests?',
                  workItemId: flowWorkItemId,
                }),
              }),
            ],
            edges: [],
          }),
        ],
        operations: [
          OperationItemStub({
            id: flowOpId,
            role: 'flowrider',
            text: 'Flowrider: author the flow-perspective test suites across every quest flow',
            status: 'in_progress',
            locked: true,
            flowIds: [],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: flowWorkItemId,
            role: 'flowrider',
            status: 'in_progress',
            spawnerType: 'agent',
            relatedDataItems: [`operations/${String(flowOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      const result = await QuestHandleSignalBackResponder({
        questId,
        workItemId: flowWorkItemId,
        signal: 'complete',
        operationItemId: flowOpId,
        operationStatus: 'done',
      });

      const afterQuest = await questHelper.reload({ questId });
      const workItem = afterQuest.workItems.find((wi) => wi.id === flowWorkItemId);
      const operation = afterQuest.operations.find((op) => op.id === flowOpId);

      testbed.cleanup();

      expect(result).toStrictEqual({ success: true });
      expect({
        workItemStatus: workItem?.status,
        operationStatus: operation?.status,
      }).toStrictEqual({ workItemStatus: 'complete', operationStatus: 'complete' });
    }, 30_000);

    it('VALID: {done, every flow OPERATIONAL} => accepted, because the flowrider track is measured over runtime flows alone', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'sb-flowrider-operational' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const flowOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000f3' });
      const flowWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      // The SAME unsigned node shape the refusal test above uses — only `flowType` differs, so an
      // accept here can only come from the runtime filter and not from an unsigned node being
      // overlooked.
      await questHelper.seedInProgressRelay({
        questId,
        planningNotes: QuestStub({
          planningNotes: {
            blightLedger: [
              QuestBlightLedgerEntryStub({
                itemId: REVIEW_ITEM_ID,
                workItemId: flowWorkItemId,
                createdAt: new Date().toISOString(),
              }),
            ],
          },
        }).planningNotes,
        flows: [
          FlowStub({
            id: 'rollout-flow',
            name: 'Rollout Flow',
            flowType: 'operational',
            nodes: [FlowNodeStub({ id: 'rule-registered', label: 'Rule registered' })],
            edges: [],
          }),
        ],
        operations: [
          OperationItemStub({
            id: flowOpId,
            role: 'flowrider',
            text: 'Flowrider: author the flow-perspective test suites across every quest flow',
            status: 'in_progress',
            locked: true,
            flowIds: [],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: flowWorkItemId,
            role: 'flowrider',
            status: 'in_progress',
            spawnerType: 'agent',
            relatedDataItems: [`operations/${String(flowOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      const result = await QuestHandleSignalBackResponder({
        questId,
        workItemId: flowWorkItemId,
        signal: 'complete',
        operationItemId: flowOpId,
        operationStatus: 'done',
      });

      const afterQuest = await questHelper.reload({ questId });
      const operation = afterQuest.operations.find((op) => op.id === flowOpId);

      testbed.cleanup();

      expect(result).toStrictEqual({ success: true });
      expect(operation?.status).toBe('complete');
    }, 30_000);

    it("ERROR: {done, the same operational flow PLUS one runtime flow} => refused naming the runtime flow's unit, proving the accept above was zero units and not a skipped gate", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'sb-flowrider-mixed' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const flowOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000f4' });
      const flowWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        flows: [
          FlowStub({
            id: 'rollout-flow',
            name: 'Rollout Flow',
            flowType: 'operational',
            nodes: [FlowNodeStub({ id: 'rule-registered', label: 'Rule registered' })],
            edges: [],
          }),
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard' })],
            edges: [],
          }),
        ],
        operations: [
          OperationItemStub({
            id: flowOpId,
            role: 'flowrider',
            text: 'Flowrider: author the flow-perspective test suites across every quest flow',
            status: 'in_progress',
            locked: true,
            flowIds: [],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: flowWorkItemId,
            role: 'flowrider',
            status: 'in_progress',
            spawnerType: 'agent',
            relatedDataItems: [`operations/${String(flowOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      await expect(
        QuestHandleSignalBackResponder({
          questId,
          workItemId: flowWorkItemId,
          signal: 'complete',
          operationItemId: flowOpId,
          operationStatus: 'done',
        }),
      ).rejects.toThrow(
        /signal-back refused: operationStatus 'done'.*1 still carry none.*- login-flow:terminal:dashboard/su,
      );

      const afterQuest = await questHelper.reload({ questId });
      const operation = afterQuest.operations.find((op) => op.id === flowOpId);

      testbed.cleanup();

      expect(operation?.status).toBe('in_progress');
    }, 30_000);
  });

  describe('the two tracks are gated independently on the SAME persisted units', () => {
    it("ERROR: {every unit carries a flowriderSignoff only, siegemaster 'done'} => refused, because flowrider's column never settles siegemaster's", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'sb-tracks-independent' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const siegeOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000f5' });
      const siegeWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({
                id: 'dashboard',
                label: 'Dashboard',
                flowriderSignoff: SignoffStub(),
              }),
            ],
            edges: [],
            offMapSignoffs: OFF_MAP_FAMILIES.map((family) =>
              FlowOffMapSignoffStub({ id: family as never, flowriderSignoff: SignoffStub() }),
            ),
          }),
        ],
        operations: [
          OperationItemStub({
            id: siegeOpId,
            role: 'siegemaster',
            text: 'Siegemaster: manual-QA this flow — flow: login-flow',
            status: 'in_progress',
            locked: true,
            flowIds: ['login-flow'],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: siegeWorkItemId,
            role: 'siegemaster',
            status: 'in_progress',
            spawnerType: 'agent',
            relatedDataItems: [`operations/${String(siegeOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      await expect(
        QuestHandleSignalBackResponder({
          questId,
          workItemId: siegeWorkItemId,
          signal: 'complete',
          operationItemId: siegeOpId,
          operationStatus: 'done',
        }),
      ).rejects.toThrow(
        new RegExp(
          `\`siegemasterSignoff\`.*${String(OFF_MAP_FAMILIES.length + 1)} still carry none.*- login-flow:terminal:dashboard`,
          'su',
        ),
      );

      const afterQuest = await questHelper.reload({ questId });
      const operation = afterQuest.operations.find((op) => op.id === siegeOpId);

      testbed.cleanup();

      expect(operation?.status).toBe('in_progress');
    }, 30_000);

    it("VALID: {the same units also carry a siegemasterSignoff, siegemaster 'done'} => the gate clears", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'sb-tracks-both-signed' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const siegeOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000f6' });
      const siegeWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        planningNotes: QuestStub({
          planningNotes: {
            blightLedger: [
              QuestBlightLedgerEntryStub({
                itemId: REVIEW_ITEM_ID,
                workItemId: siegeWorkItemId,
                createdAt: new Date().toISOString(),
              }),
            ],
          },
        }).planningNotes,
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({
                id: 'dashboard',
                label: 'Dashboard',
                flowriderSignoff: SignoffStub(),
                siegemasterSignoff: SignoffStub({
                  evidence: 'the dashboard header read "Welcome, ada" in the live tab at :3737',
                  workItemId: siegeWorkItemId,
                }),
              }),
            ],
            edges: [],
            offMapSignoffs: OFF_MAP_FAMILIES.map((family) =>
              FlowOffMapSignoffStub({
                id: family as never,
                flowriderSignoff: SignoffStub(),
                siegemasterSignoff: SignoffStub({ workItemId: siegeWorkItemId }),
              }),
            ),
          }),
        ],
        operations: [
          OperationItemStub({
            id: siegeOpId,
            role: 'siegemaster',
            text: 'Siegemaster: manual-QA this flow — flow: login-flow',
            status: 'in_progress',
            locked: true,
            flowIds: ['login-flow'],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: siegeWorkItemId,
            role: 'siegemaster',
            status: 'in_progress',
            spawnerType: 'agent',
            relatedDataItems: [`operations/${String(siegeOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      const result = await QuestHandleSignalBackResponder({
        questId,
        workItemId: siegeWorkItemId,
        signal: 'complete',
        operationItemId: siegeOpId,
        operationStatus: 'done',
      });

      const afterQuest = await questHelper.reload({ questId });
      const operation = afterQuest.operations.find((op) => op.id === siegeOpId);

      testbed.cleanup();

      expect(result).toStrictEqual({ success: true });
      expect(operation?.status).toBe('complete');
    }, 30_000);
  });
});

// warpgate-merge:observable:worktree-survives-merge — "the quest's worktree directory and the
// quest/<slug>-<id8> branch both still exist after the merge, since follow-up on a merged quest
// spawns with the worktree as cwd." The actual git merge into base runs INSIDE the warpgate agent
// session, following its own prompt — no code in this repo performs it, so there is nothing to
// drive here that would prove the merge itself. What IS testable, and is exactly what this
// observable's design decision calls for, is the NEGATIVE claim: the merge-COMPLETION route (this
// responder, driven with the same signal-back a real warpgate session sends once its work has
// landed) never deletes the worktree directory or the quest branch on its way to settling the
// quest at `merged`. A mocked fs cannot observe an absence of deletion — this drives a REAL git
// repo + REAL `git worktree add` (never mocked) and re-checks both with real fs/git afterward.
describe('QuestHandleSignalBackResponder (integration) — warpgate merge completion leaves the worktree and branch on disk', () => {
  const envHarness = orchestrationEnvironmentHarness();
  const questHelper = orchestrationQuestHarness();
  const git = gitWorktreeFixtureHarness();

  it("VALID: {merging quest with a real worktree + branch, warpgate work item signals done} => quest.json derives to 'merged', the worktree directory still exists, and the quest branch still resolves", async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'sb-warpgate-worktree' }),
    });
    envHarness.setupHome({ tempDir: testbed.guildPath });

    const { questId } = await questHelper.createGuildAndQuest({ testbed });

    const repoPath = AbsoluteFilePathStub({ value: testbed.guildPath });
    await git.initRepoWithPackages({
      repoPath,
      initialBranchName: FileNameStub({ value: 'main' }),
      packageNames: [FileNameStub({ value: 'shared' })],
    });

    const worktreePath = AbsoluteFilePathStub({
      value: `${testbed.guildPath}/worktrees/warpgate-survives-a1b2c3d4`,
    });
    const branchName = QuestBranchNameStub({ value: 'quest/warpgate-survives-a1b2c3d4' });
    await gitWorktreeAddAdapter({
      cwd: repoPath,
      worktreePath,
      branchName,
      baseBranch: BaseBranchNameStub({ value: 'main' }),
      mode: 'create-branch',
    });

    const warpgateOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000f7' });
    const warpgateWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

    await questHelper.seedInProgressRelay({
      questId,
      status: 'merging',
      worktreePath,
      branchName,
      operations: [
        OperationItemStub({
          id: warpgateOpId,
          role: 'warpgate',
          text: 'Merge the quest branch home',
          status: 'in_progress',
          locked: true,
        }),
      ],
      workItems: [
        WorkItemStub({
          id: warpgateWorkItemId,
          role: 'warpgate',
          status: 'in_progress',
          spawnerType: 'agent',
          relatedDataItems: [`operations/${String(warpgateOpId)}`],
          dependsOn: [],
          createdAt: new Date().toISOString(),
        }),
      ],
    });

    const worktreeExistedBefore = git.pathExists({ absolutePath: worktreePath });
    const branchShaBefore = await git.gitRevParseOrNull({
      repoPath,
      ref: ErrorMessageStub({ value: String(branchName) }),
    });

    const result = await QuestHandleSignalBackResponder({
      questId,
      workItemId: warpgateWorkItemId,
      signal: 'complete',
      operationItemId: warpgateOpId,
      operationStatus: 'done',
    });

    const afterQuest = await questHelper.reload({ questId });
    const warpgateOperation = afterQuest.operations.find((op) => op.id === warpgateOpId);
    const warpgateWorkItem = afterQuest.workItems.find((item) => item.id === warpgateWorkItemId);
    const worktreeExistsAfter = git.pathExists({ absolutePath: worktreePath });
    const branchShaAfter = await git.gitRevParseOrNull({
      repoPath,
      ref: ErrorMessageStub({ value: String(branchName) }),
    });

    testbed.cleanup();

    // FAILS IF the completion route ever removes the worktree directory or the quest branch on
    // its way to `merged` — worktreeExistsAfter would flip false, or branchShaAfter would flip
    // null / a different sha. worktreeExistedBefore/branchShaBefore being real (not vacuous)
    // is proven by the mutation witness recorded in this task's artifact: a temporary
    // `git worktree remove --force` + `git branch -D` spliced onto this same completion route
    // turned both fields red before being reverted.
    expect({
      responderResult: result,
      questStatus: afterQuest.status,
      // warpgate-merge:observable:warpgate-signals-done — the {signal:'complete',
      // operationStatus:'done'} call a finished warpgate session sends marks ITS OWN operation
      // item complete and terminalizes its work item. Read directly rather than inferred from
      // `merged`: the derived status is what the ledger drained TO, so a responder that settled
      // the quest without ever completing this item would have to be caught here.
      warpgateOperationStatus: warpgateOperation?.status,
      warpgateWorkItemStatus: warpgateWorkItem?.status,
      warpgateWorkItemSignal: warpgateWorkItem?.actualSignal,
      worktreeExistedBefore,
      worktreeExistsAfter,
      branchResolvedBefore: branchShaBefore !== null,
      branchResolvedAfter: branchShaAfter !== null,
      branchShaUnchanged: branchShaBefore === branchShaAfter,
    }).toStrictEqual({
      responderResult: { success: true },
      questStatus: 'merged',
      warpgateOperationStatus: 'complete',
      warpgateWorkItemStatus: 'complete',
      warpgateWorkItemSignal: 'complete',
      worktreeExistedBefore: true,
      worktreeExistsAfter: true,
      branchResolvedBefore: true,
      branchResolvedAfter: true,
      branchShaUnchanged: true,
    });
  }, 30_000);
});
