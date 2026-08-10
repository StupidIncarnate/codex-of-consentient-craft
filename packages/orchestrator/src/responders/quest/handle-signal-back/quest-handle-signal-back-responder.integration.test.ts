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
import { orchestrationEnvironmentHarness } from '../../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { orchestrationQuestHarness } from '../../../../test/harnesses/orchestration-quest/orchestration-quest.harness';
import { gitWorktreeFixtureHarness } from '../../../../test/harnesses/git-worktree-fixture/git-worktree-fixture.harness';

// The off-map probe families every flow decomposes into — Siegemaster's charter alone, absent from
// Flowrider's denominator. Derived from the probe statics, whose colocated test pins its keys 1:1
// with qaOffMapFamilyContract's options.
const OFF_MAP_FAMILIES = Object.keys(qaOffMapProbeStatics.byFamily);

// blightwarden is an OPERATOR with a server-computed completion gate: `done` recomputes the
// outstanding review-unit set from a REAL `git diff quest.baseRef...HEAD` (via
// questGetBlightChecklistBroker) crossed with the quest's blightLedger, and refuses the signal
// while any unit carries no disposition. These tests drive the real responder -> real broker chain
// against a real git repo + real disk (never mocked) to prove the gate's wiring, not just the
// transformer's logic (already unit-tested in blight-coverage-outstanding-transformer.test.ts and
// the responder's own unit test, which mock the checklist broker). One changed file crosses all 4
// concerns (craft, perf, dedup, integrity), so an empty ledger leaves 4 units outstanding.
describe('QuestHandleSignalBackResponder (integration) — blightwarden completion gate', () => {
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
            role: 'blightwarden',
            text: 'Blightwarden: cross-cutting audit across the whole diff',
            status: 'in_progress',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: blightWorkItemId,
            role: 'blightwarden',
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
        /signal-back refused: operationStatus 'done'.*4 still carry none.*packages\/orchestrator\/src\/foo\/foo-broker\.ts:craft/su,
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

    it('VALID: {done, every one of the 4 units carries a disposition — mixing reviewed/fixed/gap/recorded} => the gate clears, operation + work item complete', async () => {
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
      // gap/recorded — the gate refuses absence, not honesty, so this mixes all four on purpose.
      const ledger = [
        QuestBlightLedgerEntryStub({
          itemId: `${impl}:craft`,
          disposition: 'fixed',
          evidence: 'error handling now carries the failing input',
          observedBy: 'blightwarden',
          workItemId: blightWorkItemId,
          createdAt,
        }),
        QuestBlightLedgerEntryStub({
          itemId: `${impl}:perf`,
          disposition: 'reviewed',
          evidence: 'fooBroker does no loops or I/O',
          observedBy: 'blightwarden',
          workItemId: blightWorkItemId,
          createdAt,
        }),
        QuestBlightLedgerEntryStub({
          itemId: `${impl}:dedup`,
          disposition: 'gap',
          evidence: 'no equivalent existing implementation to compare against',
          observedBy: 'blightwarden',
          workItemId: blightWorkItemId,
          createdAt,
        }),
        QuestBlightLedgerEntryStub({
          itemId: `${impl}:integrity`,
          disposition: 'recorded',
          evidence: 'one caller not yet migrated, handed to codeweaver follow-up',
          observedBy: 'blightwarden',
          owner: 'codeweaver-followup',
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
            role: 'blightwarden',
            text: 'Blightwarden: cross-cutting audit across the whole diff',
            status: 'in_progress',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: blightWorkItemId,
            role: 'blightwarden',
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
            role: 'blightwarden',
            text: 'Blightwarden: cross-cutting audit across the whole diff',
            status: 'in_progress',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: blightWorkItemId,
            role: 'blightwarden',
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

  describe('the gate is scoped to blightwarden only', () => {
    it('VALID: {codeweaver done, quest.baseRef set but no git repo at guild.path} => resolves normally, proving the blight checklist broker was never invoked', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'sb-blight-scope-cw' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });
      // A real-shaped sha with NO git repo on disk at guild.path: if the responder wrongly ran
      // the blight checklist broker for a non-blightwarden role, the underlying `git diff` would
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
