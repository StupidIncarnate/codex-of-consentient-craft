import { stepAssertionObjectContract } from './step-assertion-object-contract';
import { StepAssertionObjectStub } from './step-assertion-object.stub';

describe('stepAssertionObjectContract', () => {
  describe('valid assertions', () => {
    it('VALID: {prefix: VALID, input, expected} => parses successfully', () => {
      const assertion = StepAssertionObjectStub({
        prefix: 'VALID',
        input: '{price: 100, tax: 0.1}',
        expected: 'returns 110',
      });

      expect(assertion).toStrictEqual({
        prefix: 'VALID',
        input: '{price: 100, tax: 0.1}',
        expected: 'returns 110',
      });
    });

    it('VALID: {id present} => parses with server-stamped id', () => {
      const assertion = StepAssertionObjectStub({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      });

      expect(assertion).toStrictEqual({
        id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        prefix: 'VALID',
        input: '{valid input}',
        expected: 'returns expected result',
      });
    });

    it('VALID: {prefix: VALID, with field} => parses WITHOUT the refine (base object is un-refined)', () => {
      const assertion = stepAssertionObjectContract.parse({
        prefix: 'VALID',
        field: 'name',
        input: '{valid input}',
        expected: 'returns result',
      });

      expect(assertion).toStrictEqual({
        prefix: 'VALID',
        field: 'name',
        input: '{valid input}',
        expected: 'returns result',
      });
    });

    it('VALID: {prefix: INVALID, no field} => parses WITHOUT the refine (base object is un-refined)', () => {
      const assertion = stepAssertionObjectContract.parse({
        prefix: 'INVALID',
        input: '{bad input}',
        expected: 'throws error',
      });

      expect(assertion).toStrictEqual({
        prefix: 'INVALID',
        input: '{bad input}',
        expected: 'throws error',
      });
    });
  });

  describe('invalid assertions', () => {
    it('EMPTY: {missing input and expected} => throws validation error', () => {
      const parseMissing = (): unknown =>
        stepAssertionObjectContract.parse({
          prefix: 'VALID',
        });

      expect(parseMissing).toThrow(/Required/u);
    });

    it('INVALID: {id: "not-a-uuid"} => throws validation error', () => {
      const parseBadId = (): unknown =>
        stepAssertionObjectContract.parse({
          id: 'not-a-uuid',
          prefix: 'VALID',
          input: '{valid input}',
          expected: 'returns result',
        });

      expect(parseBadId).toThrow(/Invalid uuid/u);
    });

    it('INVALID: {prefix: "NONSENSE"} => throws validation error', () => {
      const parseBadPrefix = (): unknown =>
        stepAssertionObjectContract.parse({
          prefix: 'NONSENSE',
          input: '{valid input}',
          expected: 'returns result',
        });

      expect(parseBadPrefix).toThrow(/Invalid enum value/u);
    });
  });
});
