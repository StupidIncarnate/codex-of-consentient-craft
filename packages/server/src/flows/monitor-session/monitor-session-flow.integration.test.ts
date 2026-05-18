import { MonitorSessionFlow } from './monitor-session-flow';

describe('MonitorSessionFlow', () => {
  describe('shape', () => {
    it('VALID: {export} => exposes bootstrap and teardown', () => {
      expect(MonitorSessionFlow).toStrictEqual({
        bootstrap: expect.any(Function),
        teardown: expect.any(Function),
      });
    });
  });
});
