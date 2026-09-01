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
  // Suffixes a node the caller's own package tags, in a per-package flow slice. A slice MARKS
  // rather than FILTERS: cutting a package's nodes out of the graph deletes the edges between
  // them, and a measured case left one package three orphan nodes and no graph at all.
  ownedNode: '◀ YOURS',
  // Opens every observable line (`● #id {pkg} text`), and annotates each package in a node's tag
  // set with how many of that node's observables are attributed to it (`{web ● 3, server}`). One
  // glyph for one kind of thing: a reader scanning a graph for what has to be true finds both the
  // ones listed and the count of the ones that are somebody else's by the same mark.
  observable: '●',
  // The KEY for a per-flow slice. It is NOT `legendLines`: a slice carries three symbols the whole
  // quest render has no equivalent for (the package tag set, its per-package observable counts, and
  // the owned-node mark) and none of the modify-quest guidance, because a session reading its own
  // flow is reading it to build against, not to edit.
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
  // The KEY for a slice fetched with NO package — the flowrider / siegemaster / reviewer view, where
  // every node is the reader's and every observable renders. It is a SEPARATE array rather than the
  // one above because two of that one's lines are claims the unpackaged render never makes:
  // `◀ YOURS` is emitted nowhere, and "only YOURS are listed" is the opposite of what happens. A
  // reader handed both that KEY and the render's own "The WHOLE flow is yours" line has to work out
  // which is lying. The colocated test pins that these two differ in exactly those two entries, so a
  // line added to either has to be added to both.
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
  // Sign-off markers: one letter per verification track, one glyph per verdict. The graph render is
  // the surface an agent reads by DEFAULT (`format: 'text'`), and a whole quest has to fit inside
  // `mcpToolResultStatics.maxVerbatimChars`, so a marker is two characters per track and carries
  // the verdict alone. Evidence and questions belong to `get-quest-summary`; inlining them here
  // would scale the render by the length of the prose instead of the size of the graph.
  // A marker is emitted ONLY where a sign-off exists, so an unsigned unit's line carries no marker
  // and no placeholder column.
  signoffTrackMarks: {
    codeweaver: 'C',
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
  // Marks an observable carrying `verifyByReading`. Spelled out rather than given a glyph, because
  // it changes what a session is being asked to DO with the line and a reader should not have to
  // find a legend to learn that. Emitted only where the flag is set, so an ordinary observable's
  // line is unchanged.
  readCheckMark: '(read-check)',
} as const;
