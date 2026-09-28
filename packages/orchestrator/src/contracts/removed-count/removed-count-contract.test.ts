import { removedCountContract } from './removed-count-contract';
import { RemovedCountStub } from './removed-count.stub';

describe('removedCountContract', () => {
  it('VALID: {default} => parses to 0', () => {
    expect(RemovedCountStub()).toBe(0);
  });

  it('VALID: {positive int} => parses', () => {
    expect(removedCountContract.parse(5)).toBe(5);
  });

  it('INVALID: {negative} => throws', () => {
    expect(() => removedCountContract.parse(-1)).toThrow(/Too small: expected number to be >=0/u);
  });

  it('INVALID: {float} => throws', () => {
    expect(() => removedCountContract.parse(1.5)).toThrow(
      /Invalid input: expected int, received number/u,
    );
  });
});
