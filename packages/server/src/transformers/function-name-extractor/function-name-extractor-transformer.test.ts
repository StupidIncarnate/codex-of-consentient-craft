import { functionNameExtractorTransformer } from './function-name-extractor-transformer';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';
import { FunctionNameStub } from '../../contracts/function-name/function-name.stub';

describe('functionNameExtractorTransformer', () => {
  describe('valid paths with .ts extension', () => {
    it('VALID: {filepath: "/path/to/user-fetch-broker.ts"} => returns "user-fetch-broker"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/path/to/user-fetch-broker.ts' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'user-fetch-broker' }));
    });

    it('VALID: {filepath: "/user-profile-broker.ts"} => returns "user-profile-broker"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/user-profile-broker.ts' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'user-profile-broker' }));
    });

    it('VALID: {filepath: "simple-file.ts"} => returns "simple-file"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: 'simple-file.ts' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'simple-file' }));
    });
  });

  describe('valid paths with .tsx extension', () => {
    it('VALID: {filepath: "/components/user-widget.tsx"} => returns "user-widget"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/components/user-widget.tsx' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'user-widget' }));
    });

    it('VALID: {filepath: "/path/to/deeply/nested/component.tsx"} => returns "component"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({
          value: '/path/to/deeply/nested/component.tsx',
        }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'component' }));
    });

    it('VALID: {filepath: "standalone.tsx"} => returns "standalone"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: 'standalone.tsx' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'standalone' }));
    });
  });

  describe('edge cases with dots in filename', () => {
    it('EDGE: {filepath: "/path/file.test.ts"} => returns "file.test"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/path/file.test.ts' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'file.test' }));
    });

    it('EDGE: {filepath: "/path/file.spec.tsx"} => returns "file.spec"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/path/file.spec.tsx' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'file.spec' }));
    });

    it('EDGE: {filepath: "/path/file.proxy.ts"} => returns "file.proxy"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/path/file.proxy.ts' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'file.proxy' }));
    });
  });

  describe('edge cases without typescript extension', () => {
    it('EDGE: {filepath: "/path/to/readme.md"} => returns "readme.md"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/path/to/readme.md' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'readme.md' }));
    });

    it('EDGE: {filepath: "/path/config.json"} => returns "config.json"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/path/config.json' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'config.json' }));
    });

    it('EDGE: {filepath: "/path/noextension"} => returns "noextension"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/path/noextension' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'noextension' }));
    });
  });

  describe('edge cases with unusual path separators', () => {
    it('EDGE: {filepath: "/path//double//slash//file.ts"} => returns "file"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/path//double//slash//file.ts' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'file' }));
    });

    it('EDGE: {filepath: "///leading-slashes.ts"} => returns "leading-slashes"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '///leading-slashes.ts' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'leading-slashes' }));
    });

    it('EDGE: {filepath: "/trailing/slash/.ts"} => returns ""', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/trailing/slash/.ts' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: '' }));
    });
  });

  describe('edge cases with empty results', () => {
    it('EDGE: {filepath: "/"} => returns ""', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: '' }));
    });

    it('EDGE: {filepath: ""} => returns ""', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: '' }));
    });

    it('EDGE: {filepath: ".ts"} => returns ""', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '.ts' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: '' }));
    });

    it('EDGE: {filepath: ".tsx"} => returns ""', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '.tsx' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: '' }));
    });
  });

  describe('edge cases with special characters', () => {
    it('EDGE: {filepath: "/path/file-with-dashes.ts"} => returns "file-with-dashes"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/path/file-with-dashes.ts' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'file-with-dashes' }));
    });

    it('EDGE: {filepath: "/path/file_with_underscores.tsx"} => returns "file_with_underscores"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/path/file_with_underscores.tsx' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'file_with_underscores' }));
    });

    it('EDGE: {filepath: "/path/123-numeric-prefix.ts"} => returns "123-numeric-prefix"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/path/123-numeric-prefix.ts' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: '123-numeric-prefix' }));
    });
  });

  describe('edge cases with misleading extensions', () => {
    it('EDGE: {filepath: "/path/file.typescript"} => returns "file.typescript"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/path/file.typescript' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'file.typescript' }));
    });

    it('EDGE: {filepath: "/path/file.tsx.backup"} => returns "file.tsx.backup"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/path/file.tsx.backup' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'file.tsx.backup' }));
    });

    it('EDGE: {filepath: "/path/.tst"} => returns ".tst"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/path/.tst' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: '.tst' }));
    });
  });

  describe('javascript extensions', () => {
    it('VALID: {filepath: "/path/to/user-fetch-broker.js"} => returns "user-fetch-broker"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/path/to/user-fetch-broker.js' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'user-fetch-broker' }));
    });

    it('VALID: {filepath: "/components/user-widget.jsx"} => returns "user-widget"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/components/user-widget.jsx' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'user-widget' }));
    });

    it('VALID: {filepath: "simple-file.js"} => returns "simple-file"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: 'simple-file.js' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'simple-file' }));
    });

    it('VALID: {filepath: "component.jsx"} => returns "component"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: 'component.jsx' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'component' }));
    });

    it('EDGE: {filepath: "/path/file.test.js"} => returns "file.test"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/path/file.test.js' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'file.test' }));
    });

    it('EDGE: {filepath: "/path/file.proxy.jsx"} => returns "file.proxy"', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '/path/file.proxy.jsx' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: 'file.proxy' }));
    });

    it('EDGE: {filepath: ".js"} => returns ""', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '.js' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: '' }));
    });

    it('EDGE: {filepath: ".jsx"} => returns ""', () => {
      const result = functionNameExtractorTransformer({
        filepath: FilePathStub({ value: '.jsx' }),
      });

      expect(result).toStrictEqual(FunctionNameStub({ value: '' }));
    });
  });
});
