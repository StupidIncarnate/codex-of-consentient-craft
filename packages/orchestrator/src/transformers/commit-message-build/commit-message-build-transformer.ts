/**
 * PURPOSE: Renders a deterministic `commit` step's message from the work items it covers — no
 * prose, because every line is a value read off the record rather than a claim a session made
 * about itself. `met` entries share one line (they carry no per-unit reason); `cant-meet` and
 * `unmet` each get one line per unit, because each carries its own `toSettle`/`evidence` text.
 * Where the covered work items carry no observations at all (a `repair`'s own commit, or any
 * review-only pass), the body skips straight to the `work items:` line.
 *
 * USAGE:
 * commitMessageBuildTransformer({
 *   family: 'codeweaver',
 *   step: 'commit',
 *   scope: 'add-auth — package: auth · flow: login-flow',
 *   workItems: [{ id: workItemId, observations: [metObservation, cantMeetObservation] }],
 * });
 * // Returns:
 * // "codeweaver/commit: add-auth — package: auth · flow: login-flow\n\n
 * //  met       login-flow:observable:check-token-stored\n
 * //  cant-meet login-flow:observable:check-redirect — needs a live OAuth provider in CI\n
 * //  work items: <workItemId>"
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type {
  ContentText,
  QuestWorkItemId,
  StepName,
  UnitObservation,
  WorkItemRole,
} from '@dungeonmaster/shared/contracts';

// Every label padded to the width of the longest one (`cant-meet` + 1 space = 10), so the three
// value columns line up.
const LABEL_COLUMN_WIDTH = 10;
const UNIT_ID_SEPARATOR = ' · ';

export const commitMessageBuildTransformer = ({
  family,
  step,
  scope,
  workItems,
}: {
  family: WorkItemRole;
  step: StepName;
  scope: ContentText;
  workItems: readonly { id: QuestWorkItemId; observations: readonly UnitObservation[] }[];
}): ContentText => {
  const subject = `${family}/${step}: ${scope}`;

  const allObservations = workItems.flatMap((workItem) => workItem.observations);
  const met = allObservations.filter((observation) => observation.mark === 'met');
  const cantMeet = allObservations.filter((observation) => observation.mark === 'cant-meet');
  const unmet = allObservations.filter((observation) => observation.mark === 'unmet');

  const markLines = [
    ...(met.length > 0
      ? [
          `${'met'.padEnd(LABEL_COLUMN_WIDTH)}${met
            .map((observation) => observation.unitId)
            .join(UNIT_ID_SEPARATOR)}`,
        ]
      : []),
    ...cantMeet.map(
      // `toSettle` types as optional on the shared contract, but every `cant-meet` observation
      // carries one — `unitObservationContract`'s own refinement requires it. `String()` here
      // converts the (unreachable) `undefined` case to text instead of printing it raw.
      (observation) =>
        `${'cant-meet'.padEnd(LABEL_COLUMN_WIDTH)}${observation.unitId} — ${String(observation.toSettle)}`,
    ),
    ...unmet.map(
      (observation) =>
        `${'unmet'.padEnd(LABEL_COLUMN_WIDTH)}${observation.unitId} — ${observation.evidence}`,
    ),
  ];

  const workItemsLine = `work items: ${workItems
    .map((workItem) => workItem.id)
    .join(UNIT_ID_SEPARATOR)}`;

  const body = [...markLines, workItemsLine].join('\n');

  return contentTextContract.parse(`${subject}\n\n${body}`);
};
