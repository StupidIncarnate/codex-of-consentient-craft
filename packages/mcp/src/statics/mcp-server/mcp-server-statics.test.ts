import { mcpServerStatics } from './mcp-server-statics';

describe('mcpServerStatics', () => {
  it('VALID: timeouts.startupMs => returns 500', () => {
    expect(mcpServerStatics.timeouts.startupMs).toBe(500);
  });

  it('VALID: timeouts.requestMs => returns 10000', () => {
    expect(mcpServerStatics.timeouts.requestMs).toBe(10000);
  });
});
