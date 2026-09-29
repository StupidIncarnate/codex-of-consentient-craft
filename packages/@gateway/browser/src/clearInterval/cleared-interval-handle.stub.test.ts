import { ClearedIntervalHandleStub } from './cleared-interval-handle.stub';

describe('ClearedIntervalHandleStub', () => {
  it('VALID: {} => returns a handle the jsdom environment issued (an integer id)', () => {
    const handle = ClearedIntervalHandleStub();

    expect(Number.isInteger(handle)).toBe(true);
  });
});
