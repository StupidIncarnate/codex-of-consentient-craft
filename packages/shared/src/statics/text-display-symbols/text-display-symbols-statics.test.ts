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
        steps: '## Steps',
      },
      none: '(none)',
      terminal: '(terminal)',
      backRef: '\u21A9',
      crossFlow: '\u2197 cross-flow',
      merge: '\u2190 MERGE',
    });
  });
});
