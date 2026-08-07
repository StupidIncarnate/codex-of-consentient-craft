import { textDisplaySymbolsStatics } from './text-display-symbols-statics';

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
      sectionHeaders: {
        designDecisions: '## Design Decisions',
        contracts: '## Contracts',
        tooling: '## Tooling',
        operations: '## Operations',
        questNotes: '## Quest Notes',
      },
      none: '(none)',
      terminal: '(terminal)',
      backRef: '\u21A9',
      crossFlow: '\u2197 cross-flow',
      merge: '\u2190 MERGE',
      signoffTrackMarks: {
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

  // Every mark is exactly one character. The flow graph carries one marker per signed unit inside
  // `mcpToolResultStatics.maxVerbatimChars`, so a two-character mark doubles the cost of the
  // feature on a big quest.
  it('VALID: {marker glyphs} => every track and verdict mark is one character', () => {
    expect([
      textDisplaySymbolsStatics.signoffTrackMarks.flowrider.length,
      textDisplaySymbolsStatics.signoffTrackMarks.siegemaster.length,
      textDisplaySymbolsStatics.signoffVerdictMarks.confirmed.length,
      textDisplaySymbolsStatics.signoffVerdictMarks.unconfirmable.length,
    ]).toStrictEqual([1, 1, 1, 1]);
  });
});
