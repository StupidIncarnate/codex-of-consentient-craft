import { coercedBooleanInputContract } from './coerced-boolean-input-contract';
import { CoercedBooleanInputStub } from './coerced-boolean-input.stub';

describe('coercedBooleanInputContract', () => {
  it('VALID: {true} => returns true', () => {
    const result = CoercedBooleanInputStub({ value: true });

    expect(result).toBe(true);
  });

  it('VALID: {false} => returns false', () => {
    const result = CoercedBooleanInputStub({ value: false });

    expect(result).toBe(false);
  });

  it('VALID: {"true"} => coerces string to boolean true', () => {
    const result = CoercedBooleanInputStub({ value: 'true' });

    expect(result).toBe(true);
  });

  it('VALID: {"false"} => coerces string to boolean false', () => {
    const result = CoercedBooleanInputStub({ value: 'false' });

    expect(result).toBe(false);
  });

  it('INVALID: {"yes"} => throws Expected boolean error', () => {
    expect(() => coercedBooleanInputContract.parse('yes')).toThrow(/Expected boolean/u);
  });

  it('INVALID: {""} => throws Expected boolean error', () => {
    expect(() => coercedBooleanInputContract.parse('')).toThrow(/Expected boolean/u);
  });

  it('INVALID: {1} => throws Expected boolean error', () => {
    expect(() => coercedBooleanInputContract.parse(1)).toThrow(/Expected boolean/u);
  });

  it('INVALID: {0} => throws Expected boolean error', () => {
    expect(() => coercedBooleanInputContract.parse(0)).toThrow(/Expected boolean/u);
  });

  it('INVALID: {null} => throws Expected boolean error', () => {
    expect(() => coercedBooleanInputContract.parse(null)).toThrow(/Expected boolean/u);
  });

  it('INVALID: {undefined} => throws Required error', () => {
    expect(() => coercedBooleanInputContract.parse(undefined)).toThrow(/Required/u);
  });
});
