import { mcpServerStatics } from './mcp-server-statics';

describe('mcpServerStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(mcpServerStatics).toStrictEqual({
      timeouts: {
        startupMs: 2000,
        requestMs: 10000,
      },
    });
  });
});
