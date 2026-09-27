import { mcpToolInputContract } from './mcp-tool-input-contract';
import { McpToolInputStub } from './mcp-tool-input.stub';

describe('mcpToolInputContract', () => {
  it('VALID: {arbitrary tool keys} => keeps every key and value', () => {
    const result = mcpToolInputContract.parse(
      McpToolInputStub({ grep: 'stack|api', context: 2, strict: true }),
    );

    expect(result).toStrictEqual({
      glob: 'packages/*/src/**',
      grep: 'stack|api',
      context: 2,
      strict: true,
    });
  });

  it('EMPTY: {} => parses an empty input', () => {
    expect(mcpToolInputContract.parse({})).toStrictEqual({});
  });

  it('INVALID: {a string} => throws', () => {
    expect(() => mcpToolInputContract.parse('glob')).toThrow(/expected record/u);
  });
});
