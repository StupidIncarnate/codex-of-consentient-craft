import { ClearedTimeoutHandleStub } from './cleared-timeout-handle.stub';

describe('ClearedTimeoutHandleStub', () => {
  it('VALID: {} => returns a handle the jsdom environment issued (an integer id)', () => {
    const handle = ClearedTimeoutHandleStub();

    expect(Number.isInteger(handle)).toBe(true);
  });
});
