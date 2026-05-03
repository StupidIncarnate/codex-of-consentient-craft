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
  spawnAnnotationPrefix: '  → spawn: ',
  fsWriteAnnotationPrefix: '  → fs writes: ',
} as const;
