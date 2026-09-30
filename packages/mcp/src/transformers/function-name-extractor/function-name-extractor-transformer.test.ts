import { functionNameExtractorTransformer } from './function-name-extractor-transformer';

describe('functionNameExtractorTransformer', () => {
  describe('valid paths with .ts extension', () => {
    it('VALID: {filepath: "/path/to/user-fetch-broker.ts"} => returns "user-fetch-broker"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/path/to/user-fetch-broker.ts',
      });

      expect(result).toStrictEqual('user-fetch-broker');
    });

    it('VALID: {filepath: "/user-profile-broker.ts"} => returns "user-profile-broker"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/user-profile-broker.ts',
      });

      expect(result).toStrictEqual('user-profile-broker');
    });

    it('VALID: {filepath: "simple-file.ts"} => returns "simple-file"', () => {
      const result = functionNameExtractorTransformer({
        filepath: 'simple-file.ts',
      });

      expect(result).toStrictEqual('simple-file');
    });
  });

  describe('valid paths with .tsx extension', () => {
    it('VALID: {filepath: "/components/user-widget.tsx"} => returns "user-widget"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/components/user-widget.tsx',
      });

      expect(result).toStrictEqual('user-widget');
    });

    it('VALID: {filepath: "/path/to/deeply/nested/component.tsx"} => returns "component"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/path/to/deeply/nested/component.tsx',
      });

      expect(result).toStrictEqual('component');
    });

    it('VALID: {filepath: "standalone.tsx"} => returns "standalone"', () => {
      const result = functionNameExtractorTransformer({
        filepath: 'standalone.tsx',
      });

      expect(result).toStrictEqual('standalone');
    });
  });

  describe('edge cases with dots in filename', () => {
    it('EDGE: {filepath: "/path/file.test.ts"} => returns "file.test"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/path/file.test.ts',
      });

      expect(result).toStrictEqual('file.test');
    });

    it('EDGE: {filepath: "/path/file.spec.tsx"} => returns "file.spec"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/path/file.spec.tsx',
      });

      expect(result).toStrictEqual('file.spec');
    });

    it('EDGE: {filepath: "/path/file.proxy.ts"} => returns "file.proxy"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/path/file.proxy.ts',
      });

      expect(result).toStrictEqual('file.proxy');
    });
  });

  describe('edge cases without typescript extension', () => {
    it('EDGE: {filepath: "/path/to/readme.md"} => returns "readme.md"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/path/to/readme.md',
      });

      expect(result).toStrictEqual('readme.md');
    });

    it('EDGE: {filepath: "/path/config.json"} => returns "config.json"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/path/config.json',
      });

      expect(result).toStrictEqual('config.json');
    });

    it('EDGE: {filepath: "/path/noextension"} => returns "noextension"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/path/noextension',
      });

      expect(result).toStrictEqual('noextension');
    });
  });

  describe('edge cases with unusual path separators', () => {
    it('EDGE: {filepath: "/path//double//slash//file.ts"} => returns "file"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/path//double//slash//file.ts',
      });

      expect(result).toStrictEqual('file');
    });

    it('EDGE: {filepath: "///leading-slashes.ts"} => returns "leading-slashes"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '///leading-slashes.ts',
      });

      expect(result).toStrictEqual('leading-slashes');
    });

    it('EDGE: {filepath: "/trailing/slash/.ts"} => returns ""', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/trailing/slash/.ts',
      });

      expect(result).toStrictEqual('');
    });
  });

  describe('edge cases with empty results', () => {
    it('EDGE: {filepath: "/"} => returns ""', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/',
      });

      expect(result).toStrictEqual('');
    });

    it('EDGE: {filepath: ""} => returns ""', () => {
      const result = functionNameExtractorTransformer({
        filepath: '',
      });

      expect(result).toStrictEqual('');
    });

    it('EDGE: {filepath: ".ts"} => returns ""', () => {
      const result = functionNameExtractorTransformer({
        filepath: '.ts',
      });

      expect(result).toStrictEqual('');
    });

    it('EDGE: {filepath: ".tsx"} => returns ""', () => {
      const result = functionNameExtractorTransformer({
        filepath: '.tsx',
      });

      expect(result).toStrictEqual('');
    });
  });

  describe('edge cases with special characters', () => {
    it('EDGE: {filepath: "/path/file-with-dashes.ts"} => returns "file-with-dashes"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/path/file-with-dashes.ts',
      });

      expect(result).toStrictEqual('file-with-dashes');
    });

    it('EDGE: {filepath: "/path/file_with_underscores.tsx"} => returns "file_with_underscores"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/path/file_with_underscores.tsx',
      });

      expect(result).toStrictEqual('file_with_underscores');
    });

    it('EDGE: {filepath: "/path/123-numeric-prefix.ts"} => returns "123-numeric-prefix"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/path/123-numeric-prefix.ts',
      });

      expect(result).toStrictEqual('123-numeric-prefix');
    });
  });

  describe('edge cases with misleading extensions', () => {
    it('EDGE: {filepath: "/path/file.typescript"} => returns "file.typescript"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/path/file.typescript',
      });

      expect(result).toStrictEqual('file.typescript');
    });

    it('EDGE: {filepath: "/path/file.tsx.backup"} => returns "file.tsx.backup"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/path/file.tsx.backup',
      });

      expect(result).toStrictEqual('file.tsx.backup');
    });

    it('EDGE: {filepath: "/path/.tst"} => returns ".tst"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/path/.tst',
      });

      expect(result).toStrictEqual('.tst');
    });
  });

  describe('javascript extensions', () => {
    it('VALID: {filepath: "/path/to/user-fetch-broker.js"} => returns "user-fetch-broker"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/path/to/user-fetch-broker.js',
      });

      expect(result).toStrictEqual('user-fetch-broker');
    });

    it('VALID: {filepath: "/components/user-widget.jsx"} => returns "user-widget"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/components/user-widget.jsx',
      });

      expect(result).toStrictEqual('user-widget');
    });

    it('VALID: {filepath: "simple-file.js"} => returns "simple-file"', () => {
      const result = functionNameExtractorTransformer({
        filepath: 'simple-file.js',
      });

      expect(result).toStrictEqual('simple-file');
    });

    it('VALID: {filepath: "component.jsx"} => returns "component"', () => {
      const result = functionNameExtractorTransformer({
        filepath: 'component.jsx',
      });

      expect(result).toStrictEqual('component');
    });

    it('EDGE: {filepath: "/path/file.test.js"} => returns "file.test"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/path/file.test.js',
      });

      expect(result).toStrictEqual('file.test');
    });

    it('EDGE: {filepath: "/path/file.proxy.jsx"} => returns "file.proxy"', () => {
      const result = functionNameExtractorTransformer({
        filepath: '/path/file.proxy.jsx',
      });

      expect(result).toStrictEqual('file.proxy');
    });

    it('EDGE: {filepath: ".js"} => returns ""', () => {
      const result = functionNameExtractorTransformer({
        filepath: '.js',
      });

      expect(result).toStrictEqual('');
    });

    it('EDGE: {filepath: ".jsx"} => returns ""', () => {
      const result = functionNameExtractorTransformer({
        filepath: '.jsx',
      });

      expect(result).toStrictEqual('');
    });
  });
});
