import { clearImmediate } from './clearImmediate';
import { clearImmediate as wrapper } from './clear-immediate/clear-immediate';

describe('#gateway/node/clearImmediate', () => {
  it('VALID: {barrel} => re-exports the call-time wrapper', () => {
    expect(clearImmediate).toBe(wrapper);
  });
});
