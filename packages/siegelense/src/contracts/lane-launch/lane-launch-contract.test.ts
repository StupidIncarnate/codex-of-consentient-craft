import { laneLaunchContract } from './lane-launch-contract';
import { LaneLaunchStub } from './lane-launch.stub';

describe('laneLaunchContract', () => {
  describe('valid launches', () => {
    it('VALID: {api launch with a ready url} => parses successfully', () => {
      const launch = LaneLaunchStub({ env: { HOME: '/tmp/dm-siege-inst_7f3a9c21' } });

      const result = laneLaunchContract.parse(launch);

      expect(result).toStrictEqual({
        name: 'api',
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        env: { HOME: '/tmp/dm-siege-inst_7f3a9c21' },
        logPath:
          '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_7f3a9c21/api-server.log',
        fd: 10,
        readyUrl: 'http://dungeonmaster.localhost:34172/api/guilds',
      });
    });

    it('VALID: {readyUrl: null} => parses a launch with no readiness probe', () => {
      const launch = LaneLaunchStub({ name: 'worker', readyUrl: null });

      const result = laneLaunchContract.parse(launch);

      expect(result).toStrictEqual({
        name: 'worker',
        command: 'npm',
        args: ['run', 'dev:no-watch'],
        env: {},
        logPath:
          '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_7f3a9c21/api-server.log',
        fd: 10,
        readyUrl: null,
      });
    });
  });

  describe('invalid launches', () => {
    it('INVALID: {logPath: relative} => throws validation error', () => {
      expect(() =>
        laneLaunchContract.parse({
          name: 'api',
          command: 'npm',
          args: [],
          env: {},
          logPath: 'api-server.log',
          fd: 10,
          readyUrl: null,
        }),
      ).toThrow(/Path must be absolute/u);
    });

    it('INVALID: {missing fd} => throws Required', () => {
      expect(() =>
        laneLaunchContract.parse({
          name: 'api',
          command: 'npm',
          args: [],
          env: {},
          logPath: '/repo/api-server.log',
          readyUrl: null,
        }),
      ).toThrow(/expected number, received undefined/u);
    });
  });
});
