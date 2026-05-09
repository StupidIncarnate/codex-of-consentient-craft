import { stepAssertionContract } from './step-assertion-contract';
import { StepAssertionStub } from './step-assertion.stub';

describe('stepAssertionContract', () => {
  describe('valid assertions', () => {
    it('VALID: {prefix: VALID, input, expected} => parses successfully', () => {
      const assertion = StepAssertionStub({
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

    it('VALID: {prefix: INVALID, field, input, expected} => parses with field', () => {
      const assertion = StepAssertionStub({
        prefix: 'INVALID',
        field: 'email',
        input: '{email: "not-an-email"}',
        expected: 'throws validation error',
      });

      expect(assertion).toStrictEqual({
        prefix: 'INVALID',
        field: 'email',
        input: '{email: "not-an-email"}',
        expected: 'throws validation error',
      });
    });

    it('VALID: {prefix: INVALID_MULTIPLE, field} => parses with optional field', () => {
      const assertion = StepAssertionStub({
        prefix: 'INVALID_MULTIPLE',
        field: 'name',
        input: '{name: "", email: "bad"}',
        expected: 'throws multiple validation errors',
      });

      expect(assertion).toStrictEqual({
        prefix: 'INVALID_MULTIPLE',
        field: 'name',
        input: '{name: "", email: "bad"}',
        expected: 'throws multiple validation errors',
      });
    });

    it('VALID: {prefix: INVALID_MULTIPLE, no field} => parses without field', () => {
      const assertion = StepAssertionStub({
        prefix: 'INVALID_MULTIPLE',
        input: '{missing name and email}',
        expected: 'throws validation error',
      });

      expect(assertion).toStrictEqual({
        prefix: 'INVALID_MULTIPLE',
        input: '{missing name and email}',
        expected: 'throws validation error',
      });
    });

    it('VALID: {prefix: ERROR, input, expected} => parses error assertion', () => {
      const assertion = StepAssertionStub({
        prefix: 'ERROR',
        input: '{network timeout}',
        expected: 'throws connection error',
      });

      expect(assertion).toStrictEqual({
        prefix: 'ERROR',
        input: '{network timeout}',
        expected: 'throws connection error',
      });
    });

    it('VALID: {prefix: EDGE, input, expected} => parses edge assertion', () => {
      const assertion = StepAssertionStub({
        prefix: 'EDGE',
        input: '{max int value}',
        expected: 'handles overflow gracefully',
      });

      expect(assertion).toStrictEqual({
        prefix: 'EDGE',
        input: '{max int value}',
        expected: 'handles overflow gracefully',
      });
    });

    it('VALID: {prefix: EMPTY, input, expected} => parses empty assertion', () => {
      const assertion = StepAssertionStub({
        prefix: 'EMPTY',
        input: '{null user}',
        expected: 'returns default response',
      });

      expect(assertion).toStrictEqual({
        prefix: 'EMPTY',
        input: '{null user}',
        expected: 'returns default response',
      });
    });

    it('VALID: {observablesSatisfied populated} => parses with assertion-level observable claims', () => {
      const assertion = StepAssertionStub({
        prefix: 'VALID',
        input: '{session row with questStatus="in_progress"}',
        expected: 'no SESSION_ROW_DELETE_SKULL element present within that row',
        observablesSatisfied: ['no-skull-while-running'],
      });

      expect(assertion).toStrictEqual({
        prefix: 'VALID',
        input: '{session row with questStatus="in_progress"}',
        expected: 'no SESSION_ROW_DELETE_SKULL element present within that row',
        observablesSatisfied: ['no-skull-while-running'],
      });
    });

    it('VALID: {observablesSatisfied omitted} => parses without the optional field', () => {
      const assertion = StepAssertionStub();

      expect('observablesSatisfied' in assertion).toBe(false);
    });
  });

  describe('invalid assertions', () => {
    it('INVALID: {prefix: INVALID, no field} => throws validation error', () => {
      const parseWithoutField = (): unknown =>
        stepAssertionContract.parse({
          prefix: 'INVALID',
          input: '{bad input}',
          expected: 'throws error',
        });

      expect(parseWithoutField).toThrow(
        /field is required for INVALID prefix and forbidden for non-INVALID\/INVALID_MULTIPLE prefixes/u,
      );
    });

    it('INVALID: {prefix: VALID, with field} => throws validation error', () => {
      const parseWithField = (): unknown =>
        stepAssertionContract.parse({
          prefix: 'VALID',
          field: 'name',
          input: '{valid input}',
          expected: 'returns result',
        });

      expect(parseWithField).toThrow(
        /field is required for INVALID prefix and forbidden for non-INVALID\/INVALID_MULTIPLE prefixes/u,
      );
    });

    it('INVALID: {prefix: ERROR, with field} => throws validation error', () => {
      const parseWithField = (): unknown =>
        stepAssertionContract.parse({
          prefix: 'ERROR',
          field: 'name',
          input: '{error input}',
          expected: 'throws error',
        });

      expect(parseWithField).toThrow(
        /field is required for INVALID prefix and forbidden for non-INVALID\/INVALID_MULTIPLE prefixes/u,
      );
    });

    it('INVALID: {prefix: EDGE, with field} => throws validation error', () => {
      const parseWithField = (): unknown =>
        stepAssertionContract.parse({
          prefix: 'EDGE',
          field: 'count',
          input: '{edge input}',
          expected: 'handles edge case',
        });

      expect(parseWithField).toThrow(
        /field is required for INVALID prefix and forbidden for non-INVALID\/INVALID_MULTIPLE prefixes/u,
      );
    });

    it('INVALID: {prefix: EMPTY, with field} => throws validation error', () => {
      const parseWithField = (): unknown =>
        stepAssertionContract.parse({
          prefix: 'EMPTY',
          field: 'value',
          input: '{empty input}',
          expected: 'returns default',
        });

      expect(parseWithField).toThrow(
        /field is required for INVALID prefix and forbidden for non-INVALID\/INVALID_MULTIPLE prefixes/u,
      );
    });

    it('INVALID: {input: ""} => throws validation error', () => {
      const parseEmptyInput = (): unknown =>
        stepAssertionContract.parse({
          prefix: 'VALID',
          input: '',
          expected: 'returns result',
        });

      expect(parseEmptyInput).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {expected: ""} => throws validation error', () => {
      const parseEmptyExpected = (): unknown =>
        stepAssertionContract.parse({
          prefix: 'VALID',
          input: '{valid input}',
          expected: '',
        });

      expect(parseEmptyExpected).toThrow(/String must contain at least 1 character/u);
    });

    it('EMPTY: {missing input and expected} => throws validation error', () => {
      const parseMissing = (): unknown =>
        stepAssertionContract.parse({
          prefix: 'VALID',
        });

      expect(parseMissing).toThrow(/Required/u);
    });
  });
});
