/**
 * PURPOSE: Renders ONE operation item's whole plan as the markdown a planner reviews before signing
 * it — the batches in the order they will execute, each piece with the units it claims and whatever
 * the record already says about them, and the COVERAGE table. Reach for this over serving the plan
 * as JSON: the two things a reviewer most needs are the ones JSON cannot show. A unit claimed by NO
 * piece is an ABSENCE, and an absence is invisible in an object by construction; and the execution
 * order is a property of nested `mode` fields the reader would otherwise have to simulate.
 *
 * USAGE:
 * workPlanToTextTransformer({ operationItem, plan, inScopeUnits });
 * // Returns ContentText — headings per batch, one row per piece, then the coverage table
 *
 * IT SITS BESIDE `qaChecklistToTextTransformer`, `blightChecklistToTextTransformer` and
 * `flowGraphToTextTransformer` rather than replacing any of them: those render the SPEC surface a
 * verification session measures against, and this renders the PLAN a session was going to run.
 *
 * A SCOPE WITH NO PLAN RENDERS AS A SENTENCE SAYING SO, never as an empty document. "No planner has
 * run against this item yet" is a real state a reviewer acts on; a blank page reads as a failed
 * fetch.
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText, OperationItem, PieceId, UnitId } from '@dungeonmaster/shared/contracts';

import type { QuestWorkUnit } from '../../contracts/quest-work-view/quest-work-view-contract';
import type { WorkPlan } from '../../contracts/work-plan/work-plan-contract';

const UNCLAIMED = '— NO PIECE CLAIMS THIS UNIT —';
const OUTSTANDING = 'outstanding';

export const workPlanToTextTransformer = ({
  operationItem,
  plan,
  inScopeUnits,
}: {
  operationItem: OperationItem;
  plan: WorkPlan | null;
  inScopeUnits: readonly QuestWorkUnit[];
}): ContentText => {
  const header = [
    `# Plan for operation item ${String(operationItem.id)}`,
    '',
    String(operationItem.text),
    '',
  ];

  if (plan === null) {
    return contentTextContract.parse(
      [
        ...header,
        'No planner has run against this item yet, so there is no plan to review. That is a real',
        'state, not an error — the scope is waiting on its `plan` step.',
        '',
      ].join('\n'),
    );
  }

  // The claim index is built ONCE and read by both halves below, so the piece rows and the coverage
  // table cannot disagree about who claims what.
  const claimedBy = new Map<UnitId, PieceId[]>();

  plan.batches.forEach((batch) => {
    batch.pieces.forEach((piece) => {
      piece.assignedUnitIds.forEach((unitId) => {
        const existing = claimedBy.get(unitId) ?? [];
        claimedBy.set(unitId, [...existing, piece.id]);
      });
    });
  });

  const marksByUnitId = new Map(inScopeUnits.map((unit) => [unit.unitId, unit]));
  const plannerMarked = new Set(plan.plannerMarks.map((mark) => mark.unitId));

  const batchBlocks = plan.batches.flatMap((batch, batchIndex) => [
    `## Batch ${String(batchIndex + 1)} — ${batch.mode}`,
    batch.mode === 'parallel'
      ? 'Every piece below runs at the same time. Nothing here may depend on anything else here.'
      : 'Each piece below runs only once the one above it has drained.',
    '',
    ...batch.pieces.flatMap((piece) => [
      `### ${String(piece.id)} — step \`${String(piece.step)}\``,
      String(piece.context),
      ...(piece.recipeId === undefined ? [] : [`Recipe: \`${String(piece.recipeId)}\``]),
      ...(piece.baselineFor === undefined
        ? []
        : [`Baseline: measures against piece \`${String(piece.baselineFor)}\``]),
      ...piece.notes.map((note) => `- note: ${String(note)}`),
      '',
      ...(piece.assignedUnitIds.length === 0
        ? ['Claims no unit — a contracts-only piece proves nothing itself.']
        : piece.assignedUnitIds.map((unitId) => {
            const unit = marksByUnitId.get(unitId);
            const text = unit === undefined ? 'not in this item’s in-scope set' : String(unit.text);

            return `- [${unit?.mark ?? OUTSTANDING}] \`${String(unitId)}\` — ${text}`;
          })),
      ...(piece.contextUnitIds.length === 0
        ? []
        : [
            '',
            'Reads but may not mark:',
            ...piece.contextUnitIds.map((unitId) => `- \`${String(unitId)}\``),
          ]),
      '',
    ]),
  ]);

  // COVERAGE IS THE HALF A JSON PLAN CANNOT SHOW. Every in-scope unit gets a row whether or not a
  // piece claims it, so the hole a planner most needs to see is the one row that says so.
  const coverageRows = inScopeUnits.map((unit) => {
    const claims = claimedBy.get(unit.unitId) ?? [];
    const claimText = claims.map((pieceId) => `\`${String(pieceId)}\``).join(', ');
    const unclaimedText = plannerMarked.has(unit.unitId)
      ? 'planner recorded it as `cant-meet`'
      : UNCLAIMED;
    const owner = claimText.length > 0 ? claimText : unclaimedText;

    return `| \`${String(unit.unitId)}\` | ${unit.mark ?? OUTSTANDING} | ${owner} |`;
  });

  const unclaimedCount = inScopeUnits.filter(
    (unit) => (claimedBy.get(unit.unitId) ?? []).length === 0 && !plannerMarked.has(unit.unitId),
  ).length;

  const flowText = plan.flowId === null ? 'none (contracts-only cell)' : String(plan.flowId);

  return contentTextContract.parse(
    [
      ...header,
      `Family: ${plan.family} · flow: ${flowText}`,
      `Written by work item ${String(plan.writtenBy)} at ${String(plan.writtenAt)}`,
      '',
      ...batchBlocks,
      '## Coverage',
      '',
      `${String(unclaimedCount)} of ${String(inScopeUnits.length)} in-scope units are claimed by no piece.`,
      '',
      '| unit | mark | claimed by |',
      '| --- | --- | --- |',
      ...coverageRows,
      '',
    ].join('\n'),
  );
};
