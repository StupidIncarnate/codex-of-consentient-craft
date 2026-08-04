import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  FileContentsStub,
  OperationItemIdStub,
  OperationItemStub,
  QuestBlightLedgerEntryStub,
  QuestStub,
  QuestWorkItemIdStub,
  RepoRelativePathStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { QuestHandleSignalBackResponder } from './quest-handle-signal-back-responder';
import { orchestrationEnvironmentHarness } from '../../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { orchestrationQuestHarness } from '../../../../test/harnesses/orchestration-quest/orchestration-quest.harness';

// blightwarden was converted from a whole-diff `pt N` fixpoint role into an OPERATOR with a
// server-computed completion gate: `done` recomputes the outstanding review-unit set from a REAL
// `git diff quest.baseRef...HEAD` (via questGetBlightChecklistBroker) crossed with the quest's
// blightLedger, and refuses the signal while any unit carries no disposition. These tests drive
// the real responder -> real broker chain against a real git repo + real disk (never mocked) to
// prove the gate's wiring, not just the transformer's logic (already unit-tested in
// blight-coverage-outstanding-transformer.test.ts and the responder's own unit test, which mock
// the checklist broker). One changed file crosses all 7 concerns (coverage, craft, security,
// dedup, perf, integrity, dead-code), so an empty ledger leaves 7 units outstanding.
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
        /signal-back refused: operationStatus 'done'.*7 still carry none.*packages\/orchestrator\/src\/foo\/foo-broker\.ts:coverage/su,
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

    it('VALID: {done, every one of the 7 units carries a disposition — mixing reviewed/fixed/gap/recorded} => the gate clears, operation + work item complete', async () => {
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
          itemId: `${impl}:coverage`,
          disposition: 'reviewed',
          evidence: 'every branch in fooBroker has a real test',
          observedBy: 'blightwarden',
          workItemId: blightWorkItemId,
          createdAt,
        }),
        QuestBlightLedgerEntryStub({
          itemId: `${impl}:craft`,
          disposition: 'fixed',
          evidence: 'error handling now carries the failing input',
          observedBy: 'blightwarden',
          workItemId: blightWorkItemId,
          createdAt,
        }),
        QuestBlightLedgerEntryStub({
          itemId: `${impl}:security`,
          disposition: 'reviewed',
          evidence: 'no untrusted input reaches a sink in fooBroker',
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
          itemId: `${impl}:perf`,
          disposition: 'reviewed',
          evidence: 'fooBroker does no loops or I/O',
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
        QuestBlightLedgerEntryStub({
          itemId: `${impl}:dead-code`,
          disposition: 'fixed',
          evidence: 'removed the unused export',
          observedBy: 'blightwarden',
          workItemId: blightWorkItemId,
          createdAt,
        }),
      ];

      await questHelper.seedInProgressRelay({
        questId,
        baseRef,
        planningNotes: { blightReports: [], qaLedger: [], blightLedger: ledger },
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
