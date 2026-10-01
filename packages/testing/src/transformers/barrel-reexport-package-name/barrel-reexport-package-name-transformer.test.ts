import { barrelReexportPackageNameTransformer } from './barrel-reexport-package-name-transformer';

describe('barrelReexportPackageNameTransformer', () => {
  describe('barrel re-exports a package', () => {
    it('VALID: {export * from an unscoped package} => returns the package name', () => {
      const result = barrelReexportPackageNameTransformer({
        barrelText:
          "/**\n * PURPOSE: x\n */\n\nexport * from 'elkjs';\nexport { default } from 'elkjs';\n",
      });

      expect(result).toBe('elkjs');
    });

    it('VALID: {export * from a scoped package} => returns the scoped name', () => {
      const result = barrelReexportPackageNameTransformer({
        barrelText: 'export * from "@tabler/icons-react";\n',
      });

      expect(result).toBe('@tabler/icons-react');
    });

    it('VALID: {export * from a package subpath} => returns the subpath specifier', () => {
      const result = barrelReexportPackageNameTransformer({
        barrelText: "export * from 'rxjs/operators';\n",
      });

      expect(result).toBe('rxjs/operators');
    });

    it('VALID: {export type * from an ESM-only package} => returns the package name', () => {
      const result = barrelReexportPackageNameTransformer({
        barrelText: "export type * from 'left-pad' with { 'resolution-mode': 'import' };\n",
      });

      expect(result).toBe('left-pad');
    });
  });

  describe('barrel re-exports no package', () => {
    it('EMPTY: {only named re-exports from its own wrappers} => returns null', () => {
      const result = barrelReexportPackageNameTransformer({
        barrelText: "export { readFile } from './read-file/read-file';\n",
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {barrelText: ""} => returns null', () => {
      const result = barrelReexportPackageNameTransformer({ barrelText: '' });

      expect(result).toBe(null);
    });
  });
});
