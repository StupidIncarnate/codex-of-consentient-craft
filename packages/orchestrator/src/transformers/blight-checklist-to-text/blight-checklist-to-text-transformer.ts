/**
 * PURPOSE: Renders one quest diff's blight checklist as compact text — a coverage header, a
 * concern legend, and every changed file collapsed under ONE heading, with its dispositioned and
 * still-remaining concerns split onto their own `[x]`/`[ ]` line
 *
 * USAGE:
 * blightChecklistToTextTransformer({ checklist });
 * // Returns ContentText — the body the get-blight-checklist MCP tool returns
 *
 * A unit's itemId is `<implPath>:<concern>` — never restated on its own line. Rendering it once
 * per unit, the way an earlier version of this transformer did, repeats a ~70-char impl path once
 * per concern crossing it (up to seven times per file); at real-quest scale (170 changed files,
 * 1,190 units) that alone measured 3x over `mcpToolResultStatics.maxVerbatimChars`. Grouping by
 * file so the path appears ONCE — in the `### {implPath}` heading — and reducing each unit to just
 * its concern name on a `[x]`/`[ ]` line is what brings that back under budget. Because the id can
 * no longer be read off its own line, the header states the grammar for reconstructing it
 * explicitly: heading path + concern name. blightwarden writes `itemId` into `blightLedger` and the
 * completion gate (`quest-handle-signal-back-responder`) matches on it exactly, so an agent that
 * cannot reconstruct the id correctly cannot disposition the unit the gate is waiting on.
 *
 * The legend exists to keep this affordable too. A concern is one or two sentences, and repeating
 * it against every file on a large diff would cost more than the units themselves; stated once per
 * concern actually present, the whole diff renders in a small fraction of what re-deriving the
 * same ask per file costs. The `paired:` file LIST is dropped in favor of a `(+N paired)` count on
 * the heading — the minions doing the actual review receive their real file lists in the parent's
 * brief, not from this checklist, so the list here was pure repetition with no reader.
 *
 * Even after compaction a pathological diff (thousands of changed files) could still overflow, so
 * `blightChecklistLimitsStatics.maxUnits` caps how many units this render shows, prioritizing
 * REMAINING units over already-dispositioned ones so a truncated render never hides the work an
 * agent still has to do. Truncating is SAFE, not just tolerable: the completion gate recomputes the
 * outstanding set server-side from the same build transformer this render is a view of, so a
 * truncated render can never produce a false `done` — it can only slow the agent down by forcing
 * another `get-blight-checklist` call once it has dispositioned what it can see.
 *
 * The `[x]`/`[ ]` column is the resume property made visible: a later session sees at a glance
 * what a predecessor actually landed on this diff, rather than reconstructing it from prose in a
 * commit body.
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type {
  BlightChecklist,
  BlightChecklistItem,
  ContentText,
} from '@dungeonmaster/shared/contracts';

import { blightChecklistLimitsStatics } from '../../statics/blight-checklist-limits/blight-checklist-limits-statics';
import { blightConcernLegendStatics } from '../../statics/blight-concern-legend/blight-concern-legend-statics';

export const blightChecklistToTextTransformer = ({
  checklist,
}: {
  checklist: BlightChecklist;
}): ContentText => {
  const remaining = new Set(checklist.remainingItemIds.map(String));

  const totalUnitCount = checklist.items.length;
  const truncated = totalUnitCount > blightChecklistLimitsStatics.maxUnits;

  const renderedItems = truncated
    ? [
        ...checklist.items.filter((item) => remaining.has(String(item.id))),
        ...checklist.items.filter((item) => !remaining.has(String(item.id))),
      ].slice(0, blightChecklistLimitsStatics.maxUnits)
    : checklist.items;

  const presentConcerns = [...new Set(checklist.items.map((item) => item.concern))];
  const uniqueImplPaths = new Set(checklist.items.map((item) => item.implPath));

  const groups = new Map<
    BlightChecklistItem['implPath'],
    { pairedFiles: BlightChecklistItem['pairedFiles']; items: BlightChecklistItem[] }
  >();
  renderedItems.forEach((item) => {
    const group = groups.get(item.implPath);
    if (group === undefined) {
      groups.set(item.implPath, { pairedFiles: item.pairedFiles, items: [item] });
    } else {
      group.items.push(item);
    }
  });

  const header = [
    `# BLIGHT CHECKLIST — diff from \`${String(checklist.baseRef)}\``,
    `Pairs: ${uniqueImplPaths.size} changed file(s)`,
    `Units: ${checklist.items.length} (file × concern crossings)`,
    `REMAINING (no disposition in quest.planningNotes.blightLedger): ${checklist.remainingItemIds.length} of ${checklist.items.length}`,
    '',
    "A unit's itemId is <implPath>:<concern> — the file heading plus the concern name.",
    '',
    'This list IS the definition of done for this diff — every file × concern crossing needs its',
    'own disposition, and the REMAINING count above decides the completion signal, not recollection.',
  ].join('\n');

  const concernLegend =
    presentConcerns.length === 0
      ? ''
      : [
          '',
          '## CONCERN LEGEND (concerns present on this diff)',
          ...presentConcerns.map(
            (concern) => `- ${concern} → ${blightConcernLegendStatics.byConcern[concern]}`,
          ),
        ].join('\n');

  const truncationNotice = truncated
    ? ` — TRUNCATED at the ${String(blightChecklistLimitsStatics.maxUnits)}-unit cap; showing REMAINING units first. This list is INCOMPLETE — call get-blight-checklist again after dispositioning these to see the rest.`
    : '';

  const unitBlock = [...groups.entries()]
    .map(([implPath, group]) => {
      const dispositioned = group.items.filter((item) => !remaining.has(String(item.id)));
      const stillRemaining = group.items.filter((item) => remaining.has(String(item.id)));
      return [
        '',
        `### ${String(implPath)}  (+${String(group.pairedFiles.length)} paired)`,
        ...(dispositioned.length === 0
          ? []
          : [`    [x] ${dispositioned.map((item) => item.concern).join(' ')}`]),
        ...(stillRemaining.length === 0
          ? []
          : [`    [ ] ${stillRemaining.map((item) => item.concern).join(' ')}`]),
      ].join('\n');
    })
    .join('\n');

  return contentTextContract.parse(
    [
      header,
      concernLegend,
      '',
      `## UNITS — [ ] no disposition yet, [x] already dispositioned in quest.planningNotes.blightLedger${truncationNotice}`,
      unitBlock,
    ].join('\n'),
  );
};
