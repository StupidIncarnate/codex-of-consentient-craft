import { NetworkRecordLifecycleFlow } from './network-record-lifecycle-flow';

describe('NetworkRecordLifecycleFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {no args} => returns lifecycle object with start, afterEach, stop', () => {
      const lifecycle = NetworkRecordLifecycleFlow();

      lifecycle.stop();

      expect(lifecycle).toStrictEqual({
        start: expect.any(Function),
        afterEach: expect.any(Function),
        stop: expect.any(Function),
      });
    });
  });
});
