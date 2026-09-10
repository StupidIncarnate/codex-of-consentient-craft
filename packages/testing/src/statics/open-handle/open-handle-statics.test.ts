import { openHandleStatics } from './open-handle-statics';

describe('openHandleStatics', () => {
  describe('exported shape', () => {
    it('VALID: exported value => matches the full expected object', () => {
      expect(openHandleStatics).toStrictEqual({
        timers: {
          arm: ['setTimeout', 'setInterval', 'setImmediate'],
          disarm: ['clearTimeout', 'clearInterval', 'clearImmediate'],
        },
        report: {
          pathEnvVar: 'DUNGEONMASTER_OPEN_HANDLE_REPORT',
          maxStackFrames: 8,
          selfFrame: 'timers-watch-adapter.ts:',
          internalFrame: 'node:internal',
        },
      });
    });
  });

  describe('arm and disarm pair up', () => {
    it('VALID: each arm entry => yields its disarm entry at the same index', () => {
      const derived = openHandleStatics.timers.arm.map((name) => name.replace(/^set/u, 'clear'));

      expect(derived).toStrictEqual([...openHandleStatics.timers.disarm]);
    });
  });
});
