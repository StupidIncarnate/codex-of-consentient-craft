import { stepHandlerNameContract } from './step-handler-name-contract';
import { StepHandlerNameStub } from './step-handler-name.stub';

describe('stepHandlerNameContract', () => {
  describe('valid names', () => {
    it.each(stepHandlerNameContract.options)('VALID: {value: %s} => parses to itself', (value) => {
      expect(stepHandlerNameContract.parse(StepHandlerNameStub({ value }))).toBe(value);
    });
  });

  describe('invalid names', () => {
    it('INVALID: {value: "wardFull"} => throws — a family name is not a handler name', () => {
      expect(() => stepHandlerNameContract.parse('wardFull')).toThrow(/wardFull/u);
    });

    it('INVALID: {value: ""} => throws', () => {
      expect(() => stepHandlerNameContract.parse('')).toThrow(/Invalid enum value/u);
    });
  });

  it('VALID: {options} => is exactly the four built handlers', () => {
    expect(stepHandlerNameContract.options).toStrictEqual([
      'ward',
      'riftcarver',
      'commit',
      'cleanup',
    ]);
  });
});
