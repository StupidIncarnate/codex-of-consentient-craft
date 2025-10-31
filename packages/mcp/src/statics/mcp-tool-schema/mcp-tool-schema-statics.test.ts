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

  it('VALID: get-architecture schema structure', () => {
    expect(mcpToolSchemaStatics['get-architecture']).toStrictEqual({
      name: 'get-architecture',
      description: 'Returns complete architecture overview',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    });
  });

  it('VALID: get-folder-detail schema structure', () => {
    expect(mcpToolSchemaStatics['get-folder-detail']).toStrictEqual({
      name: 'get-folder-detail',
      description: 'Returns detailed information about a specific folder type',
      inputSchema: {
        type: 'object',
        properties: {
          folderType: {
            type: 'string',
            enum: [
              'statics',
              'contracts',
              'guards',
              'transformers',
              'errors',
              'flows',
              'adapters',
              'middleware',
              'brokers',
              'bindings',
              'state',
              'responders',
              'widgets',
              'startup',
            ],
            description: 'Type of folder to get details for',
          },
        },
        required: ['folderType'],
      },
    });
  });

  it('VALID: get-syntax-rules schema structure', () => {
    expect(mcpToolSchemaStatics['get-syntax-rules']).toStrictEqual({
      name: 'get-syntax-rules',
      description: 'Returns universal syntax rules',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    });
  });
});
