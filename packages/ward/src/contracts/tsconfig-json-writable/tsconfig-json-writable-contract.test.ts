import { TsconfigJsonWritableStub } from './tsconfig-json-writable.stub';
import { tsconfigJsonWritableContract } from './tsconfig-json-writable-contract';

describe('tsconfigJsonWritableContract', () => {
  describe('parse()', () => {
    it('VALID: {empty object} => parses successfully', () => {
      const result = tsconfigJsonWritableContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('VALID: {references only} => parses references array', () => {
      const result = tsconfigJsonWritableContract.parse({
        references: [{ path: '../shared' }],
      });

      expect(result).toStrictEqual({ references: [{ path: '../shared' }] });
    });

    it('VALID: {compilerOptions.composite: true} => parses compilerOptions', () => {
      const result = tsconfigJsonWritableContract.parse({
        compilerOptions: { composite: true },
      });

      expect(result).toStrictEqual({ compilerOptions: { composite: true } });
    });

    it('VALID: {full object with all fields} => parses all fields', () => {
      const result = tsconfigJsonWritableContract.parse({
        compilerOptions: { composite: true, noEmit: false },
        references: [{ path: '../shared' }],
        include: ['src/**/*'],
        exclude: ['node_modules'],
      });

      expect(result).toStrictEqual({
        compilerOptions: { composite: true, noEmit: false },
        references: [{ path: '../shared' }],
        include: ['src/**/*'],
        exclude: ['node_modules'],
      });
    });

    it('VALID: {passthrough fields} => preserves unknown fields', () => {
      const result = tsconfigJsonWritableContract.parse({
        extends: '../../tsconfig.json',
        compilerOptions: { outDir: './dist', composite: true },
      });

      expect(result).toStrictEqual({
        extends: '../../tsconfig.json',
        compilerOptions: { outDir: './dist', composite: true },
      });
    });
  });

  describe('TsconfigJsonWritableStub', () => {
    it('VALID: default stub => produces valid contract value', () => {
      const result = TsconfigJsonWritableStub();

      expect(result).toStrictEqual({
        compilerOptions: { composite: true },
        references: [],
      });
    });

    it('VALID: {references: [path: ../shared]} => stub overrides references', () => {
      const result = TsconfigJsonWritableStub({ references: [{ path: '../shared' }] });

      expect(result).toStrictEqual({
        compilerOptions: { composite: true },
        references: [{ path: '../shared' }],
      });
    });
  });
});
