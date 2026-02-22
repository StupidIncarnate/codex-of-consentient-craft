import { toolListResultContract as _toolListResultContract } from './tool-list-result-contract';
import { ToolListResultStub } from './tool-list-result.stub';

describe('toolListResultContract', () => {
  it('VALID: {tools: []} => parses successfully', () => {
    const result = ToolListResultStub({ tools: [] });

    expect(result).toStrictEqual({
      tools: [],
    });
  });

  it('VALID: {tools: [{name, description, inputSchema: {type: "object"}}]} => parses successfully', () => {
    const result = ToolListResultStub({
      tools: [{ name: 'discover', description: 'Test', inputSchema: { type: 'object' } }],
    });

    expect(result).toStrictEqual({
      tools: [{ name: 'discover', description: 'Test', inputSchema: { type: 'object' } }],
    });
  });

  it('VALID: {tools: [{...}, {...}]} => parses successfully with multiple tools', () => {
    const result = ToolListResultStub({
      tools: [
        { name: 'discover', description: 'First tool', inputSchema: { type: 'object' } },
        { name: 'search', description: 'Second tool', inputSchema: { type: 'object' } },
      ],
    });

    expect(result).toStrictEqual({
      tools: [
        { name: 'discover', description: 'First tool', inputSchema: { type: 'object' } },
        { name: 'search', description: 'Second tool', inputSchema: { type: 'object' } },
      ],
    });
  });
});
