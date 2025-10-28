import { ToolStub } from './tool.stub';

describe('toolContract', () => {
  it('VALID: {name: "discover", description: "Test tool", inputSchema: {}} => parses successfully', () => {
    const result = ToolStub({
      name: 'discover',
      description: 'Test tool',
      inputSchema: {},
    });

    expect(result).toStrictEqual({
      name: 'discover',
      description: 'Test tool',
      inputSchema: {},
    });
  });

  it('VALID: {name: "search", description: "Search files", inputSchema: {type: "object"}} => parses successfully', () => {
    const result = ToolStub({
      name: 'search',
      description: 'Search files',
      inputSchema: { type: 'object' },
    });

    expect(result).toStrictEqual({
      name: 'search',
      description: 'Search files',
      inputSchema: { type: 'object' },
    });
  });

  it('VALID: {name: "analyze", description: "", inputSchema: null} => parses successfully', () => {
    const result = ToolStub({
      name: 'analyze',
      description: '',
      inputSchema: null,
    });

    expect(result).toStrictEqual({
      name: 'analyze',
      description: '',
      inputSchema: null,
    });
  });
});
