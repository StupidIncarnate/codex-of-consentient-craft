import { AbortControllerStub } from './abort-controller.stub';

describe('AbortControllerStub', () => {
  it('VALID: {} => a controller whose signal is not aborted', () => {
    const controller = AbortControllerStub();

    expect(controller.signal.aborted).toBe(false);
  });

  it('VALID: {aborted: true} => a controller whose signal is already aborted', () => {
    const controller = AbortControllerStub({ aborted: true });

    expect(controller.signal.aborted).toBe(true);
  });

  it('VALID: {} => abort() still flips the signal', () => {
    const controller = AbortControllerStub();

    controller.abort();

    expect(controller.signal.aborted).toBe(true);
  });
});
