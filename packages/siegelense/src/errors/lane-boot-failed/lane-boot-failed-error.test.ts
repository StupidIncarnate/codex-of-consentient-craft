import { LaneBootFailedError } from './lane-boot-failed-error';

describe('LaneBootFailedError', () => {
  describe('constructor()', () => {
    it('VALID: {one unready process, one log path} => names the spec, the instance, the process, and its log', () => {
      const error = new LaneBootFailedError({
        specName: 'dungeonmaster-web',
        instanceId: 'inst_7f3a9c21',
        unready: ['web'],
        logPaths: ['/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/web.log'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'LaneBootFailedError',
        message:
          'Lane dungeonmaster-web for instance inst_7f3a9c21 did not become ready: web never answered their ready path. Logs: /repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/web.log',
      });
    });

    it('EDGE: {two unready processes, two log paths} => every unready process and every log is named', () => {
      const error = new LaneBootFailedError({
        specName: 'dungeonmaster-web',
        instanceId: 'inst_00000000',
        unready: ['api', 'web'],
        logPaths: [
          '/repo/.siegelense/unowned/instances/inst_00000000/api.log',
          '/repo/.siegelense/unowned/instances/inst_00000000/web.log',
        ],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'LaneBootFailedError',
        message:
          'Lane dungeonmaster-web for instance inst_00000000 did not become ready: api, web never answered their ready path. Logs: /repo/.siegelense/unowned/instances/inst_00000000/api.log, /repo/.siegelense/unowned/instances/inst_00000000/web.log',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof LaneBootFailedError => returns true', () => {
      const error = new LaneBootFailedError({
        specName: 'dungeonmaster-web',
        instanceId: 'inst_7f3a9c21',
        unready: ['web'],
        logPaths: ['/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/web.log'],
      });

      expect(error instanceof LaneBootFailedError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new LaneBootFailedError({
        specName: 'dungeonmaster-web',
        instanceId: 'inst_7f3a9c21',
        unready: ['web'],
        logPaths: ['/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/web.log'],
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
