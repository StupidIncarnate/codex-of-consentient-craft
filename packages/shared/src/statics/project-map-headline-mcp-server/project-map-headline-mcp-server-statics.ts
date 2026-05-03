/**
 * PURPOSE: Configuration constants for the mcp-server headline renderer
 *
 * USAGE:
 * projectMapHeadlineMcpServerStatics.toolsSectionHeader; // '## Tools — every MCP tool'
 * projectMapHeadlineMcpServerStatics.toolsSectionEmpty; // '(no tools found in this package)'
 *
 * WHEN-TO-USE: project-map-headline-mcp-server broker and its layer brokers
 */

export const projectMapHeadlineMcpServerStatics = {
  toolNamePadWidth: 28,
  toolsSectionHeader: '## Tools — every MCP tool',
  toolsSectionDescription:
    'Exhaustive: every MCP tool the server registers is listed below. Each section header names the flow file where the tools are registered.',
  toolsSectionEmpty: '(no tools found in this package)',
} as const;
