import { runFiltersContract } from './run-filters-contract';
import { RunFiltersStub } from './run-filters.stub';

describe('runFiltersContract', () => {
  describe('valid inputs', () => {
    it('VALID: {all fields} => parses successfully', () => {
      const result = runFiltersContract.parse(
        RunFiltersStub({ committed: true, only: ['lint', 'unit'] }),
      );

      expect(result).toStrictEqual({
        committed: true,
        only: ['lint', 'unit'],
      });
    });

    it('VALID: {empty object} => parses with all optional fields omitted', () => {
      const result = runFiltersContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('VALID: {only changed} => parses boolean filter', () => {
      const result = runFiltersContract.parse({ committed: false });

      expect(result).toStrictEqual({ committed: false });
    });

    it('VALID: {empty only array} => parses empty array', () => {
      const result = runFiltersContract.parse({ only: [] });

      expect(result).toStrictEqual({ only: [] });
    });

    it('VALID: {passthrough with file paths} => parses passthrough array', () => {
      const result = runFiltersContract.parse({
        passthrough: ['packages/ward/src/index.test.ts'],
      });

      expect(result).toStrictEqual({
        passthrough: ['packages/ward/src/index.test.ts'],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {only: ["invalid"]} => throws for invalid check type', () => {
      expect(() => runFiltersContract.parse({ only: ['invalid'] })).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {committed: "yes"} => throws for non-boolean', () => {
      expect(() => runFiltersContract.parse({ committed: 'yes' })).toThrow(/Expected boolean/u);
    });

    it('INVALID: {passthrough: [123]} => throws for non-string element', () => {
      expect(() => runFiltersContract.parse({ passthrough: [123] })).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid run filters', () => {
      const result = RunFiltersStub();

      expect(result).toStrictEqual({});
    });

    it('VALID: {custom values} => creates run filters with overrides', () => {
      const result = RunFiltersStub({ committed: true, only: ['lint'] });

      expect(result).toStrictEqual({
        committed: true,
        only: ['lint'],
      });
    });
  });
});
