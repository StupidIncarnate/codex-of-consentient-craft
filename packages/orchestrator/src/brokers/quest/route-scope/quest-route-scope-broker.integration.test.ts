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
    it("VALID: {a `ward` item drains unmet} => mints `repair` — a deterministic step carries no units, so this is a DECLARED forward route (question 4), never question 2's mark-mint, and the minted item carries no `mintedBy`", async () => {
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
        // The real, verified fact — see the NOTE 1 test below for the consequence.
        mintedMintedBy: minted?.mintedBy,
      }).toStrictEqual({
        result: { routed: true, blocked: false },
        operationStatus: 'in_progress',
        mintedStep: 'repair',
        mintedRole: 'codeweaver',
        mintedStatus: 'pending',
        mintedAssignedUnitIds: [],
        mintedPieceId: undefined,
        mintedMintedBy: undefined,
      });
    }, 30_000);
  });

  // NOTE 1, settled. `packages/orchestrator/CLAUDE.md`'s "Operations Ledger & Work Items" section
  // says an undeclared outcome "returns to the work item `mintedBy` names — as a FRESH work item at
  // that minter's step". `agentFlowStatics.codeweaver.steps.repair` (CLOSE_OUT.repair) declares no
  // `done` route on purpose, which only reads as safe if repair's own `done` is guaranteed to have a
  // minter to return to.
  //
  // It is not. `ward` is a `kind: 'deterministic'` step, so `stepEntryBatchTransformer` always mints
  // it — and every step reached FROM it — with `assignedUnitIds: []`. Question 2 ("does this step
  // have unmet UNITS") reads `terminalStepItems.flatMap(item => item.assignedUnitIds)`, which is
  // therefore always empty for `ward`, so `ward`'s `unmet` NEVER takes question 2's mark-mint branch
  // (the one that sets `mintedBy`) — it always takes question 4's plain DECLARED-route branch
  // (`node.routes.unmet = 'repair'`), whose mint goes through `stepEntryBatchTransformer`, which never
  // sets `mintedBy` in any of its branches (verified by reading every branch of
  // `step-entry-batch-transformer.ts`). The `ward — unmet mints repair` test above is the same fact,
  // verified against real disk: `mintedMintedBy: undefined`.
  //
  // So when that repair session finishes — reporting nothing, the way `spiritmender-prompt-statics.ts`
  // describes ("signal-back carries no per-outcome field... every path through this prompt ends in the
  // same [signal-back]") — `nextActionTransformer`'s Question 4 default kicks in
  // (`declaredWord ?? (role === 'planner' ... : 'done')`), folding repair's outcome to `done`. Repair's
  // routes declare no `done`, so the router falls into the "return to minter" branch — and finds none.
  // The quest BLOCKS with `reason: 'no-minter'`, not a fresh `ward` item. This test drives that exact
  // two-round sequence against real disk and is the verbatim evidence for the finding above.
  describe('NOTE 1 — a finished repair off a ward `unmet` route does not return to ward', () => {
    it("VALID: {a repair item minted off ward's `unmet` route drains with no declaredWord} => the router folds it to `done` (the no-units default), finds no `mintedBy` to return to, and BLOCKS the quest with reason `no-minter` — it does NOT mint a fresh `ward` item", async () => {
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
      const repairAfterSecond = afterSecond.workItems.find((item) => item.id === repairItem.id);

      await quest.afterEach();
      testbed.cleanup();

      expect({
        repairMintedBy: repairItem.mintedBy,
        secondResult,
        questStatus: afterSecond.status,
        operationStatus: afterSecond.operations.find((op) => String(op.id) === opId)?.status,
        repairStatusAfter: repairAfterSecond?.status,
        repairErrorMessage: repairAfterSecond?.errorMessage,
        // No THIRD work item appears — the router never reached a mint, only a block.
        workItemCount: afterSecond.workItems.length,
      }).toStrictEqual({
        repairMintedBy: undefined,
        secondResult: { routed: false, blocked: true },
        questStatus: 'blocked',
        // The ledger's scope status is untouched by a block — `questBlockOnFailureBroker` only
        // writes `quest.status` and the failed/skipped work items, never `quest.operations`.
        operationStatus: 'in_progress',
        repairStatusAfter: 'failed',
        repairErrorMessage:
          'step `repair` in family `codeweaver` folded to `done`, which it declares no route for, ' +
          'and the work item that recorded it names no minter to return to. An undeclared outcome ' +
          'returns to whoever minted the step; with neither a route nor a minter the scope has ' +
          'nowhere to go.',
        workItemCount: 2,
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
