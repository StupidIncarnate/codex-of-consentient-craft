/**
 * PURPOSE: Configuration constants for the hook-handlers headline renderer
 *
 * USAGE:
 * projectMapHeadlineHookHandlersStatics.hooksSectionHeader;
 * // '## Hooks'
 *
 * WHEN-TO-USE: project-map-headline-hook-handlers broker and its layer brokers
 */

export const projectMapHeadlineHookHandlersStatics = {
  binNamePadWidth: 40,
  hooksSectionHeader: '## Hooks',
  hooksSectionDescription:
    'Each row maps a bin script name to the responder it invokes. Detected spawn and fs-write effects are shown as indented annotations.',
  hooksSectionEmpty: '(no bin entries found in this package)',
  exemplarSectionPrefix: '## Detailed exemplar — `',
  exemplarSectionSuffix: '`',
  exemplarDescription:
    'This section traces one hook invocation end-to-end: stdin JSON event → startup → flow → responder → adapter calls → exit code.',
  exemplarRequestChainHeader: '### Call trace',
  spawnAnnotationPrefix: '  → spawn: ',
  fsWriteAnnotationPrefix: '  → fs writes: ',
  boundaryBoxInnerWidth: 56,
  boundaryBoxPad: 2,
  genericBoundaryBoxLabel: 'BOUNDARY →',
  genericBoundaryBoxNote: '(cross-package adapter call)',
  genericBoundaryBoxFill: '═',
  genericBoundaryBoxCornerTL: '╔',
  genericBoundaryBoxCornerTR: '╗',
  genericBoundaryBoxCornerBL: '╚',
  genericBoundaryBoxCornerBR: '╝',
  genericBoundaryBoxSide: '║',
  genericBoundaryBoxIndent: '      ',
} as const;
