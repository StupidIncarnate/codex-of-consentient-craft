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
} as const;
