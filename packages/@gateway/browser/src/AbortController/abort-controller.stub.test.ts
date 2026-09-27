import { AbortControllerStub } from './abort-controller.stub';

describe('AbortControllerStub', () => {
  it('VALID: {} => a real AbortController with a not-yet-aborted signal', () => {
    const controller = AbortControllerStub();

    expect(controller instanceof AbortController).toBe(true);
    expect(controller.signal.aborted).toBe(false);
  });

  it('VALID: {abort() called} => the real signal reports aborted', () => {
    const controller = AbortControllerStub();

    controller.abort();

    expect(controller.signal.aborted).toBe(true);
  });
});
