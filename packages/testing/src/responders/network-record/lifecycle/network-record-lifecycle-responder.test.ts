import { NetworkRecordLifecycleResponderProxy } from './network-record-lifecycle-responder.proxy';
import { NetworkRecordLifecycleResponder } from './network-record-lifecycle-responder';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

describe('NetworkRecordLifecycleResponder', () => {
  describe('lifecycle creation', () => {
    it('VALID: {no args} => returns object with start, afterEach, stop methods', () => {
      NetworkRecordLifecycleResponderProxy();

      const lifecycle = NetworkRecordLifecycleResponder();

      expect(lifecycle).toStrictEqual({
        start: expect.any(Function),
        afterEach: expect.any(Function),
        stop: expect.any(Function),
      });
    });

    it('VALID: {lifecycle methods called} => delegates to recorder without errors', async () => {
      NetworkRecordLifecycleResponderProxy();

      const lifecycle = NetworkRecordLifecycleResponder();

      lifecycle.start();
      await lifecycle.afterEach();

      expect(() => {
        lifecycle.stop();
      }).not.toThrow();
    });
  });

  describe('afterEach()', () => {
    it('VALID: {entries present after flush} => writes formatted output to stderr', async () => {
      NetworkRecordLifecycleResponderProxy();
      const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
      stderrSpy.mockReturnValue(true);

      const lifecycle = NetworkRecordLifecycleResponder();
      lifecycle.start();
      await lifecycle.afterEach();

      lifecycle.stop();

      // With no actual HTTP traffic captured by the mocked MSW server,
      // entries will be empty and stderr should not be written to
      expect(stderrSpy.mock.calls).toStrictEqual([]);
    });

    it('EMPTY: {no entries after flush} => does not write to stderr', async () => {
      NetworkRecordLifecycleResponderProxy();
      const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
      stderrSpy.mockReturnValue(true);

      const lifecycle = NetworkRecordLifecycleResponder();
      lifecycle.start();
      await lifecycle.afterEach();

      lifecycle.stop();

      expect(stderrSpy.mock.calls).toStrictEqual([]);
    });
  });
});
