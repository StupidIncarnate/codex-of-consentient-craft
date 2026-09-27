import { gatewayTypeDeclarationNamesTransformer } from './gateway-type-declaration-names-transformer';

describe('gatewayTypeDeclarationNamesTransformer', () => {
  describe('interface declarations', () => {
    it('VALID: {sourceText: one exported interface} => returns its name', () => {
      const sourceText = 'export interface WalkedFile {\n  path: unknown;\n}\n';

      expect(gatewayTypeDeclarationNamesTransformer({ sourceText })).toStrictEqual(['WalkedFile']);
    });
  });

  describe('type alias declarations', () => {
    it('VALID: {sourceText: one exported type alias} => returns its name', () => {
      const sourceText = 'export type FsError = unknown;\n';

      expect(gatewayTypeDeclarationNamesTransformer({ sourceText })).toStrictEqual(['FsError']);
    });
  });

  describe('multiple declarations', () => {
    it('VALID: {sourceText: an interface and a type alias} => returns both names in source order', () => {
      const sourceText = [
        'export interface WalkedFile {\n  path: unknown;\n}\n',
        'export type TailFileHandle = unknown;\n',
      ].join('\n');

      expect(gatewayTypeDeclarationNamesTransformer({ sourceText })).toStrictEqual([
        'WalkedFile',
        'TailFileHandle',
      ]);
    });
  });

  describe('no type declarations', () => {
    it('EMPTY: {sourceText: only a function export} => returns an empty array', () => {
      const sourceText = 'export const walkFilesSync = (): void => undefined;\n';

      expect(gatewayTypeDeclarationNamesTransformer({ sourceText })).toStrictEqual([]);
    });

    it('EMPTY: {sourceText: an empty string} => returns an empty array', () => {
      expect(gatewayTypeDeclarationNamesTransformer({ sourceText: '' })).toStrictEqual([]);
    });
  });
});
