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
 *
 * A UNIT THE CALLING TRACK CANNOT SIGN IS OMITTED, NOT MARKED. Two of the six exclusions in
 * `signoffTrackEligibilityStatics` are computable here, because this file holds the items and the
 * track: `unitKinds` (off-map is siegemaster's alone) and `verificationMethods` (a `verifyByReading`
 * observable is codeweaver's alone). Both are filtered out of the rows, the surfaces and the
 * DENOMINATOR — a session that reads `58 of 67` is measuring itself against nine units no session of
 * its role can ever close, and a planner reading a settled-looking mark beside the seven off-map
 * families concludes this quest's only security and performance coverage is done.
 *
 * THE OTHER EXCLUSIONS STILL LAND IN `[x]`, which is why the caption says what `[x]` does and does
 * not mean. Package kind, flow type and provenance are properties of a unit's owning node or its
 * `addedBy`, and this file holds neither — so `[x]` means "signed on your track, or not yours by one
 * of those", and never "somebody already proved this the way you would have".
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText, QaChecklist, QaChecklistItem } from '@dungeonmaster/shared/contracts';
import { qaCheckSurfaceStatics, textDisplaySymbolsStatics } from '@dungeonmaster/shared/statics';

import { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';

export const qaChecklistToTextTransformer = ({
  checklist,
  track,
}: {
  checklist: QaChecklist;
  // The DENOMINATOR track, not the sign-off FIELD. A denominator that shares another's field is
  // representable, so the caption below names the field it LOOKS UP rather than the track it was
  // handed — which is what stops it telling a session to write a column no contract carries.
  track?: keyof typeof signoffTrackEligibilityStatics.byTrack;
}): ContentText => {
  const remaining = new Set(checklist.remainingItemIds.map(String));
  // Annotated rather than inferred: `byTrack[track]` with a union `track` yields a UNION of readonly
  // tuples, and `.includes` is generic in its element type, so TS rejects the call as having no
  // signature compatible across the members. Widening to the item's own `kind` union — never to
  // `string` — collapses that to one array type while keeping every member assignable.
  const trackUnitKinds: readonly QaChecklistItem['kind'][] | undefined =
    track === undefined ? undefined : signoffTrackEligibilityStatics.byTrack[track].unitKinds;

  const trackMethods: readonly ('test' | 'reading')[] | undefined =
    track === undefined
      ? undefined
      : signoffTrackEligibilityStatics.byTrack[track].verificationMethods;

  // A UNIT THIS TRACK CANNOT SIGN IS NOT ON ITS LIST AT ALL — not as a row, not as a surface, not in
  // its denominator. Two exclusions bite, and both are read from `signoffTrackEligibilityStatics`
  // rather than branched on a role name here:
  //
  // - KIND. Only siegemaster carries `off-map`, so a flowrider checklist printing the seven probe
  //   families spends a heading, seven rows and a surface paragraph on work that track cannot take.
  // - VERIFICATION METHOD. A `verifyByReading` observable is settled by opening a source file, which
  //   only codeweaver's track does; flowrider and siegemaster carry `test` alone.
  //
  // Both inflate the denominator a session reads its own progress against, which is the cost that
  // matters — a flowrider seeing `58 of 67` is measuring itself against nine units it can never
  // reach, and the nine are invisible as such once they scroll past their legend.
  const items = checklist.items.filter(
    (item) =>
      (trackUnitKinds === undefined || trackUnitKinds.includes(item.kind)) &&
      (trackMethods === undefined ||
        trackMethods.includes(item.verifyByReading === true ? 'reading' : 'test')),
  );
  const byKind = {
    terminal: items.filter((item) => item.kind === 'terminal'),
    branch: items.filter((item) => item.kind === 'branch'),
    observable: items.filter((item) => item.kind === 'observable'),
    'off-map': items.filter((item) => item.kind === 'off-map'),
  };
  const remainingCount = items.filter((item) => remaining.has(String(item.id))).length;

  const presentTypes = [
    ...new Set(
      byKind.observable
        .map((item) => item.observableType)
        .filter((type): type is NonNullable<typeof type> => type !== undefined),
    ),
  ];

  const signoffField =
    track === undefined ? undefined : signoffTrackEligibilityStatics.byTrack[track].signoffField;
  const remainingCaption =
    signoffField === undefined
      ? 'no sign-off yet on the track you are signing'
      : `awaiting your \`${signoffField}\``;
  const unitsCaption =
    signoffField === undefined
      ? '## UNITS — [ ] outstanding on your track, [x] already settled on it'
      : [
          `## UNITS — [ ] awaiting your \`${signoffField}\` (the field THIS track writes), [x] not awaiting it`,
          '[x] says ONLY that this unit is not yours to sign right now: it is already signed on the',
          `${String(track)} track, or another track owns its package kind. Never read it as "an earlier`,
          'session already proved this the way you would have".',
        ].join('\n');

  const header = [
    `# QA CHECKLIST — flow \`${String(checklist.flowId)}\` "${String(checklist.flowName)}"`,
    `Entry point: ${String(checklist.entryPoint)}`,
    `Units: ${items.length} (${byKind.terminal.length} terminal, ${byKind.branch.length} branch, ${byKind.observable.length} observable, ${byKind['off-map'].length} off-map)`,
    `REMAINING (${remainingCaption}): ${remainingCount} of ${items.length}`,
    '',
    'This list IS the definition of done for this flow. Paths are the itinerary; units are the',
    'coverage. A flow can be two paths carrying twenty observables, so walking every path proves',
    'nothing on its own.',
    'The two tracks are measured separately: your sign-off field is the only one counted here, and',
    "the other track's sign-off on a unit never settles yours. Both verdicts close a unit —",
    '`confirmed` with evidence, or `unconfirmable` with what you tried plus a `toSettle`.',
  ].join('\n');

  // Printed only when the flow actually carries one, and printed BESIDE the type surfaces rather
  // than inside them: a read-check keeps its outcome type, so its type's own sentence is still on
  // this list and would otherwise be the only surface a reader finds for it.
  const readCheckItems = byKind.observable.filter((item) => item.verifyByReading === true);
  const surfaceLegend =
    presentTypes.length === 0
      ? ''
      : [
          '',
          '## CHECK SURFACES (observable types present on this flow)',
          ...presentTypes.map((type) => `- ${type} → ${qaCheckSurfaceStatics.byOutcomeType[type]}`),
          ...(readCheckItems.length === 0
            ? []
            : [
                `- ${textDisplaySymbolsStatics.readCheckMark} → ${qaCheckSurfaceStatics.readCheck}`,
                `  ${readCheckItems.length} unit(s) below carry it. It OVERRIDES the type surface on those lines.`,
              ]),
        ].join('\n');

  // One surface per kind the reader can actually sign, in the same order the unit blocks below run.
  // A surface for a kind absent from this track's list names a measurement nobody here will make.
  const kindSurfaces = (
    [
      ['terminal', '## TERMINAL SURFACE'],
      ['branch', '## BRANCH SURFACE'],
      ['off-map', '## OFF-MAP SURFACE'],
    ] as const
  )
    .filter(([kind]) => trackUnitKinds === undefined || trackUnitKinds.includes(kind))
    .flatMap(([kind, heading]) => ['', heading, qaCheckSurfaceStatics.byKind[kind]])
    .join('\n');

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
    .filter(([, kindItems]) => kindItems.length > 0)
    .map(([title, kindItems]) =>
      [
        '',
        `### ${title} (${kindItems.length})`,
        ...kindItems.map((item) => {
          const mark = remaining.has(String(item.id)) ? '[ ]' : '[x]';
          const type = item.observableType === undefined ? '' : `  [${item.observableType}]`;
          const readCheck =
            item.verifyByReading === true ? `  ${textDisplaySymbolsStatics.readCheckMark}` : '';
          return `${mark} ${String(item.id)}${type}${readCheck}\n    ${String(item.label)}`;
        }),
      ].join('\n'),
    )
    .join('\n');

  return contentTextContract.parse(
    [header, surfaceLegend, kindSurfaces, paths, '', unitsCaption, unitBlock].join('\n'),
  );
};
