import { laneSpecStatics } from './lane-spec-statics';

describe('laneSpecStatics', () => {
  describe('the complete built-in spec set', () => {
    it('VALID: {laneSpecStatics.specs} => asserts every field of both built-in specs', () => {
      expect(laneSpecStatics.specs).toStrictEqual({
        'dungeonmaster-web': {
          name: 'dungeonmaster-web',
          processes: [
            {
              name: 'api',
              command: 'npm',
              args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
              portRole: 'api',
              readyPath: '/api/guilds',
              logFileName: 'api-server.log',
              env: {
                DUNGEONMASTER_HOME: '{home}',
                HOME: '{home}',
                CLAUDE_CLI_PATH: '{fakeClaudeCliPath}',
                FAKE_CLAUDE_QUEUE_DIR: '{claudeQueueDir}',
                FAKE_WARD_QUEUE_DIR: '{wardQueueDir}',
                WARD_CLI_PATH: '{fakeWardCliPath}',
                E2E_SIGNAL_BACK_HTTP: '1',
                DUNGEONMASTER_RATE_LIMITS_POLL_MS: '500',
              },
            },
            {
              name: 'web',
              command: 'npm',
              args: ['run', 'dev', '--workspace=@dungeonmaster/web'],
              portRole: 'web',
              readyPath: '/',
              logFileName: 'web-server.log',
              env: { DUNGEONMASTER_WEB_PORT: '{webPort}' },
            },
          ],
          browser: true,
          bootTimeoutMs: 180_000,
          env: { DUNGEONMASTER_PORT: '{apiPort}' },
        },
        'dungeonmaster-headless': {
          name: 'dungeonmaster-headless',
          processes: [
            {
              name: 'api',
              command: 'npm',
              args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
              portRole: 'api',
              readyPath: '/api/guilds',
              logFileName: 'api-server.log',
              env: {
                DUNGEONMASTER_HOME: '{home}',
                HOME: '{home}',
                CLAUDE_CLI_PATH: '{fakeClaudeCliPath}',
                FAKE_CLAUDE_QUEUE_DIR: '{claudeQueueDir}',
                FAKE_WARD_QUEUE_DIR: '{wardQueueDir}',
                WARD_CLI_PATH: '{fakeWardCliPath}',
                E2E_SIGNAL_BACK_HTTP: '1',
                DUNGEONMASTER_RATE_LIMITS_POLL_MS: '500',
              },
            },
          ],
          browser: false,
          bootTimeoutMs: 180_000,
          env: { DUNGEONMASTER_PORT: '{apiPort}' },
        },
      });
    });
  });

  describe('the browserless spec does not drift from the browsered one', () => {
    it("VALID: {dungeonmaster-headless.processes} => is dungeonmaster-web's processes filtered on portRole 'api'", () => {
      const webApiProcesses = laneSpecStatics.specs['dungeonmaster-web'].processes.filter(
        (process) => process.portRole === 'api',
      );

      expect(laneSpecStatics.specs['dungeonmaster-headless'].processes).toStrictEqual(
        webApiProcesses,
      );
    });
  });
});
