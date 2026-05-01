/**
 * PURPOSE: Configuration constants for the cli-tool headline renderer
 *
 * USAGE:
 * projectMapHeadlineCliToolStatics.subcommandsSectionHeader;
 * // '## Subcommands'
 *
 * WHEN-TO-USE: project-map-headline-cli-tool broker and its layer brokers
 */

export const projectMapHeadlineCliToolStatics = {
  commandNamePadWidth: 28,
  subcommandsSectionHeader: '## Subcommands',
  subcommandsSectionDescription:
    'Each row maps a CLI subcommand literal to the responder or flow file that handles it.',
  subcommandsSectionEmpty: '(no subcommands detected in this package)',
  exemplarSectionPrefix: '## Detailed exemplar — `',
  exemplarSectionSuffix: '`',
  exemplarDescription:
    'This section traces the subcommand end-to-end: process.argv parse → startup → flow → responder → downstream effects.',
  exemplarRequestChainHeader: '### Call trace',
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
