import { portKillListenerResultStatics } from './port-kill-listener-result-statics';

describe('portKillListenerResultStatics', () => {
  describe('exit code bounds', () => {
    it('VALID: {portKillListenerResultStatics} => exposes the process exit code range', () => {
      expect(portKillListenerResultStatics).toStrictEqual({
        exitCode: {
          min: 0,
          max: 255,
        },
      });
    });
  });
});
