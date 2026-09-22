/**
 * PURPOSE: Behavioural integration coverage of `agentFlowStatics.codeweaver`'s remaining step-graph
 * routes — `work`, `review`, `commit` and `ward`→`repair` — driving `questRouteScopeBroker` directly
 * against a real testbed quest on disk. `plan`'s `done` route and one flavor of `ward` already have
 * coverage (`quest-flow.integration.test.ts`); see the NOTE 1 block below for why that `ward` coverage
 * does not prove what this file's `ward` tests prove.
 *
 * USAGE:
 * npm run ward -- --only lint,typecheck,integration -- packages/orchestrator/src/brokers/quest/route-scope/quest-route-scope-broker.integration.test.ts
 */

import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemIdStub,
  OperationItemStub,
  QuestPackageEntryStub,
  QuestWorkItemIdStub,
  UnitObservationStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { WorkPlanBatchStub } from '../../../contracts/work-plan-batch/work-plan-batch.stub';
import { WorkPlanPieceStub } from '../../../contracts/work-plan-piece/work-plan-piece.stub';
import { WorkPlanStub } from '../../../contracts/work-plan/work-plan.stub';
import { plannedWorkWriteBroker } from '../../planned-work/write/planned-work-write-broker';
import { orchestrationQuestHarness } from '../../../../test/harnesses/orchestration-quest/orchestration-quest.harness';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questRouteScopeBroker } from './quest-route-scope-broker';

const WEB_PACKAGE = QuestPackageEntryStub({
  name: 'web',
  location: './packages/web',
  changeType: 'edit',
  packageType: 'frontend-react',
});

// One node, no outgoing edges — which per `qaUnitEnumerateTransformer` makes that node a TERMINAL
// unit as well as the observable it carries. `codeweaver.review`'s declared step-scope
// (`stepScopeStatics.byFamilyStep.codeweaver.review`) measures both kinds, so a reviewer minted on
// this flow is handed BOTH, not only the observable — see the `work (done)` test below.
const SEND_FLOW = FlowStub({
  id: 'send-flow',
  name: 'Send',
  flowType: 'runtime',
  nodes: [
    FlowNodeStub({
      id: 'composer',
      label: 'Composer',
      packages: ['web'],
      observables: [FlowObservableStub({ id: 'check-badge-count-text' })],
    }),
  ],
  edges: [],
});

const UNIT_OBSERVABLE = 'send-flow:observable:check-badge-count-text';
const UNIT_TERMINAL = 'send-flow:terminal:composer';

const codeweaverScope = ({ opId }: { opId: string }) =>
  OperationItemStub({
    id: OperationItemIdStub({ value: opId }),
    role: 'codeweaver',
    text: 'Codeweaver: build this slice — package: web · flow: send-flow',
    status: 'in_progress',
    locked: false,
    flowIds: ['send-flow'],
    packageNames: ['web'],
  });

