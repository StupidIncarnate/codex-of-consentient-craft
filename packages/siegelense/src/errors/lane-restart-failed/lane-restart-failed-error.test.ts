import { LaneRestartFailedError } from './lane-restart-failed-error';

describe('LaneRestartFailedError', () => {
  describe('constructor()', () => {
    it('VALID: {one unready process, one log path} => names the spec, the instance, the process, and its log', () => {
      const error = new LaneRestartFailedError({
        specName: 'dungeonmaster-stack',
        instanceId: 'inst_7f3a9c21',
        unready: ['api'],
        logPaths: [
          '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_7f3a9c21/api-server.log',
        ],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'LaneRestartFailedError',
        message:
          'Restarting lane dungeonmaster-stack for instance inst_7f3a9c21 failed: api did not come back (never answered their ready path). Logs: /repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_7f3a9c21/api-server.log. The instance is unusable — kill it and start a new one.',
      });
    });

    it('EDGE: {two unready processes, two log paths} => every unready process and every log is named', () => {
      const error = new LaneRestartFailedError({
        specName: 'dungeonmaster-stack',
        instanceId: 'inst_00000000',
        unready: ['api', 'web'],
        logPaths: ['/repo/api-server.log', '/repo/web-server.log'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'LaneRestartFailedError',
        message:
          'Restarting lane dungeonmaster-stack for instance inst_00000000 failed: api, web did not come back (never answered their ready path). Logs: /repo/api-server.log, /repo/web-server.log. The instance is unusable — kill it and start a new one.',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof LaneRestartFailedError => returns true', () => {
      const error = new LaneRestartFailedError({
        specName: 'dungeonmaster-stack',
        instanceId: 'inst_7f3a9c21',
        unready: ['api'],
        logPaths: ['/repo/api-server.log'],
      });

      expect(error instanceof LaneRestartFailedError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new LaneRestartFailedError({
        specName: 'dungeonmaster-stack',
        instanceId: 'inst_7f3a9c21',
        unready: ['api'],
        logPaths: ['/repo/api-server.log'],
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
