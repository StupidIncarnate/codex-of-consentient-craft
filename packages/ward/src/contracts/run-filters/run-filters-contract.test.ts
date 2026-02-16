import { runFiltersContract } from './run-filters-contract';
import { RunFiltersStub } from './run-filters.stub';

describe('runFiltersContract', () => {
  describe('valid inputs', () => {
    it('VALID: {all fields} => parses successfully', () => {
      const result = runFiltersContract.parse(
        RunFiltersStub({ glob: 'packages/ward/**', changed: true, only: ['lint', 'test'] }),
      );

      expect(result).toStrictEqual({
        glob: 'packages/ward/**',
        changed: true,
        only: ['lint', 'test'],
      });
    });

    it('VALID: {empty object} => parses with all optional fields omitted', () => {
      const result = runFiltersContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('VALID: {only glob} => parses with single field', () => {
      const result = runFiltersContract.parse({ glob: 'src/**' });

      expect(result).toStrictEqual({ glob: 'src/**' });
    });

    it('VALID: {only changed} => parses boolean filter', () => {
      const result = runFiltersContract.parse({ changed: false });

      expect(result).toStrictEqual({ changed: false });
    });

    it('VALID: {empty only array} => parses empty array', () => {
      const result = runFiltersContract.parse({ only: [] });

      expect(result).toStrictEqual({ only: [] });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_ONLY: {only: ["invalid"]} => throws for invalid check type', () => {
      expect(() => runFiltersContract.parse({ only: ['invalid'] })).toThrow(/Invalid enum value/u);
    });

    it('INVALID_CHANGED: {changed: "yes"} => throws for non-boolean', () => {
      expect(() => runFiltersContract.parse({ changed: 'yes' })).toThrow(/Expected boolean/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid run filters', () => {
      const result = RunFiltersStub();

      expect(result).toStrictEqual({});
    });

    it('VALID: {custom values} => creates run filters with overrides', () => {
      const result = RunFiltersStub({ glob: 'test/**', changed: true });

      expect(result).toStrictEqual({
        glob: 'test/**',
        changed: true,
      });
    });
  });
});
