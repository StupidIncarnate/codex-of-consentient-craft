import { IntervalHandleStub } from './interval-handle.stub';

describe('IntervalHandleStub', () => {
  it('VALID: {} => returns a handle the jsdom environment issued (an integer id)', () => {
    const handle = IntervalHandleStub();

    expect(Number.isInteger(handle)).toBe(true);
  });
});
