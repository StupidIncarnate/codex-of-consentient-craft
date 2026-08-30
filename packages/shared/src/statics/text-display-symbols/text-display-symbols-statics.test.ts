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
        '  #id           kebab-case identifier (use in modify-quest calls without the #)',
        '  [#id] label   flow node with its display label',
        '  > #id: text   observable attached to the node above',
        '  \u2192 [#id]       edge to next node',
        '  \u2192"label"      labeled edge (decision branch)',
        '  \u21A9             back-reference \u2014 node defined earlier, not repeated',
        '  \u2197 cross-flow  edge to node in another flow (flowId:#nodeId)',
        '  \u2190 MERGE       node reachable from multiple paths',
        '  (terminal)    end state, no outgoing edges',
        '  _delete:true  removes the entity when sent via modify-quest',
        '---',
      ],
      ownedNode: '◀ YOURS',
      flowSliceLegendLines: [
        '---',
        'KEY:',
        '  [#id] label (type) {pkgs}   flow node, its kind, and the packages it lands in',
        '  ◀ YOURS                     this node lands in YOUR package',
        '  > #id: text [type]          observable attached to the node above',
        '  > (N observable(s) …)       observables attributed to another package, collapsed',
        '  → [#id]                     edge to next node',
        '  →"label"                    labeled edge (decision branch — each one is a unit)',
        '  ↩                           back-reference — node defined earlier, not repeated',
        '  ↗ cross-flow                edge into another flow, resolved on the lines under it',
        '  ← MERGE                     node reachable from multiple paths',
        '  (terminal)                  end state, no outgoing edges',
        '  [C✓ F✓ S?]                  sign-offs already recorded (Codeweaver/Flowrider/Siegemaster)',
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
});
