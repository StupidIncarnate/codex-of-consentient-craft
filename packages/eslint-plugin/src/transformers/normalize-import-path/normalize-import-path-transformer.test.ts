import { normalizeImportPathTransformer } from './normalize-import-path-transformer';

describe('normalizeImportPathTransformer', () => {
  describe('normalizing proxy imports', () => {
    it('VALID: {importPath: "./user-broker.proxy.ts"} => returns "./user-broker.proxy"', () => {
      const result = normalizeImportPathTransformer({ importPath: './user-broker.proxy.ts' });

      expect(result).toBe('./user-broker.proxy');
    });

    it('VALID: {importPath: "./user-widget.proxy.tsx"} => returns "./user-widget.proxy"', () => {
      const result = normalizeImportPathTransformer({ importPath: './user-widget.proxy.tsx' });

      expect(result).toBe('./user-widget.proxy');
    });

    it('VALID: {importPath: "../http-adapter.proxy.ts"} => returns "../http-adapter.proxy"', () => {
      const result = normalizeImportPathTransformer({
        importPath: '../http-adapter.proxy.ts',
      });

      expect(result).toBe('../http-adapter.proxy');
    });
  });

  describe('normalizing regular imports', () => {
    it('VALID: {importPath: "./user-broker.ts"} => returns "./user-broker"', () => {
      const result = normalizeImportPathTransformer({ importPath: './user-broker.ts' });

      expect(result).toBe('./user-broker');
    });

    it('VALID: {importPath: "./user-widget.tsx"} => returns "./user-widget"', () => {
      const result = normalizeImportPathTransformer({ importPath: './user-widget.tsx' });

      expect(result).toBe('./user-widget');
    });

    it('VALID: {importPath: "../user-contract.ts"} => returns "../user-contract"', () => {
      const result = normalizeImportPathTransformer({ importPath: '../user-contract.ts' });

      expect(result).toBe('../user-contract');
    });
  });

  describe('edge cases', () => {
    it('VALID: {importPath: "./user-broker.proxy"} => returns "./user-broker.proxy"', () => {
      const result = normalizeImportPathTransformer({ importPath: './user-broker.proxy' });

      expect(result).toBe('./user-broker.proxy');
    });

    it('VALID: {importPath: "./user-broker"} => returns "./user-broker"', () => {
      const result = normalizeImportPathTransformer({ importPath: './user-broker' });

      expect(result).toBe('./user-broker');
    });

    it('VALID: {importPath: "axios"} => returns "axios"', () => {
      const result = normalizeImportPathTransformer({ importPath: 'axios' });

      expect(result).toBe('axios');
    });
  });
});