describe('questRouteScopeBroker — codeweaver step chain (integration — real disk)', () => {
  const quest = orchestrationQuestHarness();

  describe('work — unmet mints a fresh work item, grouped by the originating piece', () => {
    it('VALID: {a `work` item drains with its one unit unmet, claimed by a plan piece} => mints a fresh `work` item carrying exactly that unit — grouped THROUGH the piece (`mintedBy`), never onto a `pieceId` field of its own', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-cw-work-unmet' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const workItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [codeweaverScope({ opId })],
        workItems: [
          WorkItemStub({
            id: workItemId,
            role: 'codeweaver',
            status: 'complete',
            step: 'work',
            pieceId: 'pc-badge',
            assignedUnitIds: [UNIT_OBSERVABLE],
            observations: [
              UnitObservationStub({
                unitId: UNIT_OBSERVABLE,
                mark: 'unmet',
                evidence: 'the badge still counts queued comments, not persisted ones',
              }),
            ],
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const { questPath } = await questFindQuestPathBroker({ questId });
      await plannedWorkWriteBroker({
        questFolderPath: questPath,
        operationItemId: OperationItemIdStub({ value: opId }),
        plan: WorkPlanStub({
          operationItemId: OperationItemIdStub({ value: opId }),
          batches: [
            WorkPlanBatchStub({
              pieces: [
                WorkPlanPieceStub({
                  id: 'pc-badge',
                  step: 'work',
                  assignedUnitIds: [UNIT_OBSERVABLE],
                  contextUnitIds: [],
                }),
              ],
            }),
          ],
        }),
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems.find((item) => item.id !== workItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        operationStatus: after.operations.find((op) => String(op.id) === opId)?.status,
        mintedStep: minted?.step,
        mintedRole: minted?.role,
        mintedStatus: minted?.status,
        mintedAssignedUnitIds: minted?.assignedUnitIds.map(String),
        mintedPieceId: minted?.pieceId,
        mintedMintedBy: minted?.mintedBy,
        mintedDependsOn: minted?.dependsOn,
        mintedRelatedDataItems: minted?.relatedDataItems.map(String),
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        // The scope is still open — routing a step never completes the operation item on its own.
        operationStatus: 'in_progress',
        mintedStep: 'work',
        mintedRole: 'codeweaver',
        mintedStatus: 'pending',
        mintedAssignedUnitIds: [UNIT_OBSERVABLE],
        // `minted-work-item-contract.ts`'s own header: "`pieceId` AND `payload` COME APART on a
        // mark-, request-, invalidation- or return-mint: there is no piece, so `pieceId` is absent."
        // Verified here against real disk — grouping by the originating piece happens through
        // `mintedBy` (the item that held the unit) and the piece's `payload`, never a `pieceId` copy.
        mintedPieceId: undefined,
        mintedMintedBy: workItemId,
        mintedDependsOn: [workItemId],
        mintedRelatedDataItems: [`operations/${opId}`],
      });
    }, 30_000);
  });

  describe('work — done mints review', () => {
    it("VALID: {a `work` item drains done} => mints `review`, assigned the STEP'S WHOLE in-scope set (a terminal unit alongside the observable `work` touched), not only the unit `work` marked", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-cw-work-done' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const workItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [codeweaverScope({ opId })],
        workItems: [
          WorkItemStub({
            id: workItemId,
            role: 'codeweaver',
            status: 'complete',
            step: 'work',
            assignedUnitIds: [UNIT_OBSERVABLE],
            observations: [
              UnitObservationStub({
                unitId: UNIT_OBSERVABLE,
                mark: 'met',
                evidence:
                  'packages/web/src/widgets/badge/badge-widget.test.tsx:12 — counts only persisted comments',
              }),
            ],
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems.find((item) => item.id !== workItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        mintedStep: minted?.step,
        mintedRole: minted?.role,
        mintedStatus: minted?.status,
        mintedAssignedUnitIds: minted?.assignedUnitIds.map(String).sort(),
        mintedPieceId: minted?.pieceId,
        mintedMintedBy: minted?.mintedBy,
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        mintedStep: 'review',
        mintedRole: 'codeweaver',
        mintedStatus: 'pending',
        mintedAssignedUnitIds: [UNIT_OBSERVABLE, UNIT_TERMINAL].sort(),
        mintedPieceId: undefined,
        // A DECLARED forward route (`node.routes.done`), minted by `stepEntryBatchTransformer` —
        // that transformer never sets `mintedBy`, unlike a mark-mint (question 2).
        mintedMintedBy: undefined,
      });
    }, 30_000);
  });

  describe('review — unmet mints work', () => {
    it('VALID: {a `review` item drains with one of its two units unmet} => mints `work`, carrying only the unmet unit', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-cw-review-unmet' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const reviewItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [codeweaverScope({ opId })],
        workItems: [
          WorkItemStub({
            id: reviewItemId,
            role: 'codeweaver',
            status: 'complete',
            step: 'review',
            assignedUnitIds: [UNIT_TERMINAL, UNIT_OBSERVABLE],
            observations: [
              UnitObservationStub({
                unitId: UNIT_TERMINAL,
                mark: 'met',
                evidence: 'the composer node terminates the flow — reached in the browser walk',
              }),
              UnitObservationStub({
                unitId: UNIT_OBSERVABLE,
                mark: 'unmet',
                evidence: 'the badge still counts queued comments, not persisted ones',
              }),
            ],
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems.find((item) => item.id !== reviewItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        mintedStep: minted?.step,
        mintedRole: minted?.role,
        mintedAssignedUnitIds: minted?.assignedUnitIds.map(String),
        mintedPieceId: minted?.pieceId,
        mintedMintedBy: minted?.mintedBy,
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        mintedStep: 'work',
        mintedRole: 'codeweaver',
        mintedAssignedUnitIds: [UNIT_OBSERVABLE],
        mintedPieceId: undefined,
        // The reviewer's OWN unmet is a mark-mint (question 2) — a review item DOES hold real units,
        // unlike a deterministic step — so `mintedBy` names the item that held the unit: the reviewer
        // itself.
        mintedMintedBy: reviewItemId,
      });
    }, 30_000);
  });

  describe('review — done mints commit', () => {
    it('VALID: {a `review` item drains done on its whole in-scope set} => mints `commit`, a deterministic entry assigned no units', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-cw-review-done' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const reviewItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [codeweaverScope({ opId })],
        workItems: [
          WorkItemStub({
            id: reviewItemId,
            role: 'codeweaver',
            status: 'complete',
            step: 'review',
            assignedUnitIds: [UNIT_TERMINAL, UNIT_OBSERVABLE],
            observations: [
              UnitObservationStub({ unitId: UNIT_TERMINAL, mark: 'met', evidence: 'reached' }),
              UnitObservationStub({
                unitId: UNIT_OBSERVABLE,
                mark: 'met',
                evidence: 'counts right',
              }),
            ],
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems.find((item) => item.id !== reviewItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        mintedStep: minted?.step,
        mintedRole: minted?.role,
        mintedAssignedUnitIds: minted?.assignedUnitIds.map(String),
        mintedPieceId: minted?.pieceId,
        mintedMintedBy: minted?.mintedBy,
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        mintedStep: 'commit',
        mintedRole: 'codeweaver',
        mintedAssignedUnitIds: [],
        mintedPieceId: undefined,
        mintedMintedBy: undefined,
      });
    }, 30_000);
  });

  describe('commit — done and empty both mint ward', () => {
    it('VALID: {a `commit` item drains done} => mints `ward`, a deterministic entry assigned no units', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-cw-commit-done' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const commitItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [codeweaverScope({ opId })],
        workItems: [
          WorkItemStub({
            id: commitItemId,
            role: 'codeweaver',
            status: 'complete',
            step: 'commit',
            assignedUnitIds: [],
            declaredWord: 'done',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems.find((item) => item.id !== commitItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        mintedStep: minted?.step,
        mintedRole: minted?.role,
        mintedAssignedUnitIds: minted?.assignedUnitIds.map(String),
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        mintedStep: 'ward',
        mintedRole: 'codeweaver',
        mintedAssignedUnitIds: [],
      });
    }, 30_000);

    it('VALID: {a `commit` item drains empty — a clean tree, nothing to commit} => mints `ward` too, per CLOSE_OUT.commit\'s own comment ("it still wards — the branch may be red from an earlier scope")', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-cw-commit-empty' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const commitItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [codeweaverScope({ opId })],
        workItems: [
          WorkItemStub({
            id: commitItemId,
            role: 'codeweaver',
            status: 'complete',
            step: 'commit',
            assignedUnitIds: [],
            declaredWord: 'empty',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems.find((item) => item.id !== commitItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        mintedStep: minted?.step,
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        mintedStep: 'ward',
      });
    }, 30_000);
  });

  describe('ward — unmet mints repair', () => {
    it("VALID: {a `ward` item drains unmet} => mints `repair` — a deterministic step carries no units, so this is a DECLARED forward route (question 4), never question 2's mark-mint, and the minted item carries `mintedBy` naming the ward item, because `repair` declares no `done` route of its own and needs the return edge's fuel", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-cw-ward-unmet' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const wardItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [codeweaverScope({ opId })],
        workItems: [
          WorkItemStub({
            id: wardItemId,
            role: 'codeweaver',
            status: 'complete',
            step: 'ward',
            assignedUnitIds: [],
            declaredWord: 'unmet',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems.find((item) => item.id !== wardItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        operationStatus: after.operations.find((op) => String(op.id) === opId)?.status,
        mintedStep: minted?.step,
        mintedRole: minted?.role,
        mintedStatus: minted?.status,
        mintedAssignedUnitIds: minted?.assignedUnitIds.map(String),
        mintedPieceId: minted?.pieceId,
        // See the NOTE 1 test below for what this buys: the fresh `repair` item now carries
        // enough for its own undeclared `done` outcome to find its way back to `ward`.
        mintedMintedBy: minted?.mintedBy,
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        operationStatus: 'in_progress',
        mintedStep: 'repair',
        mintedRole: 'codeweaver',
        mintedStatus: 'pending',
        mintedAssignedUnitIds: [],
        mintedPieceId: undefined,
        mintedMintedBy: wardItemId,
      });
    }, 30_000);
  });

  // NOTE 1, settled. `packages/orchestrator/CLAUDE.md`'s "Operations Ledger & Work Items" section
  // says an undeclared outcome "returns to the work item `mintedBy` names — as a FRESH work item at
  // that minter's step". `agentFlowStatics.codeweaver.steps.repair` (CLOSE_OUT.repair) declares no
  // `done` route on purpose, which reads as safe only because the plain route mint that enters
  // `repair` now stamps `mintedBy` itself.
  //
  // `ward` is a `kind: 'deterministic'` step, so `stepEntryBatchTransformer` always mints it — and
  // every step reached FROM it — with `assignedUnitIds: []`. Question 2 ("does this step have unmet
  // UNITS") reads `terminalStepItems.flatMap(item => item.assignedUnitIds)`, which is therefore
  // always empty for `ward`, so `ward`'s `unmet` NEVER takes question 2's mark-mint branch — it
  // always takes question 4's plain DECLARED-route branch (`node.routes.unmet = 'repair'`).
  // `nextActionTransformer` stamps `mintedBy` on that mint itself, naming the ward item, precisely
  // BECAUSE `repair`'s own route table declares no `done` — the `ward — unmet mints repair` test
  // above is the same fact, verified against real disk: `mintedMintedBy: wardItemId`.
  //
  // So when that repair session finishes — reporting nothing, the way `spiritmender-prompt-statics.ts`
  // describes ("signal-back carries no per-outcome field... every path through this prompt ends in the
  // same [signal-back]") — `nextActionTransformer`'s Question 4 default kicks in
  // (`declaredWord ?? (role === 'planner' ... : 'done')`), folding repair's outcome to `done`. Repair's
  // routes declare no `done`, so the router falls into the "return to minter" branch, finds the ward
  // item `mintedBy` names, and mints a FRESH `ward` item there — the gate re-runs rather than the
  // quest blocking. This test drives that exact two-round sequence against real disk and is the
  // verbatim evidence for the fixpoint holding.
  describe('NOTE 1 — a finished repair off a ward `unmet` route returns to a FRESH ward item', () => {
    it("VALID: {a repair item minted off ward's `unmet` route drains with no declaredWord} => the router folds it to `done` (the no-units default), follows `mintedBy` back to the ward item that routed it here, and mints a FRESH `ward` item — the gate re-runs rather than the quest blocking", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-cw-ward-repair-return' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const wardItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [codeweaverScope({ opId })],
        workItems: [
          WorkItemStub({
            id: wardItemId,
            role: 'codeweaver',
            status: 'complete',
            step: 'ward',
            assignedUnitIds: [],
            declaredWord: 'unmet',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      // ROUND 1 — ward's `unmet` route mints repair. The non-null assertion is deliberate: a
      // missing mint here is a SETUP failure this test does not exist to diagnose, and the
      // assertions below read real values off whatever this finds.
      await questRouteScopeBroker({ questId });
      const afterFirst = await quest.reload({ questId });
      const repairItem = afterFirst.workItems.find((item) => item.id !== wardItemId)!;

      // ROUND 2 — the repair session finishes and signals complete, WITHOUT declaring an outcome
      // word (it holds no units, and the spiritmender prompt never calls quest-work's outcome
      // payload — see this describe block's own header comment). Filter-and-append keeps the
      // repair item LAST in array order, exactly where it already sat, which is what
      // `nextActionTransformer` reads as "the current step".
      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: afterFirst.operations,
        workItems: [
          ...afterFirst.workItems.filter((item) => item.id !== repairItem.id),
          { ...repairItem, status: 'complete' as const },
        ],
      });

      const secondResult = await questRouteScopeBroker({ questId });
      const afterSecond = await quest.reload({ questId });
      const freshWard = afterSecond.workItems
        .filter((item) => item.id !== wardItemId)
        .find((item) => item.id !== repairItem.id);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        repairMintedBy: repairItem.mintedBy,
        secondResult,
        questStatus: afterSecond.status,
        operationStatus: afterSecond.operations.find((op) => String(op.id) === opId)?.status,
        freshWardStep: freshWard?.step,
        freshWardRole: freshWard?.role,
        freshWardStatus: freshWard?.status,
        freshWardAssignedUnitIds: freshWard?.assignedUnitIds.map(String),
        // A THIRD work item appears — the fresh `ward` entry the return edge minted.
        workItemCount: afterSecond.workItems.length,
      }).toStrictEqual({
        repairMintedBy: wardItemId,
        secondResult: { routed: true, blocked: false },
        questStatus: 'in_progress',
        operationStatus: 'in_progress',
        freshWardStep: 'ward',
        freshWardRole: 'codeweaver',
        freshWardStatus: 'pending',
        freshWardAssignedUnitIds: [],
        workItemCount: 3,
      });
    }, 30_000);
  });

  describe('maxVisits — the ward/repair fixpoint blocks rather than looping forever', () => {
    it("ERROR: {ward and repair have already alternated three times, spending ward's whole `maxVisits`} => a repair draining `done` (undeclared) tries to return a FOURTH ward and blocks with reason `max-visits`, naming `ward`", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-cw-ward-repair-fixpoint-maxvisits' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const ward1Id = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const repair1Id = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const ward2Id = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const repair2Id = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const ward3Id = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const repair3Id = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const relatedDataItems = [`operations/${opId}`];

      // Three full `ward -> repair -> ward` cycles, laid out explicitly rather than generated:
      // each `repair` carries `mintedBy` for the `ward` that routed to it (the fix this file
      // exists to prove), and each `ward` after the first carries `mintedBy` for the `repair`
      // that returned to it — the SAME propagation `next-action-transformer.ts`'s
      // return-to-minter branch already does for a worker step.
      // `agentFlowStatics.codeweaver.steps.ward` (CLOSE_OUT.ward) declares `maxVisits: 3`, so
      // `ward` has already spent its whole budget by the third cycle. The LAST item is the third
      // repair, drained with no declaredWord: its undeclared `done` return would mint a FOURTH
      // `ward` — one past the budget.
      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [codeweaverScope({ opId })],
        workItems: [
          WorkItemStub({
            id: ward1Id,
            role: 'codeweaver',
            status: 'complete',
            step: 'ward',
            assignedUnitIds: [],
            declaredWord: 'unmet',
            relatedDataItems,
          }),
          WorkItemStub({
            id: repair1Id,
            role: 'codeweaver',
            status: 'complete',
            step: 'repair',
            assignedUnitIds: [],
            mintedBy: ward1Id,
            relatedDataItems,
          }),
          WorkItemStub({
            id: ward2Id,
            role: 'codeweaver',
            status: 'complete',
            step: 'ward',
            assignedUnitIds: [],
            declaredWord: 'unmet',
            mintedBy: repair1Id,
            relatedDataItems,
          }),
          WorkItemStub({
            id: repair2Id,
            role: 'codeweaver',
            status: 'complete',
            step: 'repair',
            assignedUnitIds: [],
            mintedBy: ward2Id,
            relatedDataItems,
          }),
          WorkItemStub({
            id: ward3Id,
            role: 'codeweaver',
            status: 'complete',
            step: 'ward',
            assignedUnitIds: [],
            declaredWord: 'unmet',
            mintedBy: repair2Id,
            relatedDataItems,
          }),
          WorkItemStub({
            id: repair3Id,
            role: 'codeweaver',
            status: 'complete',
            step: 'repair',
            assignedUnitIds: [],
            mintedBy: ward3Id,
            relatedDataItems,
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const lastRepairAfter = after.workItems.find((item) => item.id === repair3Id);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        questStatus: after.status,
        // No fourth `ward` item was minted — the budget check runs before the mint.
        workItemCount: after.workItems.length,
        lastRepairStatus: lastRepairAfter?.status,
        lastRepairErrorMessage: lastRepairAfter?.errorMessage,
      }).toStrictEqual({
        result: { routed: false, blocked: true },
        questStatus: 'blocked',
        workItemCount: 6,
        lastRepairStatus: 'failed',
        lastRepairErrorMessage:
          'maxVisits spent: step `ward` in family `codeweaver` has been entered 3 times for ' +
          `operation item ${opId}, and its whole budget is 3 — the loop is not converging and ` +
          'another session would find the same thing. Still unmet: none.',
      });
    }, 30_000);
  });

  describe('maxVisits — a spent budget on repair blocks the quest', () => {
    it('ERROR: {repair already entered 3 times — its whole `maxVisits` — and folds to `unmet` again} => blocks with reason `max-visits`, naming the step, the family and the spent budget', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-cw-repair-maxvisits' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const repairIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()].map(
        (value) => QuestWorkItemIdStub({ value }),
      );

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [codeweaverScope({ opId })],
        // `agentFlowStatics.codeweaver.steps.repair` (CLOSE_OUT.repair) declares `maxVisits: 3`.
        // Three prior visits already spent the whole budget; this scan's attempt at a fourth is
        // what `mint-next-action-transformer.ts` checks BEFORE minting anything.
        workItems: repairIds.map((id) =>
          WorkItemStub({
            id,
            role: 'codeweaver',
            status: 'complete',
            step: 'repair',
            assignedUnitIds: [],
            declaredWord: 'unmet',
            relatedDataItems: [`operations/${opId}`],
          }),
        ),
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const lastRepairId = repairIds[repairIds.length - 1];
      const lastRepairAfter = after.workItems.find((item) => item.id === lastRepairId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        questStatus: after.status,
        workItemCount: after.workItems.length,
        lastRepairStatus: lastRepairAfter?.status,
        lastRepairErrorMessage: lastRepairAfter?.errorMessage,
      }).toStrictEqual({
        result: { routed: false, blocked: true },
        questStatus: 'blocked',
        // No fourth work item was minted — the budget check runs before the mint.
        workItemCount: 3,
        lastRepairStatus: 'failed',
        lastRepairErrorMessage:
          'maxVisits spent: step `repair` in family `codeweaver` has been entered 3 times for ' +
          `operation item ${opId}, and its whole budget is 3 — the loop is not converging and ` +
          'another session would find the same thing. Still unmet: none.',
      });
    }, 30_000);
  });
});

// Siege is the INVERSE of the other two families — its reviewers (`happyWalk`/`adversarial`) run
// first and find the work, its workers (`fixHappy`/`fixAdversarial`) repair it — and `ward` is
// OVERRIDDEN to route through `sweepOut` rather than straight to `@done` (see
// `agentFlowStatics.siegemaster.steps.ward`). Reuses the module-scope `SEND_FLOW` /
// `UNIT_OBSERVABLE` / `UNIT_TERMINAL` / `WEB_PACKAGE` fixtures declared above for the codeweaver
// block: the router treats a unit id as an opaque string, so the same two units serve every family.

// `qaUnitEnumerateTransformer` mints these SEVEN off-map probe units for EVERY flow, unconditionally
// — verified against real disk: `SEND_FLOW` declares none of its own, yet a fresh `happyWalk`/
// `adversarial` entry carries them anyway. `happyWalk`'s in-scope set
// (`stepScopeStatics.byFamilyStep.siegemaster.happyWalk.unitKinds`) is `['terminal','branch',
// 'observable','off-map']`, so its whole-scope reassignment is these seven PLUS the flow's own
// terminal+observable; `adversarial`'s is `['off-map']` alone, so its whole-scope reassignment is
// exactly these seven and nothing else — never empty, contrary to this file's first draft.
const OFF_MAP_UNITS = [
  'send-flow:off-map:concurrency',
  'send-flow:off-map:configuration',
  'send-flow:off-map:hostile-input',
  'send-flow:off-map:interruption',
  'send-flow:off-map:perf',
  'send-flow:off-map:re-entry',
  'send-flow:off-map:staleness',
];

const siegemasterScope = ({ opId }: { opId: string }) =>
  OperationItemStub({
    id: OperationItemIdStub({ value: opId }),
    role: 'siegemaster',
    text: 'Siegemaster: manual-QA this flow and review its test suite — package: web · flow: send-flow',
    status: 'in_progress',
    locked: false,
    flowIds: ['send-flow'],
    packageNames: ['web'],
  });

describe('siegemaster', () => {
  const quest = orchestrationQuestHarness();

  describe('sweepIn — done and empty both mint plan', () => {
    it('VALID: {a `sweepIn` item drains done} => mints `plan`, a deterministic entry assigned no units', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-sweepin-done' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const sweepInItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: sweepInItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'sweepIn',
            assignedUnitIds: [],
            declaredWord: 'done',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems.find((item) => item.id !== sweepInItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        mintedStep: minted?.step,
        mintedRole: minted?.role,
        mintedAssignedUnitIds: minted?.assignedUnitIds.map(String),
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        mintedStep: 'plan',
        mintedRole: 'siegemaster',
        mintedAssignedUnitIds: [],
      });
    }, 30_000);

    it('VALID: {a `sweepIn` item drains empty} => mints `plan` too — sweepIn has no separate empty edge', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-sweepin-empty' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const sweepInItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: sweepInItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'sweepIn',
            assignedUnitIds: [],
            declaredWord: 'empty',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems.find((item) => item.id !== sweepInItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        mintedStep: minted?.step,
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        mintedStep: 'plan',
      });
    }, 30_000);
  });

  describe('plan — done mints happyWalk, empty mints sweepOut', () => {
    it("VALID: {a `plan` item drains done} => mints `happyWalk`, assigned the step's WHOLE in-scope set — the same reviewer-entry shape codeweaver's `review` uses", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-plan-done' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const planItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: planItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'plan',
            assignedUnitIds: [],
            declaredWord: 'done',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems.find((item) => item.id !== planItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        mintedStep: minted?.step,
        mintedRole: minted?.role,
        mintedAssignedUnitIds: minted?.assignedUnitIds.map(String).sort(),
        mintedMintedBy: minted?.mintedBy,
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        mintedStep: 'happyWalk',
        mintedRole: 'siegemaster',
        mintedAssignedUnitIds: [UNIT_OBSERVABLE, UNIT_TERMINAL, ...OFF_MAP_UNITS].sort(),
        // `happyWalk` declares its own `done` route (`adversarial`), so this forward mint carries no
        // return-edge fuel — unlike `ward`'s override below, whose target (`repair`) declares none.
        mintedMintedBy: undefined,
      });
    }, 30_000);

    it('VALID: {a `plan` item drains empty — nothing to walk} => mints `sweepOut`, a deterministic entry assigned no units', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-plan-empty' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const planItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: planItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'plan',
            assignedUnitIds: [],
            declaredWord: 'empty',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems.find((item) => item.id !== planItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        mintedStep: minted?.step,
        mintedAssignedUnitIds: minted?.assignedUnitIds.map(String),
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        mintedStep: 'sweepOut',
        mintedAssignedUnitIds: [],
      });
    }, 30_000);
  });

  describe('happyWalk — unmet mints fixHappy', () => {
    it('VALID: {a `happyWalk` item drains with one of its two units unmet} => mints `fixHappy`, carrying only the unmet unit — each walker has its OWN fixer', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-happywalk-unmet' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const happyWalkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: happyWalkItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'happyWalk',
            assignedUnitIds: [UNIT_TERMINAL, UNIT_OBSERVABLE],
            observations: [
              UnitObservationStub({
                unitId: UNIT_TERMINAL,
                mark: 'met',
                evidence: 'the composer node terminates the flow — reached in the browser walk',
              }),
              UnitObservationStub({
                unitId: UNIT_OBSERVABLE,
                mark: 'unmet',
                evidence: 'the badge still counts queued comments, not persisted ones',
              }),
            ],
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems.find((item) => item.id !== happyWalkItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        mintedStep: minted?.step,
        mintedRole: minted?.role,
        mintedAssignedUnitIds: minted?.assignedUnitIds.map(String),
        mintedMintedBy: minted?.mintedBy,
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        mintedStep: 'fixHappy',
        mintedRole: 'siegemaster',
        mintedAssignedUnitIds: [UNIT_OBSERVABLE],
        mintedMintedBy: happyWalkItemId,
      });
    }, 30_000);
  });

  describe('fixHappy — unmet loops back to fixHappy', () => {
    it('VALID: {a `fixHappy` item drains with its one unit still unmet} => mints a fresh `fixHappy`, carrying that same unit', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-fixhappy-unmet' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const fixHappyItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: fixHappyItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'fixHappy',
            assignedUnitIds: [UNIT_OBSERVABLE],
            observations: [
              UnitObservationStub({
                unitId: UNIT_OBSERVABLE,
                mark: 'unmet',
                evidence: 'still counts queued comments after the first fix attempt',
              }),
            ],
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems.find((item) => item.id !== fixHappyItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        mintedStep: minted?.step,
        mintedRole: minted?.role,
        mintedAssignedUnitIds: minted?.assignedUnitIds.map(String),
        mintedMintedBy: minted?.mintedBy,
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        mintedStep: 'fixHappy',
        mintedRole: 'siegemaster',
        mintedAssignedUnitIds: [UNIT_OBSERVABLE],
        mintedMintedBy: fixHappyItemId,
      });
    }, 30_000);
  });

  describe('fixHappy — a finished fixer returns to happyWalk as a FRESH item', () => {
    it("VALID: {a `fixHappy` item minted off happyWalk's `unmet` route drains with its unit now met} => the router folds it to `done`, follows `mintedBy` back to the walker that routed it here, and mints a FRESH `happyWalk` item carrying the step's WHOLE in-scope set — never a resume of the fixer's own narrower assignment", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-fixhappy-return' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const happyWalkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: happyWalkItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'happyWalk',
            assignedUnitIds: [UNIT_TERMINAL, UNIT_OBSERVABLE],
            observations: [
              UnitObservationStub({ unitId: UNIT_TERMINAL, mark: 'met', evidence: 'reached' }),
              UnitObservationStub({
                unitId: UNIT_OBSERVABLE,
                mark: 'unmet',
                evidence: 'the badge still counts queued comments, not persisted ones',
              }),
            ],
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      // ROUND 1 — happyWalk's `unmet` route mints fixHappy.
      await questRouteScopeBroker({ questId });
      const afterFirst = await quest.reload({ questId });
      const fixHappyItem = afterFirst.workItems.find((item) => item.id !== happyWalkItemId)!;

      // ROUND 2 — the fixer settles the one unit it was handed.
      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: afterFirst.operations,
        workItems: [
          ...afterFirst.workItems.filter((item) => item.id !== fixHappyItem.id),
          {
            ...fixHappyItem,
            status: 'complete' as const,
            observations: [
              UnitObservationStub({
                unitId: UNIT_OBSERVABLE,
                mark: 'met',
                evidence: 'now counts only persisted comments',
              }),
            ],
          },
        ],
      });

      const secondResult = await questRouteScopeBroker({ questId });
      const afterSecond = await quest.reload({ questId });
      const freshHappyWalk = afterSecond.workItems
        .filter((item) => item.id !== happyWalkItemId)
        .find((item) => item.id !== fixHappyItem.id);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        fixHappyMintedBy: fixHappyItem.mintedBy,
        secondResult,
        freshHappyWalkStep: freshHappyWalk?.step,
        freshHappyWalkRole: freshHappyWalk?.role,
        freshHappyWalkStatus: freshHappyWalk?.status,
        freshHappyWalkAssignedUnitIds: freshHappyWalk?.assignedUnitIds.map(String).sort(),
        // A THIRD work item appears — the fresh `happyWalk` entry the return edge minted.
        workItemCount: afterSecond.workItems.length,
      }).toStrictEqual({
        fixHappyMintedBy: happyWalkItemId,
        secondResult: { routed: true, blocked: false },
        freshHappyWalkStep: 'happyWalk',
        freshHappyWalkRole: 'siegemaster',
        freshHappyWalkStatus: 'pending',
        freshHappyWalkAssignedUnitIds: [UNIT_OBSERVABLE, UNIT_TERMINAL, ...OFF_MAP_UNITS].sort(),
        workItemCount: 3,
      });
    }, 30_000);
  });

  describe('happyWalk — the phase rule: `done` fires only once every piece at this step has drained', () => {
    it("VALID: {two `happyWalk` pieces have BOTH drained done} => mints `adversarial` — the phase edge an antagonist's baseline depends on. `adversarial`'s own in-scope set is `off-map`-only (stepScopeStatics), so the fresh entry is assigned exactly the seven off-map probe units `qaUnitEnumerateTransformer` mints for every flow, never this flow's own terminal/observable units", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-happywalk-phase-drained' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const piece1Id = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const piece2Id = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: piece1Id,
            role: 'siegemaster',
            status: 'complete',
            step: 'happyWalk',
            assignedUnitIds: [UNIT_TERMINAL],
            observations: [
              UnitObservationStub({ unitId: UNIT_TERMINAL, mark: 'met', evidence: 'reached' }),
            ],
            relatedDataItems: [`operations/${opId}`],
          }),
          WorkItemStub({
            id: piece2Id,
            role: 'siegemaster',
            status: 'complete',
            step: 'happyWalk',
            assignedUnitIds: [UNIT_OBSERVABLE],
            observations: [
              UnitObservationStub({
                unitId: UNIT_OBSERVABLE,
                mark: 'met',
                evidence: 'counts right',
              }),
            ],
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems
        .filter((item) => item.id !== piece1Id)
        .find((item) => item.id !== piece2Id);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        mintedStep: minted?.step,
        mintedRole: minted?.role,
        mintedAssignedUnitIds: minted?.assignedUnitIds.map(String).sort(),
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        mintedStep: 'adversarial',
        mintedRole: 'siegemaster',
        mintedAssignedUnitIds: [...OFF_MAP_UNITS].sort(),
      });
    }, 30_000);

    it('VALID: {one `happyWalk` piece has drained done, but a sibling piece at the same step is still pending} => nothing routes — the phase rule holds question 4 back until every piece drains', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-happywalk-phase-capped' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const piece1Id = QuestWorkItemIdStub({ value: crypto.randomUUID() });
      const piece2Id = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: piece1Id,
            role: 'siegemaster',
            status: 'complete',
            step: 'happyWalk',
            assignedUnitIds: [UNIT_TERMINAL],
            observations: [
              UnitObservationStub({ unitId: UNIT_TERMINAL, mark: 'met', evidence: 'reached' }),
            ],
            relatedDataItems: [`operations/${opId}`],
          }),
          WorkItemStub({
            id: piece2Id,
            role: 'siegemaster',
            status: 'pending',
            step: 'happyWalk',
            assignedUnitIds: [UNIT_OBSERVABLE],
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        questStatus: after.status,
        operationStatus: after.operations.find((op) => String(op.id) === opId)?.status,
        // No third work item appears — the router never even reaches the phase-rule check here:
        // `questRouteScopeBroker`'s OWN candidate gate requires every work item on the whole scope
        // to be terminal before it calls the router at all (see this file's header comment: "A scope
        // with a live work item ... the router's phase rule would answer `capped` for it anyway"),
        // so a live sibling piece short-circuits routing one layer above `nextActionTransformer`'s
        // own `cause: 'capped'` branch — the observable result is identical either way.
        workItemCount: after.workItems.length,
      }).toStrictEqual({
        result: { routed: false, blocked: false },
        questStatus: 'in_progress',
        operationStatus: 'in_progress',
        workItemCount: 2,
      });
    }, 30_000);
  });

  describe('FINDING — happyWalk declares no `empty` route, unlike its `plan` counterpart', () => {
    it("ERROR: {a `happyWalk` item is assigned no units and drains empty} => the router folds it to `empty`, finds no route for it AND no `mintedBy` to return to, and BLOCKS the quest with reason `no-minter` — `plan`'s own `empty` route sends the identical case to `sweepOut` instead, so an all-off-map or zero-unit happyWalk pass has no forward path at all", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-happywalk-empty-gap' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const happyWalkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: happyWalkItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'happyWalk',
            assignedUnitIds: [],
            declaredWord: 'empty',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const item = after.workItems.find((workItem) => workItem.id === happyWalkItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        questStatus: after.status,
        itemStatus: item?.status,
        itemErrorMessage: item?.errorMessage,
      }).toStrictEqual({
        result: { routed: false, blocked: true },
        questStatus: 'blocked',
        itemStatus: 'failed',
        itemErrorMessage:
          'step `happyWalk` in family `siegemaster` folded to `empty`, which it declares no route ' +
          'for, and the work item that recorded it names no minter to return to. An undeclared ' +
          'outcome returns to whoever minted the step; with neither a route nor a minter the scope ' +
          'has nowhere to go.',
      });
    }, 30_000);
  });

  describe('adversarial — unmet mints fixAdversarial', () => {
    it('VALID: {an `adversarial` item drains with one of its two units unmet} => mints `fixAdversarial`, carrying only the unmet unit', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-adversarial-unmet' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const adversarialItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: adversarialItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'adversarial',
            assignedUnitIds: [UNIT_TERMINAL, UNIT_OBSERVABLE],
            observations: [
              UnitObservationStub({
                unitId: UNIT_TERMINAL,
                mark: 'met',
                evidence: 'held under the attack',
              }),
              UnitObservationStub({
                unitId: UNIT_OBSERVABLE,
                mark: 'unmet',
                evidence: 'the badge count desyncs under a replayed request',
              }),
            ],
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems.find((item) => item.id !== adversarialItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        mintedStep: minted?.step,
        mintedRole: minted?.role,
        mintedAssignedUnitIds: minted?.assignedUnitIds.map(String),
        mintedMintedBy: minted?.mintedBy,
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        mintedStep: 'fixAdversarial',
        mintedRole: 'siegemaster',
        mintedAssignedUnitIds: [UNIT_OBSERVABLE],
        mintedMintedBy: adversarialItemId,
      });
    }, 30_000);
  });

  describe('fixAdversarial — unmet loops back to fixAdversarial', () => {
    it('VALID: {a `fixAdversarial` item drains with its one unit still unmet} => mints a fresh `fixAdversarial`, carrying that same unit', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-fixadversarial-unmet' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const fixAdversarialItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: fixAdversarialItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'fixAdversarial',
            assignedUnitIds: [UNIT_OBSERVABLE],
            observations: [
              UnitObservationStub({
                unitId: UNIT_OBSERVABLE,
                mark: 'unmet',
                evidence: 'still desyncs after the first repair attempt',
              }),
            ],
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems.find((item) => item.id !== fixAdversarialItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        mintedStep: minted?.step,
        mintedRole: minted?.role,
        mintedAssignedUnitIds: minted?.assignedUnitIds.map(String),
        mintedMintedBy: minted?.mintedBy,
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        mintedStep: 'fixAdversarial',
        mintedRole: 'siegemaster',
        mintedAssignedUnitIds: [UNIT_OBSERVABLE],
        mintedMintedBy: fixAdversarialItemId,
      });
    }, 30_000);
  });

  describe('fixAdversarial — a finished fixer returns to adversarial as a FRESH item', () => {
    it("VALID: {a `fixAdversarial` item minted off adversarial's `unmet` route drains with its unit now met} => the router folds it to `done`, follows `mintedBy` back to the walker that routed it here, and mints a FRESH `adversarial` item — assigned exactly the seven off-map probe units (`adversarial`'s own in-scope set is `off-map`-only), never the two flow units the fixer itself was seeded with, and never happyWalk's own terminal+observable pair either", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-fixadversarial-return' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const adversarialItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: adversarialItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'adversarial',
            assignedUnitIds: [UNIT_TERMINAL, UNIT_OBSERVABLE],
            observations: [
              UnitObservationStub({
                unitId: UNIT_TERMINAL,
                mark: 'met',
                evidence: 'held under the attack',
              }),
              UnitObservationStub({
                unitId: UNIT_OBSERVABLE,
                mark: 'unmet',
                evidence: 'the badge count desyncs under a replayed request',
              }),
            ],
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      // ROUND 1 — adversarial's `unmet` route mints fixAdversarial.
      await questRouteScopeBroker({ questId });
      const afterFirst = await quest.reload({ questId });
      const fixAdversarialItem = afterFirst.workItems.find(
        (item) => item.id !== adversarialItemId,
      )!;

      // ROUND 2 — the fixer settles the one unit it was handed.
      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: afterFirst.operations,
        workItems: [
          ...afterFirst.workItems.filter((item) => item.id !== fixAdversarialItem.id),
          {
            ...fixAdversarialItem,
            status: 'complete' as const,
            observations: [
              UnitObservationStub({
                unitId: UNIT_OBSERVABLE,
                mark: 'met',
                evidence: 'holds under the replayed request now',
              }),
            ],
          },
        ],
      });

      const secondResult = await questRouteScopeBroker({ questId });
      const afterSecond = await quest.reload({ questId });
      const freshAdversarial = afterSecond.workItems
        .filter((item) => item.id !== adversarialItemId)
        .find((item) => item.id !== fixAdversarialItem.id);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        fixAdversarialMintedBy: fixAdversarialItem.mintedBy,
        secondResult,
        freshAdversarialStep: freshAdversarial?.step,
        freshAdversarialRole: freshAdversarial?.role,
        freshAdversarialStatus: freshAdversarial?.status,
        freshAdversarialAssignedUnitIds: freshAdversarial?.assignedUnitIds.map(String).sort(),
        workItemCount: afterSecond.workItems.length,
      }).toStrictEqual({
        fixAdversarialMintedBy: adversarialItemId,
        secondResult: { routed: true, blocked: false },
        freshAdversarialStep: 'adversarial',
        freshAdversarialRole: 'siegemaster',
        freshAdversarialStatus: 'pending',
        freshAdversarialAssignedUnitIds: [...OFF_MAP_UNITS].sort(),
        workItemCount: 3,
      });
    }, 30_000);
  });

  describe('adversarial — done mints commit', () => {
    it('VALID: {an `adversarial` item drains done on its whole in-scope set} => mints `commit`, a deterministic entry assigned no units', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-adversarial-done' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const adversarialItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: adversarialItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'adversarial',
            assignedUnitIds: [UNIT_TERMINAL, UNIT_OBSERVABLE],
            observations: [
              UnitObservationStub({ unitId: UNIT_TERMINAL, mark: 'met', evidence: 'held' }),
              UnitObservationStub({ unitId: UNIT_OBSERVABLE, mark: 'met', evidence: 'held' }),
            ],
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems.find((item) => item.id !== adversarialItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        mintedStep: minted?.step,
        mintedRole: minted?.role,
        mintedAssignedUnitIds: minted?.assignedUnitIds.map(String),
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        mintedStep: 'commit',
        mintedRole: 'siegemaster',
        mintedAssignedUnitIds: [],
      });
    }, 30_000);
  });

  describe('ward (siege override) — done and empty both mint sweepOut, never `@done` directly', () => {
    it('VALID: {a siege `ward` item drains done} => mints `sweepOut`, not `@done` — the pass is not over until the siegelense instances are swept', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-ward-done' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const wardItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: wardItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'ward',
            assignedUnitIds: [],
            declaredWord: 'done',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems.find((item) => item.id !== wardItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        mintedStep: minted?.step,
        mintedRole: minted?.role,
        mintedAssignedUnitIds: minted?.assignedUnitIds.map(String),
        mintedMintedBy: minted?.mintedBy,
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        mintedStep: 'sweepOut',
        mintedRole: 'siegemaster',
        mintedAssignedUnitIds: [],
        mintedMintedBy: undefined,
      });
    }, 30_000);

    it('VALID: {a siege `ward` item drains empty} => mints `sweepOut` too', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-ward-empty' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const wardItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: wardItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'ward',
            assignedUnitIds: [],
            declaredWord: 'empty',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const minted = after.workItems.find((item) => item.id !== wardItemId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        mintedStep: minted?.step,
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        mintedStep: 'sweepOut',
      });
    }, 30_000);
  });

  describe('ward (siege override) — unmet mints repair, and a finished repair returns to a FRESH ward', () => {
    it("VALID: {a siege `ward` item drains unmet} => mints `repair` carrying `mintedBy`; once the repair session finishes with no declaredWord, the router folds it to `done` (the no-units default), follows `mintedBy` back to the ward item, and mints a FRESH `ward` item — the gate re-runs rather than the quest blocking, exactly as codeweaver's own ward/repair fixpoint does", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-ward-repair-return' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const wardItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: wardItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'ward',
            assignedUnitIds: [],
            declaredWord: 'unmet',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      // ROUND 1 — ward's `unmet` route mints repair.
      await questRouteScopeBroker({ questId });
      const afterFirst = await quest.reload({ questId });
      const repairItem = afterFirst.workItems.find((item) => item.id !== wardItemId)!;

      // ROUND 2 — the repair session finishes, reporting nothing (it holds no units).
      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: afterFirst.operations,
        workItems: [
          ...afterFirst.workItems.filter((item) => item.id !== repairItem.id),
          { ...repairItem, status: 'complete' as const },
        ],
      });

      const secondResult = await questRouteScopeBroker({ questId });
      const afterSecond = await quest.reload({ questId });
      const freshWard = afterSecond.workItems
        .filter((item) => item.id !== wardItemId)
        .find((item) => item.id !== repairItem.id);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        repairMintedBy: repairItem.mintedBy,
        secondResult,
        freshWardStep: freshWard?.step,
        freshWardRole: freshWard?.role,
        freshWardStatus: freshWard?.status,
        freshWardAssignedUnitIds: freshWard?.assignedUnitIds.map(String),
        workItemCount: afterSecond.workItems.length,
      }).toStrictEqual({
        repairMintedBy: wardItemId,
        secondResult: { routed: true, blocked: false },
        freshWardStep: 'ward',
        freshWardRole: 'siegemaster',
        freshWardStatus: 'pending',
        freshWardAssignedUnitIds: [],
        workItemCount: 3,
      });
    }, 30_000);
  });

  describe('sweepOut — done and empty both complete the scope, cascading the family graph onward to wardFull', () => {
    it("VALID: {a `sweepOut` item drains done, the family's only scope} => completes the siegemaster operation item and mints wardFull's own scope — `questFlowStatics.feature.families.siegemaster.routes.done` is 'wardFull'", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-sweepout-done' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const sweepOutItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: sweepOutItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'sweepOut',
            assignedUnitIds: [],
            declaredWord: 'done',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const siegeOp = after.operations.find((op) => String(op.id) === opId);
      const mintedOp = after.operations.find((op) => String(op.id) !== opId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        siegeOpStatus: siegeOp?.status,
        mintedOpRole: mintedOp?.role,
        mintedOpStatus: mintedOp?.status,
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        siegeOpStatus: 'complete',
        mintedOpRole: 'ward',
        mintedOpStatus: 'pending',
      });
    }, 30_000);

    it('VALID: {a `sweepOut` item drains empty} => completes the scope too, the same as done — both outcomes route to `wardFull`', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-sweepout-empty' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const sweepOutItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: sweepOutItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'sweepOut',
            assignedUnitIds: [],
            declaredWord: 'empty',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      const result = await questRouteScopeBroker({ questId });
      const after = await quest.reload({ questId });
      const siegeOp = after.operations.find((op) => String(op.id) === opId);
      const mintedOp = after.operations.find((op) => String(op.id) !== opId);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        result,
        siegeOpStatus: siegeOp?.status,
        mintedOpRole: mintedOp?.role,
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        siegeOpStatus: 'complete',
        mintedOpRole: 'ward',
      });
    }, 30_000);
  });

  describe('recipe — mintable on request, and returns to the requester regardless of what it folds to', () => {
    it("VALID: {a `plan` item requests `recipe`} => mints `recipe`, carrying the request's reason and naming the plan item as `mintedBy`; once the recipe item drains holding no units and no declaredWord, the router folds it to `empty` (a planner's no-plan default) and — since `recipe` declares no route for `empty` either — returns a FRESH `plan` item to the requester", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-recipe-request-return' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const planItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: planItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'plan',
            assignedUnitIds: [],
            requestedStep: 'recipe',
            requestedReason: 'need seed data for the browser walk before the plan can be written',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      // ROUND 1 — the plan item's own request wins outright over everything else (question 1).
      const firstResult = await questRouteScopeBroker({ questId });
      const afterFirst = await quest.reload({ questId });
      const recipeItem = afterFirst.workItems.find((item) => item.id !== planItemId)!;

      // ROUND 2 — the recipe session finishes holding no units and declaring no outcome word.
      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: afterFirst.operations,
        workItems: [
          ...afterFirst.workItems.filter((item) => item.id !== recipeItem.id),
          { ...recipeItem, status: 'complete' as const },
        ],
      });

      const secondResult = await questRouteScopeBroker({ questId });
      const afterSecond = await quest.reload({ questId });
      const freshPlan = afterSecond.workItems
        .filter((item) => item.id !== planItemId)
        .find((item) => item.id !== recipeItem.id);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        firstResult,
        recipeStep: recipeItem.step,
        recipeRole: recipeItem.role,
        recipeAssignedUnitIds: recipeItem.assignedUnitIds.map(String),
        recipePayload: recipeItem.payload,
        recipeMintedBy: recipeItem.mintedBy,
        secondResult,
        freshPlanStep: freshPlan?.step,
        freshPlanRole: freshPlan?.role,
        freshPlanStatus: freshPlan?.status,
        freshPlanAssignedUnitIds: freshPlan?.assignedUnitIds.map(String),
        workItemCount: afterSecond.workItems.length,
      }).toStrictEqual({
        firstResult: { routed: true, blocked: false },
        recipeStep: 'recipe',
        recipeRole: 'siegemaster',
        recipeAssignedUnitIds: [],
        recipePayload: {
          reason: 'need seed data for the browser walk before the plan can be written',
        },
        recipeMintedBy: planItemId,
        secondResult: { routed: true, blocked: false },
        freshPlanStep: 'plan',
        freshPlanRole: 'siegemaster',
        freshPlanStatus: 'pending',
        freshPlanAssignedUnitIds: [],
        workItemCount: 3,
      });
    }, 30_000);
  });

  describe('read — mintable on request, and returns to the requester as a FRESH full-scope item', () => {
    it("VALID: {a `happyWalk` item requests `read` mid-pass} => mints `read`, naming the walker as `mintedBy`; once it drains holding no units, the router folds it to `done` (a worker's default) and — since `read` declares no route for `done` either — returns a FRESH `happyWalk` item carrying the step's WHOLE in-scope set", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'rsb-sm-read-request-return' }),
      });
      const { questId } = await quest.createGuildAndQuest({ testbed });

      const opId = crypto.randomUUID();
      const happyWalkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: [siegemasterScope({ opId })],
        workItems: [
          WorkItemStub({
            id: happyWalkItemId,
            role: 'siegemaster',
            status: 'complete',
            step: 'happyWalk',
            assignedUnitIds: [UNIT_TERMINAL, UNIT_OBSERVABLE],
            requestedStep: 'read',
            requestedReason: 'confirm the exact timeout literal before marking this unit',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });

      // ROUND 1 — the walker's request wins outright over everything else (question 1), even
      // though this item still carries real assigned units with no observations recorded yet.
      const firstResult = await questRouteScopeBroker({ questId });
      const afterFirst = await quest.reload({ questId });
      const readItem = afterFirst.workItems.find((item) => item.id !== happyWalkItemId)!;

      // ROUND 2 — the reader finishes holding no units and declaring no outcome word.
      await quest.seedInProgressRelay({
        questId,
        flows: [SEND_FLOW],
        packagesAffected: [WEB_PACKAGE],
        operations: afterFirst.operations,
        workItems: [
          ...afterFirst.workItems.filter((item) => item.id !== readItem.id),
          { ...readItem, status: 'complete' as const },
        ],
      });

      const secondResult = await questRouteScopeBroker({ questId });
      const afterSecond = await quest.reload({ questId });
      const freshHappyWalk = afterSecond.workItems
        .filter((item) => item.id !== happyWalkItemId)
        .find((item) => item.id !== readItem.id);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        firstResult,
        readStep: readItem.step,
        readRole: readItem.role,
        readAssignedUnitIds: readItem.assignedUnitIds.map(String),
        readMintedBy: readItem.mintedBy,
        secondResult,
        freshHappyWalkStep: freshHappyWalk?.step,
        freshHappyWalkRole: freshHappyWalk?.role,
        freshHappyWalkStatus: freshHappyWalk?.status,
        freshHappyWalkAssignedUnitIds: freshHappyWalk?.assignedUnitIds.map(String).sort(),
        workItemCount: afterSecond.workItems.length,
      }).toStrictEqual({
        firstResult: { routed: true, blocked: false },
        readStep: 'read',
        readRole: 'siegemaster',
        readAssignedUnitIds: [],
        readMintedBy: happyWalkItemId,
        secondResult: { routed: true, blocked: false },
        freshHappyWalkStep: 'happyWalk',
        freshHappyWalkRole: 'siegemaster',
        freshHappyWalkStatus: 'pending',
        freshHappyWalkAssignedUnitIds: [UNIT_OBSERVABLE, UNIT_TERMINAL, ...OFF_MAP_UNITS].sort(),
        workItemCount: 3,
      });
    }, 30_000);
  });
});
