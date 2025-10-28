/**
 * MCP tool schema definitions derived from contracts
 *
 * These schemas mirror the structure of discoverInputContract but in JSON Schema format
 * required by the MCP protocol.
 */

export const mcpToolSchemaStatics = {
  discover: {
    name: 'discover',
    description: 'Discover utilities, brokers, standards across the codebase',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['files', 'standards'],
          description: 'Type of discovery: files or standards',
        },
        path: {
          type: 'string',
          description: 'Path to search (for files)',
        },
        fileType: {
          type: 'string',
          description: 'File type to filter (broker, widget, guard, etc.)',
        },
        search: {
          type: 'string',
          description: 'Search query',
        },
        name: {
          type: 'string',
          description: 'Specific file name',
        },
        section: {
          type: 'string',
          description: 'Standards section path (for standards)',
        },
      },
      required: ['type'],
    },
  },
} as const;
