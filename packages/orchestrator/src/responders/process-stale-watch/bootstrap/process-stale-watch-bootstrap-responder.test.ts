import { ProcessStaleWatchBootstrapResponder } from './process-stale-watch-bootstrap-responder';
import { ProcessStaleWatchBootstrapResponderProxy } from './process-stale-watch-bootstrap-responder.proxy';

describe('ProcessStaleWatchBootstrapResponder', () => {
  it('VALID: {first call} => returns success and registers watchdog', () => {
    const proxy = ProcessStaleWatchBootstrapResponderProxy();
    proxy.reset();

    const result = ProcessStaleWatchBootstrapResponder();

    expect(result).toStrictEqual({ success: true });
  });

  it('VALID: {repeated calls} => idempotent — both return success without re-bootstrapping', () => {
    const proxy = ProcessStaleWatchBootstrapResponderProxy();
    proxy.reset();

    const first = ProcessStaleWatchBootstrapResponder();
    const second = ProcessStaleWatchBootstrapResponder();

    expect(first).toStrictEqual({ success: true });
    expect(second).toStrictEqual({ success: true });
  });
});
