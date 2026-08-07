/**
 * PURPOSE: Renders one flow's QA checklist as compact text — a coverage header, a check-surface
 * legend, the walk paths, and every unit marked `[ ]` outstanding or `[x]` settled on the calling
 * verification track
 *
 * USAGE:
 * qaChecklistToTextTransformer({ checklist, track: 'flowrider' });
 * // Returns ContentText — the body the get-qa-checklist MCP tool returns
 *
 * THE TRACK IS NAMED IN THE TEXT BECAUSE THE TWO TRACKS ARE MEASURED SEPARATELY. `flowriderSignoff`
 * and `siegemasterSignoff` are independent fields and neither settles the other, so a bare
 * "remaining" count would read as one shared number and let a session take a predecessor's column
 * for its own. When the caller named no track the wording stays deliberately unattributed rather
 * than guessing one.
 *
 * The legend exists to keep this affordable. A check surface is one or two sentences, and repeating
 * it against each of a 45-observable flow's units would cost more than the units themselves; stated
 * once per outcome type actually present, the whole flow renders in a small fraction of what
 * reading the spec for the same information costs. That difference is the point — a session that
 * would have spent most of its context enumerating the spec by hand reads this instead.
 *
 * The `[x]`/`[ ]` column is the resume property made visible: a later session sees at a glance what
 * a predecessor actually landed, rather than reconstructing it from prose in a commit body.
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText, QaChecklist, SignoffTrack } from '@dungeonmaster/shared/contracts';
import { qaCheckSurfaceStatics } from '@dungeonmaster/shared/statics';

export const qaChecklistToTextTransformer = ({
  checklist,
  track,
}: {
  checklist: QaChecklist;
  track?: SignoffTrack;
}): ContentText => {
  const remaining = new Set(checklist.remainingItemIds.map(String));
  const byKind = {
    terminal: checklist.items.filter((item) => item.kind === 'terminal'),
    branch: checklist.items.filter((item) => item.kind === 'branch'),
    observable: checklist.items.filter((item) => item.kind === 'observable'),
    'off-map': checklist.items.filter((item) => item.kind === 'off-map'),
  };

  const presentTypes = [
    ...new Set(
      byKind.observable
        .map((item) => item.observableType)
        .filter((type): type is NonNullable<typeof type> => type !== undefined),
    ),
  ];

  const remainingCaption =
    track === undefined
      ? 'no sign-off yet on the track you are signing'
      : `awaiting your \`${track}Signoff\``;
  const unitsCaption =
    track === undefined
      ? '## UNITS — [ ] outstanding on your track, [x] already settled on it'
      : `## UNITS — [ ] awaiting your \`${track}Signoff\`, [x] already settled on the ${track} track`;

  const header = [
    `# QA CHECKLIST — flow \`${String(checklist.flowId)}\` "${String(checklist.flowName)}"`,
    `Entry point: ${String(checklist.entryPoint)}`,
    `Units: ${checklist.items.length} (${byKind.terminal.length} terminal, ${byKind.branch.length} branch, ${byKind.observable.length} observable, ${byKind['off-map'].length} off-map)`,
    `REMAINING (${remainingCaption}): ${checklist.remainingItemIds.length} of ${checklist.items.length}`,
    '',
    'This list IS the definition of done for this flow. Paths are the itinerary; units are the',
    'coverage. A flow can be two paths carrying twenty observables, so walking every path proves',
    'nothing on its own.',
    'The two tracks are measured separately: your sign-off field is the only one counted here, and',
    "the other track's sign-off on a unit never settles yours. Both verdicts close a unit —",
    '`confirmed` with evidence, or `unconfirmable` with what you tried plus a `question`.',
  ].join('\n');

  const surfaceLegend =
    presentTypes.length === 0
      ? ''
      : [
          '',
          '## CHECK SURFACES (observable types present on this flow)',
          ...presentTypes.map((type) => `- ${type} → ${qaCheckSurfaceStatics.byOutcomeType[type]}`),
        ].join('\n');

  const kindSurfaces = [
    '',
    '## TERMINAL SURFACE',
    qaCheckSurfaceStatics.byKind.terminal,
    '',
    '## BRANCH SURFACE',
    qaCheckSurfaceStatics.byKind.branch,
    '',
    '## OFF-MAP SURFACE',
    qaCheckSurfaceStatics.byKind['off-map'],
  ].join('\n');

  const paths = [
    '',
    `## WALK PATHS (${checklist.paths.length})${checklist.pathsTruncated ? ' — TRUNCATED at the enumeration cap; this list is INCOMPLETE' : ''}`,
    ...checklist.paths.map((path, index) => {
      const route = path.nodeIds.map(String).join(' → ');
      const branches =
        path.branchLabels.length === 0
          ? ''
          : `\n     force: ${path.branchLabels.map((label) => `"${String(label)}"`).join(' , ')}`;
      const exit = path.exitsFlow ? '\n     (leaves this flow at the last node)' : '';
      return `P${index + 1}  ${route}${branches}${exit}`;
    }),
  ].join('\n');

  const unitBlock = (
    [
      ['TERMINALS', byKind.terminal],
      ['BRANCHES', byKind.branch],
      ['OBSERVABLES', byKind.observable],
      ['OFF-MAP PROBES', byKind['off-map']],
    ] as const
  )
    .map(([title, items]) =>
      [
        '',
        `### ${title} (${items.length})`,
        ...items.map((item) => {
          const mark = remaining.has(String(item.id)) ? '[ ]' : '[x]';
          const type = item.observableType === undefined ? '' : `  [${item.observableType}]`;
          return `${mark} ${String(item.id)}${type}\n    ${String(item.label)}`;
        }),
      ].join('\n'),
    )
    .join('\n');

  return contentTextContract.parse(
    [header, surfaceLegend, kindSurfaces, paths, '', unitsCaption, unitBlock].join('\n'),
  );
};
