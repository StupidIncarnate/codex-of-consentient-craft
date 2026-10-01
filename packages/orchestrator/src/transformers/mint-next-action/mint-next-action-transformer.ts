/**
 * PURPOSE: Applies the two rules every mint shares to a batch the router has already decided on, and
 * returns the `NextAction` that survives them — the mint or route itself, a `capped` come-back, or a
 * `no-progress` block. Reach for this rather than parsing a `NextAction` by hand: a mint path that
 * skipped either rule would loop a gate forever or overload the machine with nothing reporting it.
 *
 * USAGE:
 * mintNextActionTransformer({
 *   quest, operationItemId, family: 'codeweaver', step: 'repair',
 *   batch, cause: 'plan-batch', requiresProgress: true, headSha, maxConcurrent: undefined,
 * });
 * // Returns: NextAction — a `mint`, or a `route` when `from` and `outcome` are both given
 *
 * THERE IS NO VISIT BUDGET. A step mints as many times as its work needs. The one loop that can spin
 * with nothing changing is a gate and its `repair`, so a `requiresProgress` step is minted again only
 * once the scope's latest item at that step has moved the worktree's HEAD past the `startRef` it
 * began at. Equal means that repair committed nothing; the next session would read the same red, so
 * the answer is `no-progress` for a human. An unknown `headSha` (no worktree, an unreadable HEAD) or
 * a latest item with no `startRef` (it never fetched its prompt) skips the check rather than block on
 * what cannot be measured.
 *
 * `maxConcurrent` IS THE ROUTER'S CAP, NOT THE PLAN'S, because a mark-minted piece is by definition
 * not in the plan: three walkers marking `unmet` mint three fixers outside any declared batch, and
 * nothing a planner wrote bounds that. The `counts` half matters — the same step runs below-browser
 * pieces that cost nothing and must not eat the cap. Nothing fitting is `capped`, never `block`: the
 * cap clears on its own the moment a walk records.
 */

import type { Quest, OperationItem } from '@dungeonmaster/shared/contracts';
import { isTerminalWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import type { MintedWorkItem } from '../../contracts/minted-work-item/minted-work-item-contract';
import { nextActionContract } from '../../contracts/next-action/next-action-contract';
import type { NextAction } from '../../contracts/next-action/next-action-contract';
import type { StepOutcome } from '../../contracts/step-outcome/step-outcome-contract';
import { workItemAssignmentContract } from '../../contracts/work-item-assignment/work-item-assignment-contract';

export const mintNextActionTransformer = ({
  quest,
  operationItemId,
  family,
  step,
  batch,
  cause,
  requiresProgress,
  headSha,
  maxConcurrent,
  from,
  outcome,
}: {
  quest: Quest;
  operationItemId: OperationItem['id'];
  family: string;
  step: string;
  batch: readonly MintedWorkItem[];
  cause: Extract<NextAction, { kind: 'mint' }>['cause'];
  requiresProgress: boolean;
  headSha: string | undefined;
  // REQUIRED and nullable rather than optional: every caller reads it straight off the step node,
  // where absent is the common case, and an optional parameter would put a ternary on every one of
  // those call sites for a value the step already spells.
  maxConcurrent: { limit: number; counts: string } | undefined;
  from?: string;
  outcome?: StepOutcome;
}): NextAction => {
  const scopeRef = `operations/${String(operationItemId)}`;
  const scopeItems = quest.workItems.filter((item) =>
    item.relatedDataItems.some((ref) => String(ref) === scopeRef),
  );
  const previousAttempt = scopeItems
    .filter((item) => item.step !== undefined && String(item.step) === step)
    .at(-1);

  if (
    requiresProgress &&
    headSha !== undefined &&
    previousAttempt?.startRef !== undefined &&
    String(previousAttempt.startRef) === headSha
  ) {
    return nextActionContract.parse({
      kind: 'block',
      operationItemId,
      family,
      step,
      reason: 'no-progress',
      message:
        `no progress: the last \`${step}\` in family \`${family}\` for operation item ` +
        `${String(operationItemId)} (work item ${String(previousAttempt.id)}) committed nothing — the ` +
        `worktree HEAD is still ${headSha}, where it started — and its gate went red again. Another ` +
        `session would read the same failure, so the quest halts for a human.`,
    });
  }

  const liveBrowserPieces = scopeItems.filter((item) => {
    if (isTerminalWorkItemStatusGuard({ status: item.status })) {
      return false;
    }

    if (item.step === undefined || String(item.step) !== step) {
      return false;
    }

    const assignment = workItemAssignmentContract.safeParse(item.payload);

    return (
      assignment.success && assignment.data.units.some((unit) => String(unit.layer) === 'browser')
    );
  }).length;

  const browserFlags = batch.map((minted) => {
    const assignment = workItemAssignmentContract.safeParse(minted.payload);

    return (
      assignment.success && assignment.data.units.some((unit) => String(unit.layer) === 'browser')
    );
  });

  const browserLimit =
    maxConcurrent === undefined || maxConcurrent.counts !== 'browser-pieces'
      ? null
      : maxConcurrent.limit;

  const allowed = batch.flatMap((minted, index) => {
    if (browserLimit === null || browserFlags[index] !== true) {
      return [minted];
    }

    const ahead = browserFlags.slice(0, index).filter((flag) => flag).length;

    return liveBrowserPieces + ahead < browserLimit ? [minted] : [];
  });

  if (allowed.length === 0) {
    return nextActionContract.parse({
      kind: 'mint',
      operationItemId,
      step,
      cause: 'capped',
      batch: [],
    });
  }

  if (from !== undefined && outcome !== undefined) {
    return nextActionContract.parse({
      kind: 'route',
      operationItemId,
      from,
      outcome,
      step,
      batch: allowed,
    });
  }

  return nextActionContract.parse({
    kind: 'mint',
    operationItemId,
    step,
    cause,
    batch: allowed,
  });
};
