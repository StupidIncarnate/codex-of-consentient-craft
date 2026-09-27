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

  describe('empty source', () => {
    it('EMPTY: {sourceText: no exports} => returns empty arrays', () => {
      const result = gatewayWrapperExportedNamesTransformer({
        sourceText: '/** PURPOSE: nothing to see */\n',
      });

      expect(result).toStrictEqual({ valueNames: [], typeNames: [] });
    });
  });
});
