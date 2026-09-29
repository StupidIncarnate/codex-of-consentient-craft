import { AbortController } from './AbortController';

describe('#gateway/node/AbortController', () => {
  it('VALID: {export} => is the same class Node provides on globalThis', () => {
    expect(AbortController).toBe(globalThis.AbortController);
  });

  it('VALID: {abort with a reason} => the signal reports aborted and carries the reason', () => {
    const controller = new AbortController();
    const reason = new Error('stop');

    controller.abort(reason);

    expect({ aborted: controller.signal.aborted, reason: controller.signal.reason }).toStrictEqual({
      aborted: true,
      reason,
    });
  });
});
