import { toolContract as _toolContract } from './tool-contract';
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

  it('VALID: {name: "", description: "test", inputSchema: "string"} => parses successfully', () => {
    const result = ToolStub({
      name: '',
      description: 'test',
      inputSchema: 'string',
    });

    expect(result).toStrictEqual({
      name: '',
      description: 'test',
      inputSchema: 'string',
    });
  });

  it('VALID: {name: "test", description: "desc", inputSchema: 42} => parses successfully', () => {
    const result = ToolStub({
      name: 'test',
      description: 'desc',
      inputSchema: 42,
    });

    expect(result).toStrictEqual({
      name: 'test',
      description: 'desc',
      inputSchema: 42,
    });
  });

  it('VALID: {name: "test", description: "desc", inputSchema: ["array"]} => parses successfully', () => {
    const result = ToolStub({
      name: 'test',
      description: 'desc',
      inputSchema: ['array'],
    });

    expect(result).toStrictEqual({
      name: 'test',
      description: 'desc',
      inputSchema: ['array'],
    });
  });
});
