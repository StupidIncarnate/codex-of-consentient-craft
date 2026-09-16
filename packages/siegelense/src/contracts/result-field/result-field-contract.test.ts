import { resultFieldContract } from './result-field-contract';
import { ResultFieldStub } from './result-field.stub';

describe('resultFieldContract', () => {
  it('VALID: {value: "status"} => parses successfully', () => {
    const resultField = ResultFieldStub({ value: 'status' });

    const result = resultFieldContract.parse(resultField);

    expect(result).toBe('status');
  });

  it('INVALID: {value: ""} => an empty field name throws validation error', () => {
    expect(() => {
      resultFieldContract.parse('');
    }).toThrow(/String must contain at least 1 character/u);
  });

  it('EDGE: {value: "a"} => a single-character field name parses successfully', () => {
    const result = resultFieldContract.parse('a');

    expect(result).toBe('a');
  });
});
