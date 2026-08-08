import { toolDisplayLabelContract } from './tool-display-label-contract';
import { ToolDisplayLabelStub } from './tool-display-label.stub';

describe('toolDisplayLabelContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "git diff"} => parses a multi-word command label', () => {
      const result = toolDisplayLabelContract.parse('git diff');

      expect(result).toBe('git diff');
    });

    it('VALID: {value: "discover"} => parses a bare tool label', () => {
      const result = toolDisplayLabelContract.parse('discover');

      expect(result).toBe('discover');
    });

    it('VALID: {value: "Skill: commit"} => parses a qualified label', () => {
      const result = toolDisplayLabelContract.parse('Skill: commit');

      expect(result).toBe('Skill: commit');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: ""} => throws for empty string', () => {
      expect(() => toolDisplayLabelContract.parse('')).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('INVALID: {value: 123} => throws for number', () => {
      expect(() => toolDisplayLabelContract.parse(123)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => toolDisplayLabelContract.parse(null)).toThrow(/Expected string/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => toolDisplayLabelContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates label with default value "git diff"', () => {
      const result = ToolDisplayLabelStub();

      expect(result).toBe('git diff');
    });

    it('VALID: {value: "discover"} => creates label with custom value', () => {
      const result = ToolDisplayLabelStub({ value: 'discover' });

      expect(result).toBe('discover');
    });
  });
});
