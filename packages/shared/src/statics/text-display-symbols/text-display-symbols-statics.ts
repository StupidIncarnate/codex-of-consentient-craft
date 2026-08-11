/**
 * PURPOSE: Unicode symbols and section headers used in quest text display formatting
 *
 * USAGE:
 * import { textDisplaySymbolsStatics } from '../../statics/text-display-symbols/text-display-symbols-statics';
 * textDisplaySymbolsStatics.rightArrow; // '→'
 */

export const textDisplaySymbolsStatics = {
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
    packagesAffected: '## Packages Affected',
    operations: '## Operations',
    questNotes: '## Quest Notes',
  },
  none: '(none)',
  terminal: '(terminal)',
  backRef: '\u21A9',
  crossFlow: '\u2197 cross-flow',
  merge: '\u2190 MERGE',
  // Sign-off markers: one letter per verification track, one glyph per verdict. The graph render is
  // the surface an agent reads by DEFAULT (`format: 'text'`), and a whole quest has to fit inside
  // `mcpToolResultStatics.maxVerbatimChars`, so a marker is two characters per track and carries
  // the verdict alone. Evidence and questions belong to `get-quest-summary`; inlining them here
  // would scale the render by the length of the prose instead of the size of the graph.
  // A marker is emitted ONLY where a sign-off exists, so an unsigned unit's line carries no marker
  // and no placeholder column.
  signoffTrackMarks: {
    flowrider: 'F',
    siegemaster: 'S',
  },
  signoffVerdictMarks: {
    confirmed: '\u2713',
    unconfirmable: '?',
  },
  // Prefixes the off-map probe families that carry a sign-off, one line per flow.
  offMapLabel: 'off-map:',
  // Prefixes an observable's `addedBy` when it is not `spec`: only a mid-quest addition is marked,
  // so a spec observable's line carries no origin.
  observableOriginPrefix: '+',
} as const;
