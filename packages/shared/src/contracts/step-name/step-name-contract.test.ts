import { stepNameContract } from './step-name-contract';
import { StepNameStub } from './step-name.stub';

describe('stepNameContract', () => {
  describe('valid step names', () => {
    it('VALID: {value: "work"} => parses and returns branded StepName', () => {
      expect(StepNameStub({ value: 'work' })).toBe('work');
    });

    it('VALID: {value: "a-step-nobody-declared"} => parses, since the graph is free-form', () => {
      expect(StepNameStub({ value: 'a-step-nobody-declared' })).toBe('a-step-nobody-declared');
    });

    it('EDGE: {value: single character} => parses', () => {
      expect(StepNameStub({ value: 'x' })).toBe('x');
    });
  });

  describe('invalid step names', () => {
    it('EMPTY: {value: ""} => throws', () => {
      expect(() => stepNameContract.parse('')).toThrow(/String must contain at least 1/u);
    });
  });
});
