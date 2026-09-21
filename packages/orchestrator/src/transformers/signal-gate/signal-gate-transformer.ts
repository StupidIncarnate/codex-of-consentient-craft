/**
 * PURPOSE: The deterministic answer to "may this step signal at all?" — a session that says it is
 * finished while an assigned unit carries no observation is refused at the tool boundary, before
 * routing is consulted. Reach for this over `deriveOutcomeTransformer` when the question is whether
 * the signal is ALLOWED; that sibling answers which word the record derives to once it is, and it
 * never blocks the call.
 *
 * USAGE:
 * signalGateTransformer({ quest, workItemId });
 * // Returns { ok: true }, or { ok: false, unmarked, message } carrying the refusal verbatim
 *
 * THE WHOLE COMPUTATION IS ONE FILTER over `assignedUnitIds` against `observations[].unitId`, and
 * `role` is deliberately not read anywhere in this file. Every case falls out of that arithmetic: an
 * ordinary planner is assigned nothing so nothing is unmarked; a siege planner whose `plannerMarks`
 * were accepted carries those units on BOTH lists, so nothing is unmarked; and a planner that somehow
 * got units is refused exactly like a worker, which is the point of not special-casing.
 *
 * A MARK'S VALUE IS IRRELEVANT. `met`, `cant-meet` and `unmet` all count as marked — only the absence
 * of an entry counts. `cant-meet` is the one people get wrong: it SETTLES the unit.
 *
 * THE MESSAGE IS THE DELIVERABLE, not a diagnostic. The session has to act on it in the same turn,
 * so the rows name each unit AND quote its text — a bare "you have unmarked units" spends a round
 * trip re-fetching a work definition the refusal could have carried. The last two lines are
 * unconditional for the same reason: the failure this gate invites is a session padding marks to get
 * past it, and telling it at the moment it is blocked that `unmet` is free and mints its successor is
 * the cheapest place to prevent that.
 *
 * AN ASSIGNED ID THE ENUMERATION DOES NOT PRODUCE IS STILL REFUSED, with an empty text column. A
 * unit whose node was deleted mid-quest is a real state, and dropping the row would let the session
 * signal with it unmarked.
 */

import { qaOffMapProbeStatics } from '@dungeonmaster/shared/statics';
import type { Quest, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

import { signalGateResultContract } from '../../contracts/signal-gate-result/signal-gate-result-contract';
import type { SignalGateResult } from '../../contracts/signal-gate-result/signal-gate-result-contract';
import { qaUnitEnumerateTransformer } from '../qa-unit-enumerate/qa-unit-enumerate-transformer';

// How many unmarked units to name inline before deferring to the tool that lists the rest. Enough to
// act on directly for a nearly-finished step, short of dumping 144 rows into a tool error.
const ROW_LIMIT = 15;

// Blank columns between the widest id in THIS message and the text column, so the ids read as a
// column rather than as prose.
const ID_COLUMN_GAP = 3;

// A row is one line in a tool error. Past this the text stops being scannable and starts pushing the
// closing instructions off the reader's attention.
const TEXT_LIMIT = 80;

export const signalGateTransformer = ({
  quest,
  workItemId,
}: {
  quest: Quest;
  workItemId: QuestWorkItemId;
}): SignalGateResult => {
  // An absent work item is a caller bug, and `{ ok: true }` for it is indistinguishable from a step
  // with nothing assigned — the reading that turns the gate off silently.
  const workItem = quest.workItems.find((item) => item.id === workItemId);

  if (workItem === undefined) {
    throw new Error(
      `signalGateTransformer: quest '${String(quest.id)}' holds no work item '${String(workItemId)}'`,
    );
  }

  const markedUnitIds = new Set(
    workItem.observations.map((observation) => String(observation.unitId)),
  );
  const unmarked = workItem.assignedUnitIds.filter((unitId) => !markedUnitIds.has(String(unitId)));

  if (unmarked.length === 0) {
    return signalGateResultContract.parse({ ok: true });
  }

  const unitById = new Map(
    quest.flows
      .flatMap((flow) => qaUnitEnumerateTransformer({ flow }))
      .map((unit) => [String(unit.id), unit] as const),
  );

  const previewIds = unmarked.slice(0, ROW_LIMIT).map((unitId) => String(unitId));
  const idColumnWidth = Math.max(...previewIds.map((unitId) => unitId.length)) + ID_COLUMN_GAP;

  const rows = previewIds.map((unitId) => {
    const unit = unitById.get(unitId);
    const text =
      unit === undefined
        ? ''
        : unit.kind === 'observable'
          ? String(unit.observableDescription)
          : unit.kind === 'terminal'
            ? String(unit.nodeLabel)
            : unit.kind === 'branch'
              ? String(unit.edgeLabel)
              : qaOffMapProbeStatics.byFamily[unit.offMapFamily];
    const shown = text.length > TEXT_LIMIT ? `${text.slice(0, TEXT_LIMIT)} …` : text;

    return `  ${unitId.padEnd(idColumnWidth)}${shown}`;
  });

  const overflow =
    unmarked.length > ROW_LIMIT
      ? [
          `  … and ${String(unmarked.length - ROW_LIMIT)} more — call get-quest-work({ questId, workItemId }) for the full set.`,
        ]
      : [];

  return signalGateResultContract.parse({
    ok: false,
    unmarked,
    message: [
      `REFUSED: ${String(unmarked.length)} of your ${String(workItem.assignedUnitIds.length)} assigned units are unmarked.`,
      '',
      ...rows,
      ...overflow,
      '',
      'Mark each one `met`, `cant-meet` or `unmet` through quest-work, then signal again.',
      '`unmet` is not failure and costs nothing — it mints your successor on exactly these.',
    ].join('\n'),
  });
};
