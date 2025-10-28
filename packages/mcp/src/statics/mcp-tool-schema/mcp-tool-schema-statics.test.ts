import { mcpToolSchemaStatics } from './mcp-tool-schema-statics';

describe('mcpToolSchemaStatics', () => {
  it('VALID: discover schema structure', () => {
    expect(mcpToolSchemaStatics.discover).toStrictEqual({
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
    });
  });
});
