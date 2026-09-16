import { loadAverageContract } from './load-average-contract';
import { LoadAverageStub } from './load-average.stub';

describe('loadAverageContract', () => {
  it('VALID: {value: [7.9, 6.2, 4.1]} => parses and returns the triple in order', () => {
    const result = LoadAverageStub({ value: [7.9, 6.2, 4.1] });

    expect(result).toStrictEqual([7.9, 6.2, 4.1]);
  });

  it('VALID: {value: [0, 0, 0]} => an idle machine parses as all zeroes', () => {
    const result = LoadAverageStub({ value: [0, 0, 0] });

    expect(result).toStrictEqual([0, 0, 0]);
  });

  it('INVALID: {value: [7.9, 6.2]} => throws for a short tuple', () => {
    expect(() => loadAverageContract.parse([7.9, 6.2])).toThrow(/Array must contain/u);
  });

  it('INVALID: {value: [7.9, 6.2, 4.1, 1.0]} => throws for a long tuple', () => {
    expect(() => loadAverageContract.parse([7.9, 6.2, 4.1, 1.0])).toThrow(/Array must contain/u);
  });

  it('INVALID: {value: ["7.9", 6.2, 4.1]} => throws when the 1-minute slot is not a number', () => {
    expect(() => loadAverageContract.parse(['7.9', 6.2, 4.1])).toThrow(
      /Expected number, received string/u,
    );
  });
});
