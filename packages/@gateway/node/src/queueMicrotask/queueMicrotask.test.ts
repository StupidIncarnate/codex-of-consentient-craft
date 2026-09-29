import { queueMicrotask } from './queueMicrotask';
import { queueMicrotask as wrapper } from './queue-microtask/queue-microtask';

describe('#gateway/node/queueMicrotask', () => {
  it('VALID: {barrel} => re-exports the call-time wrapper', () => {
    expect(queueMicrotask).toBe(wrapper);
  });
});
