import { laneSpecContract } from './lane-spec-contract';
import { LaneSpecStub } from './lane-spec.stub';
import { LaneProcessStub } from '../lane-process/lane-process.stub';

type LaneSpec = ReturnType<typeof LaneSpecStub>;

describe('laneSpecContract', () => {
  describe('valid specs', () => {
    it('VALID: {a single-process browserless spec} => parses the complete shape', () => {
      const spec: LaneSpec = LaneSpecStub();

      const result = laneSpecContract.parse(spec);

      expect(result).toStrictEqual({
        name: 'api',
        processes: [
          {
            name: 'api',
            command: 'npm',
            args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
            portRole: 'api',
            readyPath: '/api/guilds',
            logFileName: 'api-server.log',
            env: { DUNGEONMASTER_PORT: '{apiPort}' },
          },
        ],
        browser: false,
        bootTimeoutMs: 180_000,
        env: { DUNGEONMASTER_PORT: '{apiPort}' },
      });
    });

    it('VALID: {api and web processes with different portRoles} => parses', () => {
      const spec: LaneSpec = LaneSpecStub({
        name: 'stack',
        browser: true,
        processes: [
          LaneProcessStub({ name: 'api', portRole: 'api' }),
          LaneProcessStub({ name: 'web', portRole: 'web', readyPath: '/' }),
        ],
      });

      const result = laneSpecContract.parse(spec);

      expect(result.processes.map((process) => process.portRole)).toStrictEqual(['api', 'web']);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {two processes both portRole null} => parses, since neither claims a port', () => {
      const spec: LaneSpec = LaneSpecStub({
        processes: [
          LaneProcessStub({ name: 'worker-a', portRole: null, readyPath: null }),
          LaneProcessStub({ name: 'worker-b', portRole: null, readyPath: null }),
        ],
      });

      const result = laneSpecContract.parse(spec);

      expect(result.processes.map((process) => process.portRole)).toStrictEqual([null, null]);
    });
  });

  describe('invalid specs', () => {
    it('INVALID: {processes: []} => throws for a spec with no processes', () => {
      expect(() =>
        laneSpecContract.parse({
          name: 'api',
          processes: [],
          browser: false,
          bootTimeoutMs: 180_000,
          env: {},
        }),
      ).toThrow(/a lane spec must declare at least one process/u);
    });

    it('INVALID: {two processes both portRole "api"} => throws for a claimed-role collision', () => {
      expect(() =>
        laneSpecContract.parse({
          name: 'api',
          processes: [
            {
              name: 'api',
              command: 'npm',
              args: [],
              portRole: 'api',
              readyPath: '/api/guilds',
              logFileName: 'api-server.log',
              env: {},
            },
            {
              name: 'api-2',
              command: 'npm',
              args: [],
              portRole: 'api',
              readyPath: '/api/guilds',
              logFileName: 'api-server.log',
              env: {},
            },
          ],
          browser: false,
          bootTimeoutMs: 180_000,
          env: {},
        }),
      ).toThrow(/two processes cannot claim the same portRole/u);
    });
  });
});
