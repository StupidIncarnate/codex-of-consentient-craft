import { mcpServerStatics } from './mcp-server-statics';

describe('mcpServerStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(mcpServerStatics).toStrictEqual({
      timeouts: {
        requestMs: 10000,
        readinessDeadlineMs: 30000,
        readinessProbeAttemptMs: 1500,
        readinessProbeIntervalMs: 200,
      },
    });
  });
});
