import { isImplementationSourceFileGuard } from './is-implementation-source-file-guard';

describe('isImplementationSourceFileGuard', () => {
  describe('valid inputs', () => {
    it('VALID: {filePath: "foo-broker.ts"} => returns true', () => {
      const result = isImplementationSourceFileGuard({ filePath: 'foo-broker.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {filePath: "foo-widget.tsx"} => returns true', () => {
      const result = isImplementationSourceFileGuard({ filePath: 'foo-widget.tsx' });

      expect(result).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it.each([
      'foo-broker.test.ts',
      'foo-widget.test.tsx',
      'foo-broker.proxy.ts',
      'foo-widget.proxy.tsx',
      'foo.stub.ts',
      'foo.harness.ts',
      'foo.integration.test.ts',
      'foo.e2e.ts',
      'foo.d.ts',
    ])('INVALID: {filePath: %s} => returns false', (filePath) => {
      const result = isImplementationSourceFileGuard({ filePath });

      expect(result).toBe(false);
    });

    it('INVALID: {filePath: "package.json"} => returns false', () => {
      const result = isImplementationSourceFileGuard({ filePath: 'package.json' });

      expect(result).toBe(false);
    });
  });
});
