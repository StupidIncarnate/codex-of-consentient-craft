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
      resolveScript:
        "try { require('@dungeonmaster/mcp'); } catch (e) { try { const g = require('child_process').execSync('npm root -g', { encoding: 'utf8' }).trim(); const p = require('path'); try { require(p.join(g, '@dungeonmaster/mcp')); } catch { require(p.join(g, 'dungeonmaster', 'node_modules', '@dungeonmaster/mcp')); } } catch { throw e; } }",
    });
  });
});
