/**
 * PURPOSE: Renders a quest's whole verification state as compact text — per-flow/per-track coverage,
 * the observables added after approval and by whom, every `unconfirmable` verdict with BOTH its
 * evidence and its question, and the side-channel notes grouped by kind with open questions first
 *
 * USAGE:
 * questSummaryToTextTransformer({ summary });
 * // Returns ContentText — the body the get-quest-summary MCP tool returns
 *
 * THE READER IS THE NEXT ROLE, not a dashboard. `QuestSummary` is a structure because the web
 * renders the same fields for a person, but an agent cannot act on a JSON dump of counts: it has to
 * decide what is still open and who to ask. So every section here is written as an instruction
 * rather than a label, and the `unconfirmable` block carries the whole sign-off — `evidence` (why
 * confirmation was out of reach), `question` (what someone has to answer to close it) and
 * `workItemId` (who to ask). That block IS the routing surface; dropping either field would reduce
 * it to a count of holes with no way to close one.
 *
 * EMPTY IS RENDERED, NEVER OMITTED. "No unconfirmable verdicts" and "nobody signed anything" are
 * opposite facts, and a section that vanished when empty would make them read identically — the
 * same reason `questSummaryNoteGroupContract` emits a group per kind including the empty ones.
 *
 * BOUNDED TWICE, AND NEVER SILENTLY. Every variable-length section is capped by
 * `questSummaryLimitsStatics` and states its exact dropped ENTRY count when a cap fires; the whole
 * render is then cut at `maxRenderChars` with its own stated dropped CHARACTER count. The second
 * bound is the one that holds — a per-section entry cap cannot promise a character total when the
 * entries carry author-written prose. See that statics file for the measurements behind both, and
 * for why truncating here cannot corrupt a completion decision.
 *
 * IT LIVES IN `@dungeonmaster/shared`, beside `questToTextDisplayTransformer` and the
 * `questSummaryContract` it renders, for the same reason the contract does: the MCP package serves
 * it to an agent and the web renders the same fields for a person, and the web depends on shared
 * alone. Reaching it through `@dungeonmaster/orchestrator` would also make it unrunnable in MCP's
 * own tests — `registerMock({ fn: StartOrchestrator.<x> })` resolves to a whole-module automock of
 * that barrel, so every other export of it, this renderer included, would answer `undefined`.
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { QuestSummary } from '../../contracts/quest-summary/quest-summary-contract';
import { questSummaryLimitsStatics } from '../../statics/quest-summary-limits/quest-summary-limits-statics';

export const questSummaryToTextTransformer = ({
  summary,
}: {
  summary: QuestSummary;
}): ContentText => {
  const flowsShown = summary.flows.slice(0, questSummaryLimitsStatics.maxFlows);
  const flowsDropped = summary.flows.length - flowsShown.length;
  const flowsNotice =
    flowsDropped === 0
      ? ''
      : ` — TRUNCATED at the ${String(questSummaryLimitsStatics.maxFlows)}-flow cap; ${String(flowsDropped)} flow(s) NOT SHOWN`;

  const observablesShown = summary.midQuestObservables.slice(
    0,
    questSummaryLimitsStatics.maxMidQuestObservables,
  );
  const observablesDropped = summary.midQuestObservables.length - observablesShown.length;
  const observablesNotice =
    observablesDropped === 0
      ? ''
      : ` — TRUNCATED at the ${String(questSummaryLimitsStatics.maxMidQuestObservables)}-entry cap; ${String(observablesDropped)} entry(s) NOT SHOWN`;

  const unconfirmableShown = summary.unconfirmable.slice(
    0,
    questSummaryLimitsStatics.maxUnconfirmable,
  );
  const unconfirmableDropped = summary.unconfirmable.length - unconfirmableShown.length;
  const unconfirmableNotice =
    unconfirmableDropped === 0
      ? ''
      : ` — TRUNCATED at the ${String(questSummaryLimitsStatics.maxUnconfirmable)}-entry cap; ${String(unconfirmableDropped)} entry(s) NOT SHOWN`;

  // Open questions lead. They are the only kind naming something NOBODY has answered, so a reader
  // deciding what to pick up needs them before the three record-keeping kinds.
  const orderedGroups = [
    ...summary.noteGroups.filter((group) => group.id === 'open-question'),
    ...summary.noteGroups.filter((group) => group.id !== 'open-question'),
  ];

  const header = [
    `# QUEST SUMMARY — \`${String(summary.questId)}\``,
    '',
    'What actually happened on this quest — which is not what `get-quest` or a status answers. A',
    'quest reaches `complete` when its operations ledger drains, not when its three verification',
    'tracks (codeweaver, flowrider, siegemaster) have SIGNED every unit, and',
    '`unconfirmable` signs a unit exactly as `confirmed` does: it clears the',
    'ABSENCE of a verdict, never demands an honest one. So a complete quest can still carry real holes,',
    'real scope nobody approved, and real unanswered questions. Every section below is one of those.',
  ].join('\n');

  const coverage = [
    '',
    `## COVERAGE — ${String(summary.flows.length)} flow(s), one row per track that measures each${flowsNotice}`,
    "`outstanding` is that track's work list — nothing refuses a `done` over it. A track ABSENT",
    'from a flow does not measure it at all, which is a different statement from measuring it and',
    'finding nothing.',
    ...(flowsShown.length === 0
      ? ['', '(no flows on this quest — nothing decomposes into verification units)']
      : flowsShown.map((flow) =>
          [
            '',
            `### \`${String(flow.id)}\` "${String(flow.name)}" [${flow.flowType}]`,
            ...(flow.tracks.length === 0
              ? ['    (no track measures this flow)']
              : flow.tracks.map(
                  (track) =>
                    `    ${track.id}: confirmed ${String(track.confirmed)} / unconfirmable ${String(track.unconfirmable)} / outstanding ${String(track.outstanding)}`,
                )),
          ].join('\n'),
        )),
  ].join('\n');

  const observables = [
    '',
    `## MID-QUEST OBSERVABLES (${String(summary.midQuestObservables.length)}) — added AFTER the user approved the spec${observablesNotice}`,
    'Scope the user never approved, and the role that wrote each one in.',
    ...(observablesShown.length === 0
      ? ['', '(none — every observable on this quest was in the spec at approval)']
      : observablesShown.map((observable) =>
          [
            '',
            `- added by ${observable.addedBy}: \`${String(observable.id)}\` [${observable.observableType}]`,
            `      on node \`${String(observable.nodeId)}\` of flow \`${String(observable.flowId)}\``,
            `      ${String(observable.description)}`,
          ].join('\n'),
        )),
  ].join('\n');

  const unconfirmable = [
    '',
    `## UNCONFIRMABLE (${String(summary.unconfirmable.length)}) — settled, NOT proven${unconfirmableNotice}`,
    'Every entry here settled a unit without proving it — this list is the only place it surfaces.',
    '`evidence` is why confirmation was out of reach, `toSettle` is the action that would close it,',
    'and the work item is who recorded it. Read this before deciding what is left to do.',
    ...(unconfirmableShown.length === 0
      ? ['', '(none — every signed unit on this quest was confirmed)']
      : unconfirmableShown.map((entry) =>
          [
            '',
            `### \`${String(entry.unitId)}\` [${entry.kind}] — could not be confirmed on the ${entry.track} track`,
            `      flow:     \`${String(entry.flowId)}\``,
            `      evidence: ${String(entry.signoff.evidence)}`,
            `      toSettle: ${entry.signoff.toSettle === undefined ? '(none recorded)' : String(entry.signoff.toSettle)}`,
            `      raised by work item ${String(entry.signoff.workItemId)} at ${String(entry.signoff.at)}`,
          ].join('\n'),
        )),
  ].join('\n');

  const notes = [
    '',
    `## NOTES — ${String(summary.noteGroups.length)} kind(s), open questions first`,
    "A note NEVER closes a verification unit; it is what a role learned that belongs to nobody's",
    'verdict. An EMPTY group means the quest recorded none of that kind, not that nobody looked.',
    ...(orderedGroups.length === 0
      ? ['', '(no note kinds recorded on this quest)']
      : orderedGroups.map((group) => {
          const notesShown = group.notes.slice(0, questSummaryLimitsStatics.maxNotesPerKind);
          const notesDropped = group.notes.length - notesShown.length;
          const notesNotice =
            notesDropped === 0
              ? ''
              : ` — TRUNCATED at the ${String(questSummaryLimitsStatics.maxNotesPerKind)}-note cap; ${String(notesDropped)} note(s) NOT SHOWN`;
          return [
            '',
            `### ${group.id} (${String(group.notes.length)})${notesNotice}`,
            ...(notesShown.length === 0
              ? ['    (none recorded)']
              : notesShown.map((note) =>
                  [
                    `- ${String(note.summary)}`,
                    `      ${String(note.detail)}`,
                    `      ${String(note.role)} · work item ${String(note.workItemId)} · ${String(note.at)}${note.flowId === undefined ? '' : ` · flow \`${String(note.flowId)}\``}${note.unitId === undefined ? '' : ` · unit \`${String(note.unitId)}\``}`,
                  ].join('\n'),
                )),
          ].join('\n');
        })),
  ].join('\n');

  const body = [header, coverage, observables, unconfirmable, notes].join('\n');

  if (body.length <= questSummaryLimitsStatics.maxRenderChars) {
    return contentTextContract.parse(body);
  }

  // The last resort, and the only bound that actually holds: the section caps count entries, and
  // entries carry author-written prose, so no count alone can promise a character total. Cut on a
  // line boundary — half an id or half a question reads as a rendering bug rather than a limit.
  const cut = body.slice(0, questSummaryLimitsStatics.maxRenderChars);
  const kept = cut.slice(0, cut.lastIndexOf('\n') + 1);

  return contentTextContract.parse(
    `${kept}\n[TRUNCATED at the ${String(questSummaryLimitsStatics.maxRenderChars)}-character ceiling — ${String(body.length - kept.length)} character(s) were dropped from the END of this render, so the sections after this line are missing or cut short. Sections run coverage, mid-quest observables, unconfirmable, notes; read quest.json for whatever fell off.]`,
  );
};
