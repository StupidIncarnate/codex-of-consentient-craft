import { validateSpecInputContract } from './validate-spec-input-contract';
import { ValidateSpecInputStub } from './validate-spec-input.stub';

describe('validateSpecInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: "add-auth"} => parses successfully', () => {
      const input = ValidateSpecInputStub({ questId: 'add-auth' });

      const result = validateSpecInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth' });
    });

    it('VALID: {default stub} => parses with default stub value', () => {
      const input = ValidateSpecInputStub();

      const result = validateSpecInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: ""} => throws validation error', () => {
      expect(() => {
        return validateSpecInputContract.parse({ questId: '' });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() => {
        return validateSpecInputContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
