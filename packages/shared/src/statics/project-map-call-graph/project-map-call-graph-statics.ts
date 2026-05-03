/**
 * PURPOSE: Configuration for the project-map call-graph walker. Two filters are applied to the
 * full set of folder types in folderConfigStatics:
 *
 *  - `excludedFolderTypes` are user-policy excluded — pure data/leaves that never appear in the
 *    diagram (contracts, transformers, guards, assets, statics, errors). Any new folder type
 *    not in this list automatically participates in the diagram.
 *
 *  - `structuralFolderTypes` are rendered by the outer Boot-tree skeleton (startup → flows →
 *    responders / widgets / bindings) and are never recursed into by the call-graph walker, to
 *    avoid duplicating the skeleton structure inside each responder's downstream chain.
 *
 * The walker therefore traverses: full folder type set − excludedFolderTypes − structuralFolderTypes.
 * Today that resolves to ['adapters', 'brokers', 'middleware', 'state', 'migrations'].
 *
 * USAGE:
 * projectMapCallGraphStatics.excludedFolderTypes;
 * // ['contracts', 'transformers', 'guards', 'assets', 'statics', 'errors']
 *
 * WHEN-TO-USE: call-chain-lines-render-layer-broker filtering imports during the walk
 */

export const projectMapCallGraphStatics = {
  excludedFolderTypes: ['contracts', 'transformers', 'guards', 'assets', 'statics', 'errors'],
  structuralFolderTypes: ['startup', 'flows', 'responders', 'widgets', 'bindings'],
} as const;
