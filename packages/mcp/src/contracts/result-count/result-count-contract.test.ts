import { resultCountContract as _resultCountContract } from './result-count-contract';
import { ResultCountStub } from './result-count.stub';

describe('resultCountContract', () => {
  it('VALID: {value: 0} => parses successfully', () => {
    const result = ResultCountStub({ value: 0 });

    expect(result).toBe(0);
  });

  it('VALID: {value: 42} => parses successfully', () => {
    const result = ResultCountStub({ value: 42 });

    expect(result).toBe(42);
  });

  it('VALID: {value: 1000} => parses successfully', () => {
    const result = ResultCountStub({ value: 1000 });

    expect(result).toBe(1000);
  });
});
