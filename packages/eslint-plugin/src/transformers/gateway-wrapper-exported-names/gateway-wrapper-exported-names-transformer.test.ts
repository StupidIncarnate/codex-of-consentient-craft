import { gatewayWrapperExportedNamesTransformer } from './gateway-wrapper-exported-names-transformer';

describe('gatewayWrapperExportedNamesTransformer', () => {
  describe('value exports', () => {
    it('VALID: {sourceText: export const} => returns its name as a value name', () => {
      const result = gatewayWrapperExportedNamesTransformer({
        sourceText: 'export const readFileSync = (): string => "";\n',
      });

      expect(result).toStrictEqual({ valueNames: ['readFileSync'], typeNames: [] });
    });

    it('VALID: {sourceText: export function} => returns its name as a value name', () => {
      const result = gatewayWrapperExportedNamesTransformer({
        sourceText: 'export function readFileSync() {}\n',
      });

      expect(result).toStrictEqual({ valueNames: ['readFileSync'], typeNames: [] });
    });

    it('VALID: {sourceText: export class} => returns its name as a value name', () => {
      const result = gatewayWrapperExportedNamesTransformer({
        sourceText: 'export class GitNotInstalledError extends Error {}\n',
      });

      expect(result).toStrictEqual({ valueNames: ['GitNotInstalledError'], typeNames: [] });
    });
  });

  describe('type exports', () => {
    it('VALID: {sourceText: export interface} => returns its name as a type name', () => {
      const result = gatewayWrapperExportedNamesTransformer({
        sourceText: 'export interface FsError {\n  code: string;\n}\n',
      });

      expect(result).toStrictEqual({ valueNames: [], typeNames: ['FsError'] });
    });

    it('VALID: {sourceText: export type} => returns its name as a type name', () => {
      const result = gatewayWrapperExportedNamesTransformer({
        sourceText: 'export type PathMatcher = string | ((value: unknown) => boolean);\n',
      });

      expect(result).toStrictEqual({ valueNames: [], typeNames: ['PathMatcher'] });
    });
  });

  describe('destructured global captures', () => {
    it('VALID: {sourceText: export const { name } = process;} => returns the bound name as a value name', () => {
      const result = gatewayWrapperExportedNamesTransformer({
        sourceText: 'export const { argv } = process;\n',
      });

      expect(result).toStrictEqual({ valueNames: ['argv'], typeNames: [] });
    });

    it('VALID: {sourceText: export const { a, b } = process;} => returns every bound name as a value name', () => {
      const result = gatewayWrapperExportedNamesTransformer({
        sourceText: 'export const { argv, env } = process;\n',
      });

      expect(result).toStrictEqual({ valueNames: ['argv', 'env'], typeNames: [] });
    });
  });

  describe('mixed exports', () => {
    it('VALID: {sourceText: import plus one export const} => ignores the import, returns the value name', () => {
      const result = gatewayWrapperExportedNamesTransformer({
        sourceText:
          "import { isNativeError } from 'util/types';\nexport const isFsError = (): boolean => false;\n",
      });

      expect(result).toStrictEqual({ valueNames: ['isFsError'], typeNames: [] });
    });
  });

  describe('export text outside a real declaration', () => {
    it('VALID: {a USAGE comment quoting an export statement} => returns only the real export', () => {
      const result = gatewayWrapperExportedNamesTransformer({
        sourceText:
          "/**\n * USAGE:\n * const text = await catFileBlob({ ref: 'HEAD', path: 'src/x.ts', cwd: '/repo' });\n * // Returns 'export const x = 1;\\n'\n */\nexport const catFileBlob = (): string => '';\n",
      });

      expect(result).toStrictEqual({ valueNames: ['catFileBlob'], typeNames: [] });
    });

    it('VALID: {a line comment and a string holding export text} => returns only the real export', () => {
      const result = gatewayWrapperExportedNamesTransformer({
        sourceText:
          "// export const fromComment = 1;\nexport const sample = 'export function fromString() {}';\n",
      });

      expect(result).toStrictEqual({ valueNames: ['sample'], typeNames: [] });
    });

    it('VALID: {a non-exported const and a nested export-looking line} => returns no names', () => {
      const result = gatewayWrapperExportedNamesTransformer({
        sourceText: 'const local = 1;\nnamespace inner {\n  export const nested = local;\n}\n',
      });

      expect(result).toStrictEqual({ valueNames: [], typeNames: [] });
    });
  });

  describe('empty source', () => {
    it('EMPTY: {sourceText: no exports} => returns empty arrays', () => {
      const result = gatewayWrapperExportedNamesTransformer({
        sourceText: '/** PURPOSE: nothing to see */\n',
      });

      expect(result).toStrictEqual({ valueNames: [], typeNames: [] });
    });
  });
});
