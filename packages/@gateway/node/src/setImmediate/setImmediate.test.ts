import { setImmediate } from './setImmediate';
import { setImmediate as wrapper } from './set-immediate/set-immediate';

describe('#gateway/node/setImmediate', () => {
  it('VALID: {barrel} => re-exports the call-time wrapper', () => {
    expect(setImmediate).toBe(wrapper);
  });
});
