import { tsconfigJsonContract } from './tsconfig-json-contract';
import { TsconfigJsonStub } from './tsconfig-json.stub';

describe('tsconfigJsonContract', () => {
  describe('valid inputs', () => {
    it('VALID: {include and exclude} => parses successfully', () => {
      const result = tsconfigJsonContract.parse(TsconfigJsonStub());

      expect(result).toStrictEqual({
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist'],
      });
    });

    it('VALID: {empty object} => parses with no fields', () => {
      const result = tsconfigJsonContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('VALID: {extra fields like compilerOptions} => parses with passthrough', () => {
      const result = tsconfigJsonContract.parse({
        compilerOptions: { strict: true },
        include: ['src'],
      });

      expect(result).toStrictEqual({
        compilerOptions: { strict: true },
        include: ['src'],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {include: "string"} => throws validation error', () => {
      expect(() =>
        tsconfigJsonContract.parse({
          include: 'src',
        }),
      ).toThrow(/Expected array/u);
    });

    it('INVALID: {exclude: [42]} => throws validation error', () => {
      expect(() =>
        tsconfigJsonContract.parse({
          exclude: [42],
        }),
      ).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid tsconfig', () => {
      const result = TsconfigJsonStub();

      expect(result).toStrictEqual({
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist'],
      });
    });

    it('VALID: {override include} => uses override', () => {
      const result = TsconfigJsonStub({ include: ['app'] });

      expect(result).toStrictEqual({
        include: ['app'],
        exclude: ['node_modules', 'dist'],
      });
    });
  });
});
