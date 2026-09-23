/**
 * PURPOSE: Spends a step's budgets on a batch the router has already decided to mint, and returns the
 * `NextAction` that survives them — the mint or route itself, a `capped` come-back, or a `max-visits`
 * block. Reach for this rather than parsing a `NextAction` by hand: every mint path shares these
 * three rules, and a path that skipped one would overspend a budget with nothing reporting it.
 *
 * USAGE:
 * mintNextActionTransformer({
 *   quest, operationItemId, family: 'flowrider', step: 'work',
 *   batch, cause: 'plan-batch', maxVisits: 40, invalidatedUnitIds: [],
 * });
 * // Returns: NextAction — a `mint`, or a `route` when `from` and `outcome` are both given
 *
 * `maxVisits` IS COUNTED OFF THE LEDGER, OVER EVERY STATUS, and no counter field exists or is to be
 * added. A visit that crashed still burned a dispatch, so a `pending`, an `in_progress` and a
 * `failed` item at that step each count exactly as a completed one does. `retryCount` is orphan
 * recovery's budget and a crash-resumed session is the SAME visit; `attempt` / `maxAttempts` are
 * written once at mint and never read back. A counter field is a second source of truth that a
 * crash, a replay or a hand-edited `quest.json` desyncs from the record it claims to summarise.
 *
 * THE CHECK RUNS BEFORE THE MINT, over `visits + batch.length`, so a parallel batch cannot step over
 * the ceiling one item at a time.
 *
 * `maxConcurrent` IS THE ROUTER'S CAP, NOT THE PLAN'S, because a mark-minted piece is by definition
 * not in the plan: three walkers marking `unmet` mint three fixers outside any declared batch, and
 * nothing a planner wrote bounds that. The `counts` half matters — the same step runs below-browser
 * pieces that cost nothing and must not eat the cap. Nothing fitting is `capped`, never `block`: the
 * cap clears on its own the moment a walk records.
 *
 * AN INVALIDATION EDITS NOTHING. The re-opened units are UNIONED onto the first item this mints; no
 * existing observation is touched and no mark is cleared. The re-opening falls out of the committed
 * current-mark rule alone, since the item minted here becomes the most recent one assigned those
 * units and its absent mark is then the state.
 */

import type { OperationItemId, Quest, StepName, UnitId } from '@dungeonmaster/shared/contracts';
import { isTerminalWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import { mintedWorkItemContract } from '../../contracts/minted-work-item/minted-work-item-contract';
import type { MintedWorkItem } from '../../contracts/minted-work-item/minted-work-item-contract';
import { nextActionContract } from '../../contracts/next-action/next-action-contract';
import type { NextAction } from '../../contracts/next-action/next-action-contract';
import type { StepOutcome } from '../../contracts/step-outcome/step-outcome-contract';
import { workItemAssignmentContract } from '../../contracts/work-item-assignment/work-item-assignment-contract';
import { routerBlockMessageStatics } from '../../statics/router-block-message/router-block-message-statics';

export const mintNextActionTransformer = ({
  quest,
  operationItemId,
  family,
  step,
  batch,
  cause,
  maxVisits,
  maxConcurrent,
  invalidatedUnitIds,
  from,
  outcome,
}: {
  quest: Quest;
  operationItemId: OperationItemId;
  family: string;
  step: StepName;
  batch: readonly MintedWorkItem[];
  cause: Extract<NextAction, { kind: 'mint' }>['cause'];
  maxVisits: number;
  // REQUIRED and nullable rather than optional: every caller reads it straight off the step node,
  // where absent is the common case, and an optional parameter would put a ternary on every one of
  // those call sites for a value the step already spells.
  maxConcurrent: { limit: number; counts: string } | undefined;
  invalidatedUnitIds: readonly UnitId[];
  from?: StepName;
  outcome?: StepOutcome;
}): NextAction => {
  const scopeRef = `operations/${String(operationItemId)}`;
  const scopeItems = quest.workItems.filter((item) =>
    item.relatedDataItems.some((ref) => String(ref) === scopeRef),
  );
  const visits = scopeItems.filter(
    (item) => item.step !== undefined && String(item.step) === String(step),
  ).length;

  if (visits + batch.length > maxVisits) {
    const stillUnmet = [
      ...new Set(batch.flatMap((minted) => minted.assignedUnitIds.map(String))),
    ].slice(0, routerBlockMessageStatics.limits.maxUnitIds);

    return nextActionContract.parse({
      kind: 'block',
      operationItemId,
      family,
      step,
      reason: 'max-visits',
      message:
        `maxVisits spent: step \`${String(step)}\` in family \`${family}\` has been entered ` +
        `${String(visits)} times for operation item ${String(operationItemId)}, and its whole ` +
        `budget is ${String(maxVisits)} — the loop is not converging and another session would ` +
        `find the same thing. Still unmet: ${stillUnmet.length === 0 ? 'none' : stillUnmet.join(', ')}.`,
    });
  }

  const liveBrowserPieces = scopeItems.filter((item) => {
    if (isTerminalWorkItemStatusGuard({ status: item.status })) {
      return false;
    }

    if (item.step === undefined || String(item.step) !== String(step)) {
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

  const withInvalidation =
    invalidatedUnitIds.length === 0
      ? allowed
      : allowed.map((minted, index) =>
          index === 0
            ? mintedWorkItemContract.parse({
                ...minted,
                assignedUnitIds: [
                  ...new Set([
                    ...minted.assignedUnitIds.map(String),
                    ...invalidatedUnitIds.map(String),
                  ]),
                ],
              })
            : minted,
        );

  if (from !== undefined && outcome !== undefined) {
    return nextActionContract.parse({
      kind: 'route',
      operationItemId,
      from,
      outcome,
      step,
      batch: withInvalidation,
    });
  }

  return nextActionContract.parse({
    kind: 'mint',
    operationItemId,
    step,
    cause,
    batch: withInvalidation,
  });
};
