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
import { blightConcernLegendStatics } from '../../../statics/blight-concern-legend/blight-concern-legend-statics';
import { blightscoutOperationStatics } from '../../../statics/blightscout-operation/blightscout-operation-statics';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { orchestrationEnvironmentHarness } from '../../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { orchestrationQuestHarness } from '../../../../test/harnesses/orchestration-quest/orchestration-quest.harness';
import { gitWorktreeFixtureHarness } from '../../../../test/harnesses/git-worktree-fixture/git-worktree-fixture.harness';

// The off-map probe families every flow decomposes into — Siegemaster's charter alone, absent from
// Flowrider's denominator. Derived from the probe statics, whose colocated test pins its keys 1:1
// with qaOffMapFamilyContract's options.
const OFF_MAP_FAMILIES = Object.keys(qaOffMapProbeStatics.byFamily);

// The concern families every changed file crosses — derived from the legend statics, whose keys
// are pinned 1:1 with blightConcernContract's options, so a concern added there is swept into the
// outstanding-unit count below instead of quietly under-counting it.
const BLIGHT_CONCERNS = Object.keys(blightConcernLegendStatics.byConcern);

// blightscout is a work-item role scoped to ONE COMMIT, with a server-computed completion gate:
// `done` recomputes the outstanding review-unit set from a REAL `git diff HEAD~1...HEAD` (via
// questGetBlightChecklistBroker, scope: 'commit') crossed with the quest's blightLedger, and
// refuses the signal while any unit carries no disposition. It reviews alone and summons no
// minions — the surface is one session's own commit. These tests drive the real responder -> real
// broker chain against a real git repo + real disk (never mocked) to prove the gate's wiring, not
// just the transformer's logic (already unit-tested in blight-coverage-outstanding-transformer.test.ts
// and the responder's own unit test, which mock the checklist broker). One changed file crosses
// every concern, so an empty ledger leaves that many units outstanding.
describe('QuestHandleSignalBackResponder (integration) — blightscout completion gate', () => {
  const envHarness = orchestrationEnvironmentHarness();
  const questHelper = orchestrationQuestHarness();

  describe("gate refuses 'done' while blight units carry no disposition", () => {
    it('ERROR: {done, one real changed file, empty blightLedger} => throws naming every outstanding unit and persists NOTHING', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'sb-blight-refuse' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });
      const { baseRef } = await questHelper.initGitRepoAndCommitBase({
        repoPath: testbed.guildPath,
      });
      const implPath = RepoRelativePathStub({
        value: 'packages/orchestrator/src/foo/foo-broker.ts',
      });
      await questHelper.commitChangedFiles({
        repoPath: testbed.guildPath,
        files: [
          {
            relativePath: implPath,
            content: FileContentsStub({ value: 'export const fooBroker = (): number => 1;\n' }),
          },
        ],
      });

      const blightOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000d1' });
      const blightWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        baseRef,
        operations: [
          OperationItemStub({
            id: blightOpId,
            role: 'blightscout',
            text: 'Blightscout: cross-cutting audit across the whole diff',
            status: 'in_progress',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: blightWorkItemId,
            role: 'blightscout',
            status: 'in_progress',
            spawnerType: 'agent',
            relatedDataItems: [`operations/${String(blightOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      const before = await questHelper.readQuestFileRaw({ questId });

      await expect(
        QuestHandleSignalBackResponder({
          questId,
          workItemId: blightWorkItemId,
          signal: 'complete',
          operationItemId: blightOpId,
          operationStatus: 'done',
        }),
      ).rejects.toThrow(
        new RegExp(
          `signal-back refused: operationStatus 'done'.*${String(BLIGHT_CONCERNS.length)} still carry none.*packages\\/orchestrator\\/src\\/foo\\/foo-broker\\.ts:craft`,
          'su',
        ),
      );

      const after = await questHelper.readQuestFileRaw({ questId });
      const afterQuest = await questHelper.reload({ questId });
      const blightWorkItem = afterQuest.workItems.find((wi) => wi.id === blightWorkItemId);
      const blightOperation = afterQuest.operations.find((op) => op.id === blightOpId);

      testbed.cleanup();

      expect(after).toBe(before);
      expect({
        workItemStatus: blightWorkItem?.status,
        operationStatus: blightOperation?.status,
      }).toStrictEqual({ workItemStatus: 'in_progress', operationStatus: 'in_progress' });
    }, 30_000);

    it('VALID: {done, every one of the 5 units carries a disposition — mixing reviewed/fixed/gap/recorded} => the gate clears, operation + work item complete', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'sb-blight-admit' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });
      const { baseRef } = await questHelper.initGitRepoAndCommitBase({
        repoPath: testbed.guildPath,
      });
      const implPath = RepoRelativePathStub({
        value: 'packages/orchestrator/src/foo/foo-broker.ts',
      });
      await questHelper.commitChangedFiles({
        repoPath: testbed.guildPath,
        files: [
          {
            relativePath: implPath,
            content: FileContentsStub({ value: 'export const fooBroker = (): number => 1;\n' }),
          },
        ],
      });

      const blightOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000d2' });
      const blightWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const impl = String(implPath);
      const createdAt = new Date().toISOString();
      // Every disposition family clears a unit — reviewed/fixed AND the honest-absence answers
      // gap/recorded — the gate refuses absence, not honesty, so this mixes all five on purpose.
      const ledger = [
        QuestBlightLedgerEntryStub({
          itemId: `${impl}:craft`,
          disposition: 'fixed',
          evidence: 'error handling now carries the failing input',
          observedBy: 'blightscout',
          workItemId: blightWorkItemId,
          createdAt,
        }),
        QuestBlightLedgerEntryStub({
          itemId: `${impl}:perf`,
          disposition: 'reviewed',
          evidence: 'fooBroker does no loops or I/O',
          observedBy: 'blightscout',
          workItemId: blightWorkItemId,
          createdAt,
        }),
        QuestBlightLedgerEntryStub({
          itemId: `${impl}:dedup`,
          disposition: 'gap',
          evidence: 'no equivalent existing implementation to compare against',
          observedBy: 'blightscout',
          workItemId: blightWorkItemId,
          createdAt,
        }),
        QuestBlightLedgerEntryStub({
          itemId: `${impl}:integrity`,
          disposition: 'recorded',
          evidence: 'one caller not yet migrated, handed to codeweaver follow-up',
          observedBy: 'blightscout',
          owner: 'codeweaver-followup',
          workItemId: blightWorkItemId,
          createdAt,
        }),
        QuestBlightLedgerEntryStub({
          itemId: `${impl}:test-cases`,
          disposition: 'reviewed',
          evidence: 'the only branch fooBroker has is already covered by the existing test',
          observedBy: 'blightscout',
          workItemId: blightWorkItemId,
          createdAt,
        }),
      ];

      await questHelper.seedInProgressRelay({
        questId,
        baseRef,
        planningNotes: { blightReports: [], qaLedger: [], blightLedger: ledger, questNotes: [] },
        operations: [
          OperationItemStub({
            id: blightOpId,
            role: 'blightscout',
            text: 'Blightscout: cross-cutting audit across the whole diff',
            status: 'in_progress',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: blightWorkItemId,
            role: 'blightscout',
            status: 'in_progress',
            spawnerType: 'agent',
            relatedDataItems: [`operations/${String(blightOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      const result = await QuestHandleSignalBackResponder({
        questId,
        workItemId: blightWorkItemId,
        signal: 'complete',
        operationItemId: blightOpId,
        operationStatus: 'done',
      });

      const afterQuest = await questHelper.reload({ questId });
      const blightWorkItem = afterQuest.workItems.find((wi) => wi.id === blightWorkItemId);
      const blightOperation = afterQuest.operations.find((op) => op.id === blightOpId);

      testbed.cleanup();

      expect(result).toStrictEqual({ success: true });
      expect({
        workItemStatus: blightWorkItem?.status,
        operationStatus: blightOperation?.status,
      }).toStrictEqual({ workItemStatus: 'complete', operationStatus: 'complete' });
    }, 30_000);

    it('VALID: {done, quest.baseRef never pinned} => NOT gated, so a quest seeded before the review base existed still completes', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'sb-blight-no-baseref' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const blightOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000d5' });
      const blightWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      // guild.path is deliberately NOT a git repo here: if the gate wrongly ran a diff despite the
      // missing baseRef, `git diff` would fail against a non-repo directory and this call would
      // reject instead of resolving — the absence of a repo is itself part of the proof.
      await questHelper.seedInProgressRelay({
        questId,
        operations: [
          OperationItemStub({
            id: blightOpId,
            role: 'blightscout',
            text: 'Blightscout: cross-cutting audit across the whole diff',
            status: 'in_progress',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: blightWorkItemId,
            role: 'blightscout',
            status: 'in_progress',
            spawnerType: 'agent',
            relatedDataItems: [`operations/${String(blightOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      const result = await QuestHandleSignalBackResponder({
        questId,
        workItemId: blightWorkItemId,
        signal: 'complete',
        operationItemId: blightOpId,
        operationStatus: 'done',
      });

      const afterQuest = await questHelper.reload({ questId });
      const blightOperation = afterQuest.operations.find((op) => op.id === blightOpId);

      testbed.cleanup();

      expect(result).toStrictEqual({ success: true });
      expect(blightOperation?.status).toBe('complete');
    }, 30_000);
  });

  describe('the gate is scoped to blightscout only', () => {
    it('VALID: {codeweaver done, quest.baseRef set but no git repo at guild.path} => resolves normally, proving the blight checklist broker was never invoked', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'sb-blight-scope-cw' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });
      // A real-shaped sha with NO git repo on disk at guild.path: if the responder wrongly ran
      // the blight checklist broker for a non-blightscout role, the underlying `git diff` would
      // fail against a non-repo directory and this call would reject instead of resolving.
      const fakeBaseRef = QuestStub({
        baseRef: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef' as never,
      }).baseRef!;

      const cwOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000d7' });
      const cwWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        baseRef: fakeBaseRef,
        operations: [
          OperationItemStub({
            id: cwOpId,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'in_progress',
            locked: false,
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

      testbed.cleanup();

      expect(result).toStrictEqual({ success: true });
    }, 30_000);

    it('VALID: {siegemaster done with no flowIds, quest.baseRef set but no git repo at guild.path} => resolves normally, proving the blight checklist broker was never invoked', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'sb-blight-scope-sm' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });
      const fakeBaseRef = QuestStub({
        baseRef: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef' as never,
      }).baseRef!;

      const smOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000d8' });
      const smWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        baseRef: fakeBaseRef,
        operations: [
          OperationItemStub({
            id: smOpId,
            role: 'siegemaster',
            text: 'Siegemaster: manual-QA this flow and review its test suite',
            status: 'in_progress',
            locked: true,
            flowIds: [],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: smWorkItemId,
            role: 'siegemaster',
            status: 'in_progress',
            spawnerType: 'agent',
            relatedDataItems: [`operations/${String(smOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      const result = await QuestHandleSignalBackResponder({
        questId,
        workItemId: smWorkItemId,
        signal: 'complete',
        operationItemId: smOpId,
        operationStatus: 'done',
      });

      testbed.cleanup();

      expect(result).toStrictEqual({ success: true });
    }, 30_000);
  });
});

// The standards review is not seeded by Start Quest — the signal-back handler appends it after
// every COMMITTING session so the review runs next to the commit it measures. These drive the real
// responder -> real questOperationsUpdateBroker -> real disk chain and read the persisted quest.json
// back, because the load-bearing property is what the FILE ends up holding: an operation item AND
// its linked work item, written together, so questAdvanceBroker's strict-1:1 resume guard can never
// mint a second work item for the review.
describe('QuestHandleSignalBackResponder (integration) — the blightscout auto-append', () => {
  const envHarness = orchestrationEnvironmentHarness();
  const questHelper = orchestrationQuestHarness();

  it('VALID: {codeweaver done} => quest.json gains a pending LOCKED blightscout operation plus its linked work item, chained after the session that committed', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'sb-scout-append' }),
    });
    envHarness.setupHome({ tempDir: testbed.guildPath });

    const { questId } = await questHelper.createGuildAndQuest({ testbed });

    const cwOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000e1' });
    const cwWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

    await questHelper.seedInProgressRelay({
      questId,
      operations: [
        OperationItemStub({
          id: cwOpId,
          role: 'codeweaver',
          text: 'core: config adapter',
          status: 'in_progress',
          locked: false,
          // Declared scope on the item the scout follows — the assertions below prove NONE of it is
          // copied onto the review, whose denominator comes from the commit diff alone.
          flowIds: ['login-flow'],
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
    const scoutOperation = after.operations.find((op) => op.role === 'blightscout');
    const scoutWorkItem = after.workItems.find((wi) => wi.role === 'blightscout');
    // Resolves the work item's ref back through the ledger rather than re-reading the id it was
    // built from — that round trip is the actual 1:1 link, and it is what advance's resume guard
    // keys on.
    const linkedOperationRole = after.operations.find(
      (op) => `operations/${String(op.id)}` === String(scoutWorkItem?.relatedDataItems[0]),
    )?.role;

    testbed.cleanup();

    expect(result).toStrictEqual({ success: true });
    expect({
      operationRoles: after.operations.map((op) => op.role),
      operationStatuses: after.operations.map((op) => op.status),
      scoutText: String(scoutOperation?.text),
      scoutLocked: scoutOperation?.locked,
      scoutFlowIds: scoutOperation?.flowIds,
      scoutPackageNames: scoutOperation?.packageNames,
      workItemRoles: after.workItems.map((wi) => wi.role),
      workItemStatuses: after.workItems.map((wi) => wi.status),
      scoutSpawnerType: scoutWorkItem?.spawnerType,
      scoutDependsOn: scoutWorkItem?.dependsOn,
      linkedOperationRole,
    }).toStrictEqual({
      operationRoles: ['codeweaver', 'blightscout'],
      operationStatuses: ['complete', 'pending'],
      // Names the codeweaver item whose session made the commit, which is what keys this review's
      // OWN pt chain — a scout sharing one sentence with its siblings shares their budget too.
      scoutText: blightscoutOperationStatics.textTemplate.replace(
        blightscoutOperationStatics.placeholders.reviewedOperation,
        `codeweaver ${String(cwOpId)}`,
      ),
      scoutLocked: true,
      scoutFlowIds: [],
      scoutPackageNames: [],
      workItemRoles: ['codeweaver', 'blightscout'],
      workItemStatuses: ['complete', 'pending'],
      scoutSpawnerType: 'agent',
      scoutDependsOn: [cwWorkItemId],
      linkedOperationRole: 'blightscout',
    });
  }, 30_000);

  // The termination proof on real disk: blightscout is absent from
  // blightscoutOperationStatics.committingRoles, so a review going complete appends no successor.
  // Without that absence this call would leave a second pending scout behind, and every scout after
  // it would leave one more.
  it('VALID: {blightscout done} => exactly one blightscout operation remains, because a scout never mints a scout', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'sb-scout-terminates' }),
    });
    envHarness.setupHome({ tempDir: testbed.guildPath });

    const { questId } = await questHelper.createGuildAndQuest({ testbed });

    const scoutOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000e2' });
    const scoutWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

    // No baseRef is pinned, so the blightscout completion gate resolves to a null checklist and
    // does not bind — this case is about the append, not the gate (covered above).
    await questHelper.seedInProgressRelay({
      questId,
      operations: [
        OperationItemStub({
          id: scoutOpId,
          role: 'blightscout',
          // A review of an earlier codeweaver commit, minted the way the append site mints it.
          text: blightscoutOperationStatics.textTemplate.replace(
            blightscoutOperationStatics.placeholders.reviewedOperation,
            'codeweaver 00000000-0000-4000-8000-0000000000e1',
          ),
          status: 'in_progress',
          locked: true,
        }),
      ],
      workItems: [
        WorkItemStub({
          id: scoutWorkItemId,
          role: 'blightscout',
          status: 'in_progress',
          spawnerType: 'agent',
          relatedDataItems: [`operations/${String(scoutOpId)}`],
          dependsOn: [],
          createdAt: new Date().toISOString(),
        }),
      ],
    });

    const result = await QuestHandleSignalBackResponder({
      questId,
      workItemId: scoutWorkItemId,
      signal: 'complete',
      operationItemId: scoutOpId,
      operationStatus: 'done',
    });

    const after = await questHelper.reload({ questId });

    testbed.cleanup();

    expect(result).toStrictEqual({ success: true });
    expect({
      operationRoles: after.operations.map((op) => op.role),
      operationStatuses: after.operations.map((op) => op.status),
      workItemRoles: after.workItems.map((wi) => wi.role),
      workItemStatuses: after.workItems.map((wi) => wi.status),
    }).toStrictEqual({
      operationRoles: ['blightscout'],
      operationStatuses: ['complete'],
      workItemRoles: ['blightscout'],
      workItemStatuses: ['complete'],
    });
  }, 30_000);
});

// `slotManagerStatics.blightscout.maxAttempts` bounds the review of ONE COMMIT, not the reviews of
// a whole quest — and `operationPtChainTransformer` keys a chain on role + base text, so what makes
// the two readings differ is entirely whether the scout's text names the commit it reviews. These
// two tests are the two halves of that budget. Both drive the REAL responder across a whole relay
// on real disk instead of seeding scout items, because a seeded text pins only what the fixture
// decided to write — the property under test is what the APPEND SITE mints, and neither test names
// the text format at all: each reads the scout text back off the ledger and asserts against that.
describe('QuestHandleSignalBackResponder (integration) — the blightscout pt budget is per COMMIT', () => {
  const envHarness = orchestrationEnvironmentHarness();
  const questHelper = orchestrationQuestHarness();

  // The live defect this pins: four committing sessions on one quest mint four scouts, and while
  // those four share one base text they read as ONE chain of four. The fourth scout's `partial` —
  // an ordinary outcome for a review of five concerns over a commit — then trips the spent-budget
  // halt and blocks a quest with the whole verify tail still ahead of it. On a quest with 18
  // codeweaver cells that lands almost immediately.
  it("VALID: {four committing sessions each reviewed, then the fourth scout signals 'partial'} => a 'pt 2' of its OWN chain is appended and the quest keeps running", async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'sb-scout-per-commit' }),
    });
    envHarness.setupHome({ tempDir: testbed.guildPath });

    const { questId } = await questHelper.createGuildAndQuest({ testbed });

    const cwOp1 = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000a1' });
    const cwOp2 = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000a2' });
    const cwOp3 = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000a3' });
    const cwOp4 = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000a4' });
    const wardOp = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000a5' });
    const cw1WorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

    // Four derived codeweaver cells, exactly as `relayTailFanOutTransformer` mints them, with the
    // seeded verify tail still behind them — a scout ALWAYS has work after it, which is what makes
    // a spent-budget halt cost the quest something. No baseRef is pinned, so each scout's `done`
    // resolves to a null checklist and the completion gate does not bind: this test is about the pt
    // chain, not the gate.
    await questHelper.seedInProgressRelay({
      questId,
      operations: [
        OperationItemStub({
          id: cwOp1,
          role: 'codeweaver',
          text: 'Implement the flows — orchestrator: foundation',
          status: 'in_progress',
          locked: false,
        }),
        OperationItemStub({
          id: cwOp2,
          role: 'codeweaver',
          text: 'Implement the flows — orchestrator: login-flow',
          status: 'pending',
          locked: false,
        }),
        OperationItemStub({
          id: cwOp3,
          role: 'codeweaver',
          text: 'Implement the flows — web: foundation',
          status: 'pending',
          locked: false,
        }),
        OperationItemStub({
          id: cwOp4,
          role: 'codeweaver',
          text: 'Implement the flows — web: login-flow',
          status: 'pending',
          locked: false,
        }),
        OperationItemStub({
          id: wardOp,
          role: 'ward',
          text: 'Ward gate (full monorepo)',
          status: 'pending',
          locked: true,
          wardMode: 'full',
        }),
      ],
      workItems: [
        WorkItemStub({
          id: cw1WorkItemId,
          role: 'codeweaver',
          status: 'in_progress',
          spawnerType: 'agent',
          relatedDataItems: [`operations/${String(cwOp1)}`],
          dependsOn: [],
          createdAt: new Date().toISOString(),
        }),
      ],
    });

    // Session 1 commits -> its scout is appended and is the next thing dispatched.
    await QuestHandleSignalBackResponder({
      questId,
      workItemId: cw1WorkItemId,
      signal: 'complete',
      operationItemId: cwOp1,
      operationStatus: 'done',
    });
    const afterCommit1 = await questHelper.reload({ questId });
    const scout1WorkItem = afterCommit1.workItems.filter((wi) => wi.role === 'blightscout').at(-1)!;

    // Scout 1 settles its commit; advance then mints the work item for the second cell.
    await QuestHandleSignalBackResponder({
      questId,
      workItemId: scout1WorkItem.id,
      signal: 'complete',
      operationStatus: 'done',
    });
    const afterScout1 = await questHelper.reload({ questId });
    const cw2WorkItem = afterScout1.workItems.find(
      (wi) => String(wi.relatedDataItems[0]) === `operations/${String(cwOp2)}`,
    )!;

    await QuestHandleSignalBackResponder({
      questId,
      workItemId: cw2WorkItem.id,
      signal: 'complete',
      operationStatus: 'done',
    });
    const afterCommit2 = await questHelper.reload({ questId });
    const scout2WorkItem = afterCommit2.workItems.filter((wi) => wi.role === 'blightscout').at(-1)!;

    await QuestHandleSignalBackResponder({
      questId,
      workItemId: scout2WorkItem.id,
      signal: 'complete',
      operationStatus: 'done',
    });
    const afterScout2 = await questHelper.reload({ questId });
    const cw3WorkItem = afterScout2.workItems.find(
      (wi) => String(wi.relatedDataItems[0]) === `operations/${String(cwOp3)}`,
    )!;

    await QuestHandleSignalBackResponder({
      questId,
      workItemId: cw3WorkItem.id,
      signal: 'complete',
      operationStatus: 'done',
    });
    const afterCommit3 = await questHelper.reload({ questId });
    const scout3WorkItem = afterCommit3.workItems.filter((wi) => wi.role === 'blightscout').at(-1)!;

    await QuestHandleSignalBackResponder({
      questId,
      workItemId: scout3WorkItem.id,
      signal: 'complete',
      operationStatus: 'done',
    });
    const afterScout3 = await questHelper.reload({ questId });
    const cw4WorkItem = afterScout3.workItems.find(
      (wi) => String(wi.relatedDataItems[0]) === `operations/${String(cwOp4)}`,
    )!;

    // Session 4 commits — its scout is the FOURTH on this quest, and under one shared base text it
    // is the fourth link of one chain rather than the first link of its own.
    await QuestHandleSignalBackResponder({
      questId,
      workItemId: cw4WorkItem.id,
      signal: 'complete',
      operationStatus: 'done',
    });
    const afterCommit4 = await questHelper.reload({ questId });
    const scout4WorkItem = afterCommit4.workItems.filter((wi) => wi.role === 'blightscout').at(-1)!;
    // Read back off the ledger rather than composed here: the test asserts that the four texts
    // DIFFER, never what the append site writes into them.
    const scoutTextsBeforePartial = afterCommit4.operations
      .filter((op) => op.role === 'blightscout')
      .map((op) => String(op.text));

    // The ordinary review outcome: five concerns over a commit, some still open.
    const result = await QuestHandleSignalBackResponder({
      questId,
      workItemId: scout4WorkItem.id,
      signal: 'complete',
      operationStatus: 'partial',
    });

    const final = await questHelper.reload({ questId });
    const finalScouts = final.operations.filter((op) => op.role === 'blightscout');

    testbed.cleanup();

    expect(result).toStrictEqual({ success: true });
    expect({
      scoutCount: scoutTextsBeforePartial.length,
      distinctScoutTexts: [...new Set(scoutTextsBeforePartial)].length,
      questStatus: final.status,
      scoutTexts: finalScouts.map((op) => String(op.text)),
      scoutStatuses: finalScouts.map((op) => op.status),
      skippedWorkItemCount: final.workItems.filter((wi) => wi.status === 'skipped').length,
    }).toStrictEqual({
      scoutCount: 4,
      // The whole fix in one number: four commits reviewed, four separate chains, four budgets.
      distinctScoutTexts: 4,
      questStatus: 'in_progress',
      scoutTexts: [...scoutTextsBeforePartial, `pt 2: ${String(scoutTextsBeforePartial.at(-1))}`],
      // The continuation is already `in_progress`: advance ran (the halt routes are what skip it)
      // and minted its work item, so the second pass over this commit is dispatchable rather than
      // the quest being dead.
      scoutStatuses: ['complete', 'complete', 'complete', 'complete', 'in_progress'],
      skippedWorkItemCount: 0,
    });
  }, 60_000);

  // The other half, and the reason the fix cannot be "mint scouts unlocked": one commit still gets
  // exactly `slotManagerStatics.blightscout.maxAttempts` passes. A review that cannot settle one
  // commit in three is a halt worth surfacing, not an unbounded loop.
  it("VALID: {the SAME scout signals 'partial' three times over one commit} => the third spends the budget and blocks the quest with no 'pt 4'", async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'sb-scout-budget-spent' }),
    });
    envHarness.setupHome({ tempDir: testbed.guildPath });

    const { questId } = await questHelper.createGuildAndQuest({ testbed });

    const cwOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000b7' });
    const wardOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000b8' });
    const cwWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

    await questHelper.seedInProgressRelay({
      questId,
      operations: [
        OperationItemStub({
          id: cwOpId,
          role: 'codeweaver',
          text: 'Implement the flows — orchestrator: foundation',
          status: 'in_progress',
          locked: false,
        }),
        // The verify tail still waiting behind the review — what a spent budget costs the quest,
        // and what keeps the quest deriving `in_progress` so the halt's `-> blocked` transition is
        // a legal one rather than a refused write on an already-drained ledger.
        OperationItemStub({
          id: wardOpId,
          role: 'ward',
          text: 'Ward gate (full monorepo)',
          status: 'pending',
          locked: true,
          wardMode: 'full',
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

    await QuestHandleSignalBackResponder({
      questId,
      workItemId: cwWorkItemId,
      signal: 'complete',
      operationItemId: cwOpId,
      operationStatus: 'done',
    });
    const afterCommit = await questHelper.reload({ questId });
    const scoutWorkItem = afterCommit.workItems.filter((wi) => wi.role === 'blightscout').at(-1)!;
    const scoutBaseText = String(
      afterCommit.operations.filter((op) => op.role === 'blightscout').at(-1)?.text,
    );

    // Attempt 1 of 3.
    await QuestHandleSignalBackResponder({
      questId,
      workItemId: scoutWorkItem.id,
      signal: 'complete',
      operationStatus: 'partial',
    });
    const afterPartial1 = await questHelper.reload({ questId });
    const pt2WorkItem = afterPartial1.workItems.filter((wi) => wi.role === 'blightscout').at(-1)!;

    // Attempt 2 of 3.
    await QuestHandleSignalBackResponder({
      questId,
      workItemId: pt2WorkItem.id,
      signal: 'complete',
      operationStatus: 'partial',
    });
    const afterPartial2 = await questHelper.reload({ questId });
    const pt3WorkItem = afterPartial2.workItems.filter((wi) => wi.role === 'blightscout').at(-1)!;

    // Attempt 3 of 3 — the budget is spent, so this halts instead of appending a fourth pass.
    const result = await QuestHandleSignalBackResponder({
      questId,
      workItemId: pt3WorkItem.id,
      signal: 'complete',
      operationStatus: 'partial',
    });

    const final = await questHelper.reload({ questId });
    const finalScouts = final.operations.filter((op) => op.role === 'blightscout');

    testbed.cleanup();

    expect(result).toStrictEqual({ success: true });
    // The unrolled three attempts above encode this budget; pin it so a change to the statics
    // reddens here rather than quietly turning this into a two-of-three test.
    expect(slotManagerStatics.blightscout.maxAttempts).toBe(3);
    expect({
      questStatus: final.status,
      scoutTexts: finalScouts.map((op) => String(op.text)),
      scoutStatuses: finalScouts.map((op) => op.status),
    }).toStrictEqual({
      questStatus: 'blocked',
      scoutTexts: [scoutBaseText, `pt 2: ${scoutBaseText}`, `pt 3: ${scoutBaseText}`],
      scoutStatuses: ['complete', 'complete', 'complete'],
    });
  }, 60_000);
});

// flowrider and siegemaster are the two INDEPENDENT verification tracks. `done` from either
// recomputes the outstanding unit set straight off the persisted flow graph, reading only that
// role's own sign-off field, and refuses the signal while any unit in its scope carries none. These
// tests drive the real responder -> real broker -> real disk chain (never mocked) to prove the
// wiring, not just the transformer's logic — which signoff-outstanding-transformer.test.ts and
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
