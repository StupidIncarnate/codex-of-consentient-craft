import { SmoketestBootstrapListenerResponder } from './smoketest-bootstrap-listener-responder';
import { SmoketestBootstrapListenerResponderProxy } from './smoketest-bootstrap-listener-responder.proxy';

describe('SmoketestBootstrapListenerResponder', () => {
  it('VALID: {first call} => returns success', () => {
    SmoketestBootstrapListenerResponderProxy();

    const result = SmoketestBootstrapListenerResponder();

    expect(result).toStrictEqual({ success: true });
  });

  it('VALID: {second call} => idempotent, returns success again', () => {
    SmoketestBootstrapListenerResponderProxy();
    SmoketestBootstrapListenerResponder();

    const result = SmoketestBootstrapListenerResponder();

    expect(result).toStrictEqual({ success: true });
  });
});
