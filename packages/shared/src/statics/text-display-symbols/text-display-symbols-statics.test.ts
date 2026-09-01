import { signoffTracksStatics } from '../signoff-tracks/signoff-tracks-statics';
import { textDisplaySymbolsStatics } from './text-display-symbols-statics';

const MARKED_FIELDS = Object.keys(textDisplaySymbolsStatics.signoffTrackMarks);

describe('textDisplaySymbolsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(textDisplaySymbolsStatics).toStrictEqual({
      rightArrow: '\u2192',
      leftArrow: '\u2190',
      hookLeftArrow: '\u21A9',
      northEastArrow: '\u2197',
      emDash: '\u2014',
      indent: '  ',
      legendLines: [
        '---',
        'KEY:',
        '  #id                         kebab-case identifier (use in modify-quest calls without the #)',
        '  [#id] {pkgs} label (type)   flow node, the packages it lands in, and its kind',
        '  ● #id {pkg} text            observable attached to the node above, and the package it belongs to',
        '  → [#id]                     edge to next node',
        '  →"label"                    labeled edge (decision branch)',
        '  ↩                           back-reference — node defined earlier, not repeated',
        '  ↗ cross-flow                edge to node in another flow (flowId:#nodeId)',
        '  ← MERGE                     node reachable from multiple paths',
        '  (terminal)                  end state, no outgoing edges',
        '  (read-check)                settled by opening the source file, not by running a test',
        '  +codeweaver                 this observable was ADDED mid-quest by that role, not in the spec at approval',
        '  [C✓ F✓ S?]                  one mark per track that HAS signed — C Codeweaver, F Flowrider, S Siegemaster',
        '                              ✓ confirmed, ? unconfirmable; a track that has not signed is absent, not blank',
        '  _delete:true                removes the entity when sent via modify-quest',
        '---',
      ],
      ownedNode: '◀ YOURS',
      observable: '●',
      flowSliceLegendLines: [
        '---',
        'KEY:',
        '  [#id] {pkgs} label (type)   flow node, the packages it lands in, and its kind',
        "  {web ● 3, server}           per package, how many of this node's observables are theirs — bare means none",
        '  ◀ YOURS                     this node lands in YOUR package',
        '  ● #id {pkg} text [type]     observable, the package it belongs to, and its text — only YOURS are listed',
        '  (read-check)                settled by opening the source file, not by running a test',
        '  +codeweaver                 this observable was ADDED mid-quest by that role, not in the spec at approval',
        '  → [#id]                     edge to next node',
        '  →"label"                    labeled edge (decision branch — each one is a unit)',
        '  ↩                           back-reference — node defined earlier, not repeated',
        '  ↗ cross-flow                edge into another flow, resolved on the lines under it',
        '  ← MERGE                     node reachable from multiple paths',
        '  (terminal)                  end state, no outgoing edges',
        '  [C✓ F✓ S?]                  one mark per track that HAS signed — C Codeweaver, F Flowrider, S Siegemaster',
        '                              ✓ confirmed, ? unconfirmable; a track that has not signed is absent, not blank',
        '---',
      ],
      flowSliceWholeFlowLegendLines: [
        '---',
        'KEY:',
        '  [#id] {pkgs} label (type)   flow node, the packages it lands in, and its kind',
        "  {web ● 3, server}           per package, how many of this node's observables are theirs — bare means none",
        '  ● #id {pkg} text [type]     observable, the package it belongs to, and its text — every one is listed',
        '  (read-check)                settled by opening the source file, not by running a test',
        '  +codeweaver                 this observable was ADDED mid-quest by that role, not in the spec at approval',
        '  → [#id]                     edge to next node',
        '  →"label"                    labeled edge (decision branch — each one is a unit)',
        '  ↩                           back-reference — node defined earlier, not repeated',
        '  ↗ cross-flow                edge into another flow, resolved on the lines under it',
        '  ← MERGE                     node reachable from multiple paths',
        '  (terminal)                  end state, no outgoing edges',
        '  [C✓ F✓ S?]                  one mark per track that HAS signed — C Codeweaver, F Flowrider, S Siegemaster',
        '                              ✓ confirmed, ? unconfirmable; a track that has not signed is absent, not blank',
        '---',
      ],
      sectionHeaders: {
        designDecisions: '## Design Decisions',
        contracts: '## Contracts',
        tooling: '## Tooling',
        packagesAffected: '## Packages Affected',
        operations: '## Operations',
        questNotes: '## Quest Notes',
      },
      none: '(none)',
      terminal: '(terminal)',
      backRef: '\u21A9',
      crossFlow: '\u2197 cross-flow',
      merge: '\u2190 MERGE',
      signoffTrackMarks: {
        codeweaver: 'C',
        flowrider: 'F',
        siegemaster: 'S',
      },
      signoffVerdictMarks: {
        confirmed: '\u2713',
        unconfirmable: '?',
      },
      offMapLabel: 'off-map:',
      observableOriginPrefix: '+',
      readCheckMark: '(read-check)',
    });
  });

  // ONE MARK PER SIGN-OFF FIELD, and the fields are `signoffTracksStatics.fields` — never the
  // DENOMINATOR list, which carries a third member that writes no column of its own. A field with no
  // glyph would render nothing on a graph line that carries a real sign-off; a glyph naming no field
  // is a column that does not exist.
  it('VALID: {marker keys} => 1:1 with the sign-off field list, in neither direction short', () => {
    const marked = new Set(MARKED_FIELDS);

    expect([
      signoffTracksStatics.fields.filter((field) => !marked.has(field)),
      MARKED_FIELDS.filter((mark) => !signoffTracksStatics.fields.some((field) => field === mark)),
    ]).toStrictEqual([[], []]);
  });

  // Every mark is exactly one character. The flow graph carries one marker per signed unit inside
  // `mcpToolResultStatics.maxVerbatimChars`, so a two-character mark doubles the cost of the
  // feature on a big quest.
  it('VALID: {marker glyphs} => every track and verdict mark is one character', () => {
    expect([
      textDisplaySymbolsStatics.signoffTrackMarks.codeweaver.length,
      textDisplaySymbolsStatics.signoffTrackMarks.flowrider.length,
      textDisplaySymbolsStatics.signoffTrackMarks.siegemaster.length,
      textDisplaySymbolsStatics.signoffVerdictMarks.confirmed.length,
      textDisplaySymbolsStatics.signoffVerdictMarks.unconfirmable.length,
    ]).toStrictEqual([1, 1, 1, 1, 1]);
  });

  // THE TWO SLICE LEGENDS ARE ONE LEGEND WITH ONE DIFFERENCE, and this is what keeps them that way.
  // `questFlowSliceTransformer` picks between them on whether the caller named a package, so a
  // symbol documented in one and missing from the other is a symbol half the readers of the same
  // graph cannot look up. The only entries allowed to differ are the two that ARE the difference:
  // the packaged view marks a node `◀ YOURS` and filters observables to that package, and the
  // whole-flow view does neither.
  it('VALID: {the two slice legends} => identical apart from the owned-node line and the observable line', () => {
    const packagedOnly = [
      '  ◀ YOURS                     this node lands in YOUR package',
      '  ● #id {pkg} text [type]     observable, the package it belongs to, and its text — only YOURS are listed',
    ];
    const wholeFlowOnly = [
      '  ● #id {pkg} text [type]     observable, the package it belongs to, and its text — every one is listed',
    ];
    const packaged = textDisplaySymbolsStatics.flowSliceLegendLines;
    const wholeFlow = textDisplaySymbolsStatics.flowSliceWholeFlowLegendLines;

    expect([
      packaged.filter((line) => !packagedOnly.includes(line)),
      packaged.filter((line) => packagedOnly.includes(line)),
      wholeFlow.filter((line) => wholeFlowOnly.includes(line)),
    ]).toStrictEqual([
      wholeFlow.filter((line) => !wholeFlowOnly.includes(line)),
      packagedOnly,
      wholeFlowOnly,
    ]);
  });
});
