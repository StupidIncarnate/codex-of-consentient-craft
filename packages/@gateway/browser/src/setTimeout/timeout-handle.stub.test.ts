import { TimeoutHandleStub } from './timeout-handle.stub';

describe('TimeoutHandleStub', () => {
  it('VALID: {} => returns a handle the jsdom environment issued (an integer id)', () => {
    const handle = TimeoutHandleStub();

    expect(Number.isInteger(handle)).toBe(true);
  });
});
