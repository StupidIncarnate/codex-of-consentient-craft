import type { HealthSnapshotStub } from '@dungeonmaster/shared/contracts';

import { serverAppHarness } from '../../../test/harnesses/server-app/server-app.harness';

import { HealthFlow } from './health-flow';

type HealthSnapshot = ReturnType<typeof HealthSnapshotStub>;

describe('HealthFlow', () => {
  const harness = serverAppHarness();

  describe('GET /api/health', () => {
    it('VALID: {} => 200 with the full 7-field snapshot', async () => {
      const restore = harness.setupTestHome({ baseName: 'health-flow-snapshot' });
      const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
      const { DUNGEONMASTER_PORT: savedPort = '' } = process.env;
      process.env.DUNGEONMASTER_PORT = '4800';
      jest.useFakeTimers().setSystemTime(new Date('2024-01-15T10:00:00.000Z'));
      const app = HealthFlow();

      const before = Math.floor(process.uptime());
      const response = await app.request('/api/health');
      const after = Math.floor(process.uptime());
      const body: unknown = await response.json();

      jest.useRealTimers();
      process.env.DUNGEONMASTER_PORT = savedPort;
      restore();

      const parsed = harness.toPlain(body) as HealthSnapshot;
      const { uptimeSeconds, ...rest } = parsed;

      expect(response.status).toBe(200);
      expect(rest).toStrictEqual({
        status: 'ok',
        timestamp: '2024-01-15T10:00:00.000Z',
        version: '0.1.0',
        port: 4800,
        home: dungeonmasterHome,
        orchestrationMode: 'node',
      });
      expect(uptimeSeconds).toBeGreaterThanOrEqual(before);
      expect(uptimeSeconds).toBeLessThanOrEqual(after);
    });

    it('ERROR: {DUNGEONMASTER_HOME is a bare relative path} => 500 with a non-empty error string', async () => {
      const { DUNGEONMASTER_HOME: savedHome = '' } = process.env;
      process.env.DUNGEONMASTER_HOME = 'relative/path';
      const app = HealthFlow();

      const response = await app.request('/api/health');
      const body: unknown = await response.json();

      process.env.DUNGEONMASTER_HOME = savedHome;

      const expectedError =
        '[\n  {\n    "code": "custom",\n    "message": "Path must be absolute (start with / or C:\\\\ on Windows)",\n    "path": []\n  }\n]';

      expect(response.status).toBe(500);
      expect(harness.toPlain(body)).toStrictEqual({ error: expectedError });
    });
  });
});
