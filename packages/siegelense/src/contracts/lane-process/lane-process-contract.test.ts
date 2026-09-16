import { laneProcessContract } from './lane-process-contract';
import { LaneProcessStub } from './lane-process.stub';

type LaneProcess = ReturnType<typeof LaneProcessStub>;

describe('laneProcessContract', () => {
  describe('valid processes', () => {
    it('VALID: {a full api process} => parses the complete shape', () => {
      const laneProcess: LaneProcess = LaneProcessStub();

      const result = laneProcessContract.parse(laneProcess);

      expect(result).toStrictEqual({
        name: 'api',
        command: 'npm',
        args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
        portRole: 'api',
        readyPath: '/api/guilds',
        logFileName: 'api-server.log',
        env: { DUNGEONMASTER_PORT: '{apiPort}' },
      });
    });

    it('VALID: {portRole: null, readyPath: null} => a process with no HTTP surface parses', () => {
      const laneProcess: LaneProcess = LaneProcessStub({
        name: 'worker',
        portRole: null,
        readyPath: null,
      });

      const result = laneProcessContract.parse(laneProcess);

      expect(result).toStrictEqual({
        name: 'worker',
        command: 'npm',
        args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
        portRole: null,
        readyPath: null,
        logFileName: 'api-server.log',
        env: { DUNGEONMASTER_PORT: '{apiPort}' },
      });
    });
  });

  describe('empty collections', () => {
    it('EMPTY: {args: [], env: {}} => a process with no arguments and no env still parses', () => {
      const laneProcess: LaneProcess = LaneProcessStub({ args: [], env: {} });

      const result = laneProcessContract.parse(laneProcess);

      expect(result).toStrictEqual({
        name: 'api',
        command: 'npm',
        args: [],
        portRole: 'api',
        readyPath: '/api/guilds',
        logFileName: 'api-server.log',
        env: {},
      });
    });
  });

  describe('invalid processes', () => {
    it('INVALID: {missing command} => throws validation error', () => {
      expect(() =>
        laneProcessContract.parse({
          name: 'api',
          args: [],
          portRole: 'api',
          readyPath: '/api/guilds',
          logFileName: 'api-server.log',
          env: {},
        } as never),
      ).toThrow(/Required/u);
    });
  });
});
