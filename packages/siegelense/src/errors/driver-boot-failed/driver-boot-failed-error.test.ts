import { DriverBootFailedError } from './driver-boot-failed-error';

describe('DriverBootFailedError', () => {
  describe('constructor()', () => {
    it('VALID: {specName, instanceId, driverMessage, driverLogPath} => names the spec, the instance, the driver diagnosis, and its log', () => {
      const error = new DriverBootFailedError({
        specName: 'dungeonmaster-web',
        instanceId: 'inst_7f3a9c21',
        driverMessage:
          'Lane spec dungeonmaster-web requires a fake agent CLI, and the environment supplies none of it: set CLAUDE_CLI_PATH to a stub Claude CLI binary.',
        driverLogPath: '/repo/.siegelense/unowned/instances/inst_7f3a9c21/driver.log',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'DriverBootFailedError',
        message:
          'Lane dungeonmaster-web for instance inst_7f3a9c21 failed to boot: Lane spec dungeonmaster-web requires a fake agent CLI, and the environment supplies none of it: set CLAUDE_CLI_PATH to a stub Claude CLI binary. Driver log: /repo/.siegelense/unowned/instances/inst_7f3a9c21/driver.log',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof DriverBootFailedError => returns true', () => {
      const error = new DriverBootFailedError({
        specName: 'dungeonmaster-web',
        instanceId: 'inst_7f3a9c21',
        driverMessage: 'CLAUDE_CLI_PATH is required',
        driverLogPath: '/repo/.siegelense/unowned/instances/inst_7f3a9c21/driver.log',
      });

      expect(error instanceof DriverBootFailedError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new DriverBootFailedError({
        specName: 'dungeonmaster-web',
        instanceId: 'inst_7f3a9c21',
        driverMessage: 'CLAUDE_CLI_PATH is required',
        driverLogPath: '/repo/.siegelense/unowned/instances/inst_7f3a9c21/driver.log',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
