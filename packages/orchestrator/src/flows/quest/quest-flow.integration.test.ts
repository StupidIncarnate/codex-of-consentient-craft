import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  AddQuestInputStub,
  BlockedReasonStub,
  CommentBatchEntryStub,
  FileContentsStub,
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
  FlowStub,
  GuildNameStub,
  GuildPathStub,
  OperationItemIdStub,
  OperationItemStub,
  QuestNoteStub,
  QuestWorkItemIdStub,
  RepoRelativePathStub,
  SignoffStub,
  WardRunIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { CommentBatchResponder } from '../../responders/comment/batch/comment-batch-responder';
import { GuildAddResponder } from '../../responders/guild/add/guild-add-responder';
import { QuestGetResponder } from '../../responders/quest/get/quest-get-responder';
import { slotManagerStatics } from '../../statics/slot-manager/slot-manager-statics';
import { QuestFlow } from './quest-flow';
import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { orchestrationQueueHarness } from '../../../test/harnesses/orchestration-queue/orchestration-queue.harness';
import { orchestrationQuestHarness } from '../../../test/harnesses/orchestration-quest/orchestration-quest.harness';

describe('QuestFlow', () => {
  const envHarness = orchestrationEnvironmentHarness();
  const queue = orchestrationQueueHarness();
  const questHelper = orchestrationQuestHarness();

  describe('delegation to responders', () => {
    it('VALID: {questId: nonexistent} => get delegates to QuestGetResponder and returns error', async () => {
      const result = await QuestFlow.get({ questId: 'nonexistent-quest' });

      expect(result.success).toBe(false);
    });
  });

  // getSummary reads a real quest.json off disk and recomputes coverage from the flow graph, so the
  // only way to prove the numbers survive a persist/reload round trip — and that provenance and
  // flow-type exclusions are applied to the PERSISTED shape rather than an in-memory stub — is to
  // drive it against a seeded quest file.
  describe('getSummary — verification state of a persisted quest', () => {
    it('VALID: {runtime flow with one signed terminal, one siegemaster-added observable, an operational flow and two notes} => coverage, drift, debt and note groups all come back off disk', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-get-summary' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const flowriderConfirmed = SignoffStub({
        evidence: 'packages/web/src/flows/login/login.e2e.ts:31 — red without the redirect',
      });
      const siegemasterUnconfirmable = SignoffStub({
        verdict: 'unconfirmable',
        evidence: 'the dev server refuses to bind port 3737 inside this sandbox',
        question: 'Which port should the sandbox dev server use?',
        at: '2026-01-02T00:00:00.000Z',
      });

      await questHelper.seedInProgressRelay({
        questId,
        operations: [],
        workItems: [],
        planningNotes: {
          blightReports: [],
          qaLedger: [],
          blightLedger: [],
          questNotes: [
            QuestNoteStub({ id: 'open-question-anchor-scope', kind: 'open-question' }),
            QuestNoteStub({ id: 'tooling-error-ward-oom', kind: 'tooling-error' }),
          ],
        },
        flows: [
          FlowStub({
            id: 'login-flow',
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                label: 'Login Page',
                observables: [
                  FlowObservableStub({
                    id: 'crash-on-bleh',
                    type: 'api-call',
                    description: 'POST /api/auth/login returns 400 for a non-JSON body',
                    addedBy: 'siegemaster',
                  }),
                ],
              }),
              FlowNodeStub({
                id: 'dashboard',
                label: 'Dashboard',
                flowriderSignoff: flowriderConfirmed,
                siegemasterSignoff: siegemasterUnconfirmable,
              }),
            ],
            edges: [
              FlowEdgeStub({
                id: 'e-success',
                from: 'login-page',
                to: 'dashboard',
                label: 'success',
              }),
            ],
          }),
          FlowStub({
            id: 'deploy-lint-rule',
            name: 'Deploy the lint rule',
            flowType: 'operational',
            entryPoint: 'register-rule',
            exitPoints: ['/done'],
            nodes: [FlowNodeStub({ id: 'register-rule', label: 'Register the rule' })],
            edges: [],
          }),
        ],
      });

      const summary = await QuestFlow.getSummary({ questId });

      testbed.cleanup();

      // login-flow: 1 terminal + 1 branch + 1 observable + 7 off-map = 10 siegemaster units, of
      // which the terminal is unconfirmable. The two authoring denominators shed the off-map
      // families AND the Siegemaster-added observable, leaving the terminal (confirmed) + the branch
      // (outstanding) each — this quest tags no `packagesAffected`, so no node's package kind
      // resolves and the flowrider/groundstomper split does not bind, exactly as both their
      // completion gates read it. deploy-lint-rule is operational, so it carries a siegemaster row
      // alone: 1 terminal + 7 off-map = 8.
      expect(summary).toStrictEqual({
        questId,
        flows: [
          {
            id: 'login-flow',
            name: 'Login Flow',
            flowType: 'runtime',
            tracks: [
              { id: 'flowrider', confirmed: 1, unconfirmable: 0, outstanding: 1 },
              { id: 'groundstomper', confirmed: 1, unconfirmable: 0, outstanding: 1 },
              { id: 'siegemaster', confirmed: 0, unconfirmable: 1, outstanding: 9 },
            ],
          },
          {
            id: 'deploy-lint-rule',
            name: 'Deploy the lint rule',
            flowType: 'operational',
            tracks: [{ id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 8 }],
          },
        ],
        midQuestObservables: [
          {
            id: 'login-flow:observable:crash-on-bleh',
            flowId: 'login-flow',
            nodeId: 'login-page',
            observableId: 'crash-on-bleh',
            addedBy: 'siegemaster',
            observableType: 'api-call',
            description: 'POST /api/auth/login returns 400 for a non-JSON body',
          },
        ],
        unconfirmable: [
          {
            id: 'login-flow:terminal:dashboard:siegemaster',
            unitId: 'login-flow:terminal:dashboard',
            flowId: 'login-flow',
            kind: 'terminal',
            track: 'siegemaster',
            signoff: siegemasterUnconfirmable,
          },
        ],
        noteGroups: [
          {
            id: 'open-question',
            notes: [QuestNoteStub({ id: 'open-question-anchor-scope', kind: 'open-question' })],
          },
          {
            id: 'tooling-error',
            notes: [QuestNoteStub({ id: 'tooling-error-ward-oom', kind: 'tooling-error' })],
          },
          { id: 'out-of-scope', notes: [] },
          { id: 'walk-reset', notes: [] },
        ],
      });
    }, 30_000);
  });

  // The operations relay: an agent session ends with signal-back complete carrying an
  // operationStatus. The real handle-signal-back responder → operations-update broker → advance
  // broker chain applies the outcome to the ledger and creates the next work item, all against the
  // real filesystem. These drive QuestFlow end-to-end (not mocked) — the seam the broker unit tests
  // mock.
  describe('operations relay — advance on done', () => {
    it('VALID: {codeweaver signals complete/done} => operation completes, advance creates the flowrider work item, and get-next-step dispatches it', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-relay-done' }),
      });
      envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const cwOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000c1' });
      const flowOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000f1' });
      const cwWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        operations: [
          OperationItemStub({
            id: cwOpId,
            role: 'codeweaver',
            text: 'build core',
            status: 'in_progress',
            locked: false,
          }),
          OperationItemStub({
            id: flowOpId,
            role: 'flowrider',
            text: 'verify flows',
            status: 'pending',
            locked: true,
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

      await QuestFlow.handleSignalBack({
        questId,
        workItemId: cwWorkItemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      const afterAdvance = await QuestGetResponder({ questId });
      const flowWorkItem = afterAdvance.quest!.workItems.find((wi) => wi.role === 'flowrider');
      const nextStep = await QuestFlow.getNextStep();

      testbed.cleanup();

      expect({
        questStatus: afterAdvance.quest!.status,
        operations: afterAdvance.quest!.operations.map((op) => ({
          role: op.role,
          status: op.status,
        })),
        cwWorkItemStatus: afterAdvance.quest!.workItems.find((wi) => wi.id === cwWorkItemId)
          ?.status,
        flowWorkItemStatus: flowWorkItem?.status,
        flowWorkItemLink: flowWorkItem?.relatedDataItems,
      }).toStrictEqual({
        questStatus: 'in_progress',
        operations: [
          { role: 'codeweaver', status: 'complete' },
          { role: 'flowrider', status: 'in_progress' },
        ],
        cwWorkItemStatus: 'complete',
        flowWorkItemStatus: 'pending',
        flowWorkItemLink: [`operations/${String(flowOpId)}`],
      });

      expect(nextStep).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'flowrider',
            workItemId: flowWorkItem!.id,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "flowrider",\n  workItemId: "${String(flowWorkItem!.id)}",\n  questId: "${String(questId)}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${String(questId)}",\n  workItemId: "${String(flowWorkItem!.id)}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial" | "blocked"\n}).`,
          },
        ],
      });
    }, 30_000);
  });

  describe('operations relay — duplicate-on-partial', () => {
    it('VALID: {codeweaver signals complete/partial} => operation completes, a pt continuation is appended, and a fresh codeweaver work item runs it', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-relay-partial' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const cwOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000c2' });
      const flowOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000f2' });
      const cwWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        operations: [
          OperationItemStub({
            id: cwOpId,
            role: 'codeweaver',
            text: 'build core',
            status: 'in_progress',
            locked: false,
          }),
          OperationItemStub({
            id: flowOpId,
            role: 'flowrider',
            text: 'verify flows',
            status: 'pending',
            locked: true,
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

      await QuestFlow.handleSignalBack({
        questId,
        workItemId: cwWorkItemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      const afterPartial = await QuestGetResponder({ questId });
      const ptOp = afterPartial.quest!.operations.find((op) => String(op.text).startsWith('pt 2:'));
      const freshWorkItem = afterPartial.quest!.workItems.find((wi) => wi.id !== cwWorkItemId);

      testbed.cleanup();

      expect({
        questStatus: afterPartial.quest!.status,
        operations: afterPartial.quest!.operations.map((op) => ({
          role: op.role,
          status: op.status,
          text: String(op.text),
        })),
        codeweaverWorkItemCount: afterPartial.quest!.workItems.filter(
          (wi) => wi.role === 'codeweaver',
        ).length,
        freshWorkItemStatus: freshWorkItem?.status,
        freshWorkItemLink: freshWorkItem?.relatedDataItems,
      }).toStrictEqual({
        questStatus: 'in_progress',
        operations: [
          { role: 'codeweaver', status: 'complete', text: 'build core' },
          { role: 'codeweaver', status: 'in_progress', text: 'pt 2: build core' },
          { role: 'flowrider', status: 'pending', text: 'verify flows' },
        ],
        codeweaverWorkItemCount: 2,
        freshWorkItemStatus: 'pending',
        freshWorkItemLink: [`operations/${String(ptOp!.id)}`],
      });
    }, 30_000);
  });

  describe('operations relay — blocked halts on the environment wall', () => {
    it('VALID: {pesteater signals complete/blocked} => work item failed with the reason, pt continuation queued for a resume, downstream skipped, quest blocked', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-relay-blocked' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const pestOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000b1' });
      const wardOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000b2' });
      const pestWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const wardWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        operations: [
          OperationItemStub({
            id: pestOpId,
            role: 'pesteater',
            text: 'hunt the bug',
            status: 'in_progress',
            locked: true,
          }),
          OperationItemStub({
            id: wardOpId,
            role: 'ward',
            text: 'ward (changed)',
            status: 'pending',
            locked: true,
            wardMode: 'changed',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: pestWorkItemId,
            role: 'pesteater',
            status: 'in_progress',
            spawnerType: 'agent',
            relatedDataItems: [`operations/${String(pestOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
          WorkItemStub({
            id: wardWorkItemId,
            role: 'ward',
            status: 'pending',
            spawnerType: 'command',
            relatedDataItems: [`operations/${String(wardOpId)}`],
            dependsOn: [pestWorkItemId],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      await QuestFlow.handleSignalBack({
        questId,
        workItemId: pestWorkItemId,
        signal: 'complete',
        operationItemId: pestOpId,
        operationStatus: 'blocked',
        blockedReason: BlockedReasonStub({
          value: 'git commit is denied in this dispatched session',
        }),
      });

      const afterBlocked = await QuestGetResponder({ questId });
      const pestWorkItem = afterBlocked.quest!.workItems.find((wi) => wi.id === pestWorkItemId);
      const ptOp = afterBlocked.quest!.operations.find((op) => String(op.text).startsWith('pt 2:'));

      testbed.cleanup();

      expect({
        questStatus: afterBlocked.quest!.status,
        operations: afterBlocked.quest!.operations.map((op) => ({
          role: op.role,
          status: op.status,
          text: String(op.text),
        })),
        signalledWorkItem: {
          status: pestWorkItem?.status,
          errorMessage: String(pestWorkItem?.errorMessage),
        },
        downstreamWardStatus: afterBlocked.quest!.workItems.find((wi) => wi.id === wardWorkItemId)
          ?.status,
        // The continuation has NO work item: a resume's advance mints one and re-dispatches
        // this same scope. Advance must not have run here.
        continuationHasWorkItem: afterBlocked.quest!.workItems.some((wi) =>
          wi.relatedDataItems.some((ref) => String(ref) === `operations/${String(ptOp!.id)}`),
        ),
      }).toStrictEqual({
        questStatus: 'blocked',
        operations: [
          { role: 'pesteater', status: 'complete', text: 'hunt the bug' },
          { role: 'pesteater', status: 'pending', text: 'pt 2: hunt the bug' },
          { role: 'ward', status: 'pending', text: 'ward (changed)' },
        ],
        signalledWorkItem: {
          status: 'failed',
          errorMessage: 'git commit is denied in this dispatched session',
        },
        downstreamWardStatus: 'skipped',
        continuationHasWorkItem: false,
      });
    }, 30_000);
  });

  // blightwarden was converted from a whole-diff `pt N` fixpoint role into an OPERATOR with a
  // server-computed completion gate (`quest-handle-signal-back-responder.ts`). The gate itself —
  // refusing/admitting `done` against a real `git diff` — is proven end-to-end in
  // `quest-handle-signal-back-responder.integration.test.ts`, colocated with the responder it
  // gates. These three describes prove the surrounding RELAY behaviour QuestFlow owns: `partial`
  // bypassing the gate entirely, the pt-chain budget blocking the quest instead of looping
  // forever, and `done` advancing to the fixed ward tail rather than back to blightwarden.
  describe('operations relay — blightwarden operator: partial bypasses the completion gate', () => {
    it('VALID: {blightwarden signals complete/partial with real outstanding units} => no throw, operation completes, and a pt N continuation carries the same role + locked flag', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-blight-partial' }),
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

      const baseText = 'Blightwarden: cross-cutting audit across the whole diff';
      const blightOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000e1' });
      const blightWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      // Empty blightLedger => every one of the 7 units on this one changed file is outstanding.
      // If the gate wrongly bound `partial` too (not just `done`), this signal would throw
      // instead of completing — the outstanding units are what makes this proof airtight.
      await questHelper.seedInProgressRelay({
        questId,
        baseRef,
        operations: [
          OperationItemStub({
            id: blightOpId,
            role: 'blightwarden',
            text: baseText,
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

      await QuestFlow.handleSignalBack({
        questId,
        workItemId: blightWorkItemId,
        operationItemId: blightOpId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      const afterPartial = await questHelper.reload({ questId });
      const freshWorkItem = afterPartial.workItems.find((wi) => wi.id !== blightWorkItemId);

      testbed.cleanup();

      expect({
        operations: afterPartial.operations.map((op) => ({
          role: op.role,
          status: op.status,
          locked: op.locked,
          text: String(op.text),
        })),
        freshWorkItemStatus: freshWorkItem?.status,
      }).toStrictEqual({
        operations: [
          { role: 'blightwarden', status: 'complete', locked: true, text: baseText },
          { role: 'blightwarden', status: 'in_progress', locked: true, text: `pt 2: ${baseText}` },
        ],
        freshWorkItemStatus: 'pending',
      });
      expect(freshWorkItem?.relatedDataItems).toStrictEqual([
        `operations/${String(afterPartial.operations[1]!.id)}`,
      ]);
    }, 30_000);
  });

  describe('operations relay — blightwarden operator: pt budget exhaustion blocks the quest', () => {
    it('VALID: {blightwarden partial at chainLength === slotManagerStatics.blightwarden.maxAttempts} => operation completes, NO further pt continuation is appended, and the quest blocks', async () => {
      // Read the real budget rather than assuming it — the chain built below must match it
      // exactly (maxAttempts - 1 prior complete passes + the live session at the edge) for the
      // block branch to fire instead of another continuation.
      expect(slotManagerStatics.blightwarden.maxAttempts).toBe(3);

      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-blight-budget' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const baseText = 'Blightwarden: cross-cutting audit across the whole diff';
      const op1Id = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000e2' });
      const op2Id = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000e3' });
      const op3Id = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000e4' });
      const wardOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000e9' });
      const op3WorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      // Mirrors the real relay tail (blightwarden is always followed by ward(full)): a still-
      // `pending` operation after the exhausted chain is what keeps
      // workItemsToQuestStatusTransformer from deriving `complete` on the interim persist (a
      // drained ledger + a lone terminal work item) before questBlockOnFailureBroker gets a
      // chance to set `blocked` — `complete -> blocked` is not a valid status transition.
      await questHelper.seedInProgressRelay({
        questId,
        operations: [
          OperationItemStub({
            id: op1Id,
            role: 'blightwarden',
            text: baseText,
            status: 'complete',
            locked: true,
          }),
          OperationItemStub({
            id: op2Id,
            role: 'blightwarden',
            text: `pt 2: ${baseText}`,
            status: 'complete',
            locked: true,
          }),
          OperationItemStub({
            id: op3Id,
            role: 'blightwarden',
            text: `pt 3: ${baseText}`,
            status: 'in_progress',
            locked: true,
          }),
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
            id: op3WorkItemId,
            role: 'blightwarden',
            status: 'in_progress',
            spawnerType: 'agent',
            relatedDataItems: [`operations/${String(op3Id)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      await QuestFlow.handleSignalBack({
        questId,
        workItemId: op3WorkItemId,
        operationItemId: op3Id,
        signal: 'complete',
        operationStatus: 'partial',
      });

      const afterBudget = await questHelper.reload({ questId });
      const op3WorkItem = afterBudget.workItems.find((wi) => wi.id === op3WorkItemId);

      testbed.cleanup();

      expect({
        questStatus: afterBudget.status,
        operations: afterBudget.operations.map((op) => ({
          role: op.role,
          status: op.status,
          text: String(op.text),
        })),
        op3WorkItemStatus: op3WorkItem?.status,
        workItemCount: afterBudget.workItems.length,
      }).toStrictEqual({
        questStatus: 'blocked',
        operations: [
          { role: 'blightwarden', status: 'complete', text: baseText },
          { role: 'blightwarden', status: 'complete', text: `pt 2: ${baseText}` },
          { role: 'blightwarden', status: 'complete', text: `pt 3: ${baseText}` },
          { role: 'ward', status: 'pending', text: 'Ward gate (full monorepo)' },
        ],
        op3WorkItemStatus: 'complete',
        // Advance never runs on this path — a fresh blightwarden pass would hit the same spent
        // budget, so no work item is minted for the still-pending ward tail item either.
        workItemCount: 1,
      });
    }, 30_000);
  });

  describe('operations relay — blightwarden operator: done advances to the fixed ward tail', () => {
    it('VALID: {blightwarden signals complete/done} => operation completes, advance creates the ward(full) work item, and get-next-step dispatches run-ward — never another blightwarden pass', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-blight-relay' }),
      });
      envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const blightOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000e5' });
      const wardOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000e6' });
      const blightWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      // No baseRef pinned: the completion gate itself is proven separately (this describe's
      // sibling responder-level integration tests) — this test's only concern is relay ordering
      // after a clean `done`.
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

      await QuestFlow.handleSignalBack({
        questId,
        workItemId: blightWorkItemId,
        operationItemId: blightOpId,
        signal: 'complete',
        operationStatus: 'done',
      });

      const afterDone = await questHelper.reload({ questId });
      const wardWorkItem = afterDone.workItems.find((wi) => wi.role === 'ward');
      const nextStep = await QuestFlow.getNextStep();

      testbed.cleanup();

      expect({
        operations: afterDone.operations.map((op) => ({ role: op.role, status: op.status })),
        blightWorkItemStatus: afterDone.workItems.find((wi) => wi.id === blightWorkItemId)?.status,
        wardWorkItemStatus: wardWorkItem?.status,
        wardWorkItemLink: wardWorkItem?.relatedDataItems,
      }).toStrictEqual({
        operations: [
          { role: 'blightwarden', status: 'complete' },
          { role: 'ward', status: 'in_progress' },
        ],
        blightWorkItemStatus: 'complete',
        wardWorkItemStatus: 'pending',
        wardWorkItemLink: [`operations/${String(wardOpId)}`],
      });
      expect(nextStep).toStrictEqual({
        type: 'run-ward',
        questId,
        workItemId: wardWorkItem!.id,
        mode: 'full',
      });
    }, 30_000);
  });

  // The walk-reset lever. It is a read-modify-write OUTSIDE questModifyBroker, so the only way to
  // prove it takes the lock and persists (rather than mutating an in-memory copy nobody re-reads)
  // is to drive it against a real quest.json and reload from disk.
  describe('reset-flow-signoffs — Siegemaster clears its own track on ONE flow', () => {
    it('VALID: {siegemaster item declaring the flow} => the reloaded quest has no siegemasterSignoff on that flow, keeps every flowriderSignoff, leaves a second flow untouched, and carries a walk-reset note', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-walk-reset' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const siegeOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000d1' });
      const siegeWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      const flowriderSignoff = SignoffStub({
        evidence: 'packages/web/src/flows/login/login.e2e.ts:31 — red without the redirect',
      });
      const siegemasterSignoff = SignoffStub({
        evidence: 'walked it against the dev server — landed on /dashboard',
        workItemId: siegeWorkItemId,
        at: '2026-01-02T00:00:00.000Z',
      });

      await questHelper.seedInProgressRelay({
        questId,
        flows: [
          FlowStub({
            id: 'login-flow',
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                label: 'Login Page',
                flowriderSignoff,
                siegemasterSignoff,
                observables: [
                  FlowObservableStub({
                    id: 'login-redirects-to-dashboard',
                    flowriderSignoff,
                    siegemasterSignoff,
                  }),
                ],
              }),
            ],
            edges: [],
            offMapSignoffs: [
              FlowOffMapSignoffStub({ id: 'concurrency', flowriderSignoff, siegemasterSignoff }),
            ],
          }),
          FlowStub({
            id: 'signup-flow',
            name: 'Signup Flow',
            entryPoint: '/signup',
            exitPoints: ['/welcome'],
            nodes: [
              FlowNodeStub({
                id: 'signup-page',
                label: 'Signup Page',
                flowriderSignoff,
                siegemasterSignoff,
              }),
            ],
            edges: [],
          }),
        ],
        operations: [
          OperationItemStub({
            id: siegeOpId,
            role: 'siegemaster',
            text: 'Siegemaster: manual QA — flow: login-flow',
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

      const result = await QuestFlow.resetFlowSignoffs({
        questId,
        workItemId: siegeWorkItemId,
        flowId: 'login-flow',
        reason: 'Fixed the redirect guard the walk exposed, so every sign-off here is stale.',
      });

      const afterReset = await questHelper.reload({ questId });
      const loginFlow = afterReset.flows.find((flow) => String(flow.id) === 'login-flow')!;
      const signupFlow = afterReset.flows.find((flow) => String(flow.id) === 'signup-flow')!;
      const loginNode = loginFlow.nodes[0]!;

      testbed.cleanup();

      expect(result.success).toBe(true);
      expect({
        loginNodeSiegemaster: loginNode.siegemasterSignoff,
        loginNodeFlowrider: loginNode.flowriderSignoff,
        loginObservableSiegemaster: loginNode.observables[0]!.siegemasterSignoff,
        loginObservableFlowrider: loginNode.observables[0]!.flowriderSignoff,
        loginOffMapSiegemaster: loginFlow.offMapSignoffs[0]!.siegemasterSignoff,
        loginOffMapFlowrider: loginFlow.offMapSignoffs[0]!.flowriderSignoff,
        signupNodeSiegemaster: signupFlow.nodes[0]!.siegemasterSignoff,
        signupNodeFlowrider: signupFlow.nodes[0]!.flowriderSignoff,
        notes: afterReset.planningNotes.questNotes.map((note) => ({
          id: String(note.id),
          kind: note.kind,
          flowId: String(note.flowId),
          detail: String(note.detail),
        })),
      }).toStrictEqual({
        loginNodeSiegemaster: undefined,
        loginNodeFlowrider: flowriderSignoff,
        loginObservableSiegemaster: undefined,
        loginObservableFlowrider: flowriderSignoff,
        loginOffMapSiegemaster: undefined,
        loginOffMapFlowrider: flowriderSignoff,
        signupNodeSiegemaster: siegemasterSignoff,
        signupNodeFlowrider: flowriderSignoff,
        notes: [
          {
            id: 'walk-reset-login-flow-1',
            kind: 'walk-reset',
            flowId: 'login-flow',
            detail: 'Fixed the redirect guard the walk exposed, so every sign-off here is stale.',
          },
        ],
      });
    }, 30_000);

    it('INVALID: {flow the operation item does not declare} => refused, and the quest file is byte-identical afterwards', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-walk-reset-scope' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const siegeOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000d2' });
      const siegeWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const siegemasterSignoff = SignoffStub({
        evidence: 'walked the signup path by hand',
        workItemId: siegeWorkItemId,
        at: '2026-01-02T00:00:00.000Z',
      });

      await questHelper.seedInProgressRelay({
        questId,
        flows: [
          FlowStub({
            id: 'signup-flow',
            name: 'Signup Flow',
            entryPoint: '/signup',
            exitPoints: ['/welcome'],
            nodes: [FlowNodeStub({ id: 'signup-page', label: 'Signup Page', siegemasterSignoff })],
            edges: [],
          }),
        ],
        operations: [
          OperationItemStub({
            id: siegeOpId,
            role: 'siegemaster',
            text: 'Siegemaster: manual QA — flow: login-flow',
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

      const before = await questHelper.readQuestFileRaw({ questId });

      const result = await QuestFlow.resetFlowSignoffs({
        questId,
        workItemId: siegeWorkItemId,
        flowId: 'signup-flow',
        reason: 'Trying to reset a flow this session does not own.',
      });

      const after = await questHelper.readQuestFileRaw({ questId });

      testbed.cleanup();

      expect(result).toStrictEqual({
        success: false,
        error: `reset-flow-signoffs: flow signup-flow is outside the scope of work item ${String(siegeWorkItemId)}, whose operation item ${String(siegeOpId)} covers login-flow — nothing was reset`,
      });
      expect(String(after)).toBe(String(before));
    }, 30_000);
  });

  describe('ward operation item — green advances the relay', () => {
    it('VALID: {ward exits 0} => ward operation item completes and advance dispatches the next verify role', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-ward-green' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const wardOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000a1' });
      const flowOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000a2' });
      const wardWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        operations: [
          OperationItemStub({
            id: wardOpId,
            role: 'ward',
            text: 'ward (changed)',
            status: 'in_progress',
            locked: true,
            wardMode: 'changed',
          }),
          OperationItemStub({
            id: flowOpId,
            role: 'flowrider',
            text: 'verify flows',
            status: 'pending',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: wardWorkItemId,
            role: 'ward',
            status: 'in_progress',
            spawnerType: 'command',
            wardMode: 'changed',
            relatedDataItems: [`operations/${String(wardOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      queue.enqueue({
        queueDir: env.wardQueueDir,
        response: {
          exitCode: 0,
          runId: WardRunIdStub({ value: `1739625600000-a1f${String(Date.now() % 100000)}` }),
          wardResultJson: { checks: [] },
        },
      });

      const wardRun = await QuestFlow.runWard({
        questId,
        workItemId: wardWorkItemId,
        mode: 'changed',
      });

      const afterWard = await QuestGetResponder({ questId });
      const flowWorkItem = afterWard.quest!.workItems.find((wi) => wi.role === 'flowrider');

      testbed.cleanup();

      expect({
        exitCode: wardRun.exitCode,
        questStatus: afterWard.quest!.status,
        operations: afterWard.quest!.operations.map((op) => ({ role: op.role, status: op.status })),
        wardWorkItemStatus: afterWard.quest!.workItems.find((wi) => wi.id === wardWorkItemId)
          ?.status,
        flowWorkItemStatus: flowWorkItem?.status,
        flowWorkItemLink: flowWorkItem?.relatedDataItems,
      }).toStrictEqual({
        exitCode: 0,
        questStatus: 'in_progress',
        operations: [
          { role: 'ward', status: 'complete' },
          { role: 'flowrider', status: 'in_progress' },
        ],
        wardWorkItemStatus: 'complete',
        flowWorkItemStatus: 'pending',
        flowWorkItemLink: [`operations/${String(flowOpId)}`],
      });
    }, 30_000);
  });

  describe('ward operation item — red inserts a spiritmender then a fresh ward', () => {
    it('VALID: {ward exits 1} => ward completes, a spiritmender + fresh ward are appended, and advance dispatches the spiritmender (never another ward)', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-ward-red' }),
      });
      const env = envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const wardOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000b1' });
      const flowOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000b2' });
      const wardWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        operations: [
          OperationItemStub({
            id: wardOpId,
            role: 'ward',
            text: 'ward (changed)',
            status: 'in_progress',
            locked: true,
            wardMode: 'changed',
          }),
          OperationItemStub({
            id: flowOpId,
            role: 'flowrider',
            text: 'verify flows',
            status: 'pending',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: wardWorkItemId,
            role: 'ward',
            status: 'in_progress',
            spawnerType: 'command',
            wardMode: 'changed',
            relatedDataItems: [`operations/${String(wardOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      queue.enqueue({
        queueDir: env.wardQueueDir,
        response: {
          exitCode: 1,
          runId: WardRunIdStub({ value: `1739625600000-b1f${String(Date.now() % 100000)}` }),
          wardResultJson: {
            checks: [
              {
                projectResults: [
                  {
                    errors: [
                      {
                        filePath: '/repo/src/brokers/auth/login/auth-login-broker.ts',
                        message: 'Property loginUser does not exist on type AuthService',
                        line: 42,
                        column: 7,
                        rule: 'no-undef-property',
                      },
                    ],
                    testFailures: [],
                  },
                ],
              },
            ],
          },
        },
      });

      const wardRun = await QuestFlow.runWard({
        questId,
        workItemId: wardWorkItemId,
        mode: 'changed',
      });

      const afterRed = await QuestGetResponder({ questId });
      const spiritOp = afterRed.quest!.operations.find((op) => op.role === 'spiritmender');
      const spiritWorkItem = afterRed.quest!.workItems.find((wi) => wi.role === 'spiritmender');

      testbed.cleanup();

      expect({
        exitCode: wardRun.exitCode,
        questStatus: afterRed.quest!.status,
        operations: afterRed.quest!.operations.map((op) => ({
          role: op.role,
          status: op.status,
        })),
        freshWardMode: afterRed
          .quest!.operations.filter((op) => op.role === 'ward')
          .find((op) => op.id !== wardOpId)?.wardMode,
        wardWorkItemStatus: afterRed.quest!.workItems.find((wi) => wi.id === wardWorkItemId)
          ?.status,
        spiritWorkItemStatus: spiritWorkItem?.status,
        spiritWorkItemLink: spiritWorkItem?.relatedDataItems,
      }).toStrictEqual({
        exitCode: 1,
        questStatus: 'in_progress',
        operations: [
          { role: 'ward', status: 'complete' },
          { role: 'spiritmender', status: 'in_progress' },
          { role: 'ward', status: 'pending' },
          { role: 'flowrider', status: 'pending' },
        ],
        freshWardMode: 'changed',
        wardWorkItemStatus: 'failed',
        spiritWorkItemStatus: 'pending',
        spiritWorkItemLink: [`operations/${String(spiritOp!.id)}`],
      });
    }, 30_000);
  });

  // Flow: orphan-comment-cleanup, node quest-modify-request, observable
  // check-http-comments-write-allowed. CommentBatchResponder is the comment-batch route's own
  // server-side persist path — it calls questModifyBroker directly, with none of the MCP
  // responder's comments strip (that strip lives ONLY at the MCP tool boundary, in
  // packages/mcp/src/responders/quest/handle/quest-handle-responder.ts). Driving it here against a
  // real quest on real disk proves the strip is scoped to the MCP agent payload, not to the
  // `comments` field itself — mcp-server-flow.integration.test.ts proves the opposite half: the
  // SAME field, arriving via modify-quest, is silently dropped for an agent caller.
  describe('comment integrity — the comment-batch route writes comments the MCP agent path blocks', () => {
    it('VALID: {CommentBatchResponder persists one comment} => the real persisted quest.comments carries it on the very next read', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-comment-batch-write' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const entry = CommentBatchEntryStub({
        flowId: 'login-flow' as never,
        nodeId: 'start' as never,
        text: 'Left on the box by a real user, through the batch route' as never,
      });

      const batchResult = await CommentBatchResponder({ questId, comments: [entry] });
      const afterBatch = await QuestGetResponder({ questId });

      testbed.cleanup();

      expect({
        flowId: batchResult.comments[0]!.flowId,
        nodeId: batchResult.comments[0]!.nodeId,
        text: batchResult.comments[0]!.text,
      }).toStrictEqual({ flowId: entry.flowId, nodeId: entry.nodeId, text: entry.text });
      expect(afterBatch.quest!.comments).toStrictEqual(batchResult.comments);
    }, 30_000);
  });

  // Flow: Auto-create guild on create-quest. Entry point mcp__dungeonmaster__create-quest,
  // surfaced in-process as QuestFlow.mcpCreate. These drive the WHOLE real seam end-to-end —
  // processCwdAdapter → cwdResolveBroker → guildListBroker → guildCoversRepoRootGuard →
  // guildAddBroker → questUserAddBroker against a real DUNGEONMASTER_HOME + real cwd. The
  // broker/responder/guard unit tests mock every one of those, so this is the only place the
  // glue between create-quest and the guild brokers is proven against the real filesystem.
  describe('auto-create guild on create-quest', () => {
    const { userRequest } = AddQuestInputStub();

    it('VALID: {no covering guild registered} => auto-creates a guild at the repo root, creates its quests dir, persists the quest, and returns { questId, guildSlug }', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-mcp-autocreate' }),
      });
      // tempDir doubles as DUNGEONMASTER_HOME AND the repo root the cwd resolves to:
      // the guild gets path === repo root === testbed dir.
      const repoRoot = GuildPathStub({ value: testbed.guildPath });
      envHarness.setupHome({ tempDir: repoRoot });
      envHarness.writeRepoRootMarker({ repoRoot });
      const cwd = envHarness.chdirInto({ dir: repoRoot });

      const result = await QuestFlow.mcpCreate({ userRequest });

      const guildsAfter = envHarness.readConfigGuilds({ tempDir: repoRoot });
      const created = guildsAfter[0]!;
      const questsDirExists = envHarness.questsDirExists({
        tempDir: repoRoot,
        guildId: created.guildId,
      });
      const questFile = envHarness.questFilePersisted({
        tempDir: repoRoot,
        guildId: created.guildId,
        questId: result.questId,
      });

      cwd.restore();
      testbed.cleanup();

      // check-guild-appended + check-new-guild-slug-returned: exactly one guild (the complete
      // array is [created]), anchored at the repo root, and the returned slug is its urlSlug.
      expect(guildsAfter).toStrictEqual([
        {
          name: created.name,
          path: created.path,
          guildId: created.guildId,
          urlSlug: created.urlSlug,
        },
      ]);
      expect(created.path).toBe(String(repoRoot));
      expect(result.guildSlug).toBe(created.urlSlug);
      // check-quests-dir-created + check-quest-persisted.
      expect(questsDirExists).toBe(true);
      expect(questFile).toStrictEqual({ exists: true, questIdInFile: true });
    }, 30_000);

    it('VALID: {a guild already covers the repo root} => reuses it, appends no new guild, returns the existing guild slug', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-mcp-reuse' }),
      });
      const repoRoot = GuildPathStub({ value: testbed.guildPath });
      envHarness.setupHome({ tempDir: repoRoot });
      envHarness.writeRepoRootMarker({ repoRoot });

      // Pre-register a guild whose path equals the repo root.
      const existing = await GuildAddResponder({
        name: GuildNameStub({ value: 'Existing Covering Guild' }),
        path: repoRoot,
      });

      const cwd = envHarness.chdirInto({ dir: repoRoot });

      const result = await QuestFlow.mcpCreate({ userRequest });

      const guildsAfter = envHarness.readConfigGuilds({ tempDir: repoRoot });
      const questFile = envHarness.questFilePersisted({
        tempDir: repoRoot,
        guildId: existing.id,
        questId: result.questId,
      });

      cwd.restore();
      testbed.cleanup();

      // check-no-duplicate-when-covered: the complete guilds array is still just the
      // pre-registered guild — no new entry was appended.
      expect(guildsAfter).toStrictEqual([
        {
          name: existing.name,
          path: existing.path,
          guildId: existing.id,
          urlSlug: existing.urlSlug,
        },
      ]);
      // check-existing-guild-slug-returned: the returned slug is the existing guild's urlSlug,
      // and the quest persisted under the EXISTING guild (reuse, not a fresh guild).
      expect(result.guildSlug).toBe(existing.urlSlug);
      expect(questFile).toStrictEqual({ exists: true, questIdInFile: true });
    }, 30_000);

    it('VALID: {cwd is a subfolder of an already-registered guild} => reuses the ancestor guild (matches repo root, not the literal subfolder cwd)', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-mcp-subfolder' }),
      });
      const repoRoot = GuildPathStub({ value: testbed.guildPath });
      envHarness.setupHome({ tempDir: repoRoot });
      // .dungeonmaster.json lives ONLY at the repo root, so cwdResolveBroker walking up from the
      // subfolder resolves to the repo root.
      envHarness.writeRepoRootMarker({ repoRoot });

      const ancestor = await GuildAddResponder({
        name: GuildNameStub({ value: 'Ancestor Guild' }),
        path: repoRoot,
      });

      // Create a nested subfolder under the repo root and run create-quest from there.
      const subfolder = GuildPathStub({ value: `${String(repoRoot)}/packages/some-pkg/src` });
      const cwd = envHarness.makeAndChdir({ dir: subfolder });

      const result = await QuestFlow.mcpCreate({ userRequest });

      const guildsAfter = envHarness.readConfigGuilds({ tempDir: repoRoot });
      const questFile = envHarness.questFilePersisted({
        tempDir: repoRoot,
        guildId: ancestor.id,
        questId: result.questId,
      });

      cwd.restore();
      testbed.cleanup();

      // The ancestor guild covers the resolved repo root: the complete guilds array is just the
      // ancestor — no duplicate — and the slug + quest belong to it.
      expect(guildsAfter).toStrictEqual([
        {
          name: ancestor.name,
          path: ancestor.path,
          guildId: ancestor.id,
          urlSlug: ancestor.urlSlug,
        },
      ]);
      expect(result.guildSlug).toBe(ancestor.urlSlug);
      expect(questFile).toStrictEqual({ exists: true, questIdInFile: true });
    }, 30_000);

    it('EDGE: {no .dungeonmaster.json anywhere up the tree AND no covering guild} => cwdResolveBroker rejects, broker falls back to literal cwd, auto-creates a guild there, and still returns { questId, guildSlug }', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-mcp-fallback' }),
      });
      const repoRoot = GuildPathStub({ value: testbed.guildPath });
      // setupHome writes config.json but NO .dungeonmaster.json — and /tmp has none up the tree,
      // so cwdResolveBroker walks to filesystem root and throws ProjectRootNotFoundError, exercising
      // the literal-cwd fallback against the real resolver (not a mocked rejection).
      envHarness.setupHome({ tempDir: repoRoot });
      const cwd = envHarness.chdirInto({ dir: repoRoot });

      const result = await QuestFlow.mcpCreate({ userRequest });

      const guildsAfter = envHarness.readConfigGuilds({ tempDir: repoRoot });
      const created = guildsAfter[0]!;
      const questsDirExists = envHarness.questsDirExists({
        tempDir: repoRoot,
        guildId: created.guildId,
      });
      const questFile = envHarness.questFilePersisted({
        tempDir: repoRoot,
        guildId: created.guildId,
        questId: result.questId,
      });

      cwd.restore();
      testbed.cleanup();

      // check-fallback-autocreate-at-cwd: exactly one guild (complete array is [created]) was
      // auto-created with path === literal cwd.
      expect(guildsAfter).toStrictEqual([
        {
          name: created.name,
          path: created.path,
          guildId: created.guildId,
          urlSlug: created.urlSlug,
        },
      ]);
      expect(created.path).toBe(String(repoRoot));
      expect(result.guildSlug).toBe(created.urlSlug);
      expect(questsDirExists).toBe(true);
      expect(questFile).toStrictEqual({ exists: true, questIdInFile: true });
    }, 30_000);
  });
});
