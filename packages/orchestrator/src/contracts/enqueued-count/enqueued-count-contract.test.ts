import { enqueuedCountContract } from './enqueued-count-contract';
import { EnqueuedCountStub } from './enqueued-count.stub';

describe('enqueuedCountContract', () => {
  it('VALID: {default} => parses to 0', () => {
    expect(EnqueuedCountStub()).toBe(0);
  });

  it('VALID: {positive int} => parses', () => {
    expect(enqueuedCountContract.parse(5)).toBe(5);
  });

  it('INVALID: {negative} => throws', () => {
    expect(() => enqueuedCountContract.parse(-1)).toThrow(/greater than or equal/u);
  });

  it('INVALID: {float} => throws', () => {
    expect(() => enqueuedCountContract.parse(1.5)).toThrow(/integer/u);
  });
});
