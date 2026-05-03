/**
 * PURPOSE: Configuration constants for the frontend-react headline renderer
 *
 * USAGE:
 * projectMapHeadlineFrontendReactStatics.compositionSectionHeader;
 * // '## Widget composition'
 *
 * WHEN-TO-USE: project-map-headline-frontend-react broker and its layer brokers
 */

export const projectMapHeadlineFrontendReactStatics = {
  compositionSectionHeader: '## Widget composition',
  compositionSectionEmpty: '(no widgets found in this package)',
  hubsSectionHeader: '## Widget hubs (in-degree >= 5)',
  hubsSectionEmpty: '(no hubs — all widgets have in-degree < 5)',
  treeConnectors: {
    pipe: '│',
    branch: '├─',
    last: '└─',
    indent: '   ',
  },
  bindingsPrefix: '   bindings: ',
  bindingFlowLineSubIndent: '   ',
  httpMethodPadWidth: 6,
} as const;
