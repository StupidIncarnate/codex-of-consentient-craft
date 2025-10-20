import { filepathBasenameWithoutSuffixTransformer } from './filepath-basename-without-suffix-transformer';

describe('filepathBasenameWithoutSuffixTransformer', () => {
  describe('suffix without extension (string)', () => {
    it('VALID: {filePath: "/path/to/user-fetch-broker.ts", suffix: "-broker"} => returns "user-fetch"', () => {
      expect(
        filepathBasenameWithoutSuffixTransformer({
          filePath: '/path/to/user-fetch-broker.ts',
          suffix: '-broker',
        }),
      ).toBe('user-fetch');
    });

    it('VALID: {filePath: "/src/contracts/user/user-contract.ts", suffix: "-contract"} => returns "user"', () => {
      expect(
        filepathBasenameWithoutSuffixTransformer({
          filePath: '/src/contracts/user/user-contract.ts',
          suffix: '-contract',
        }),
      ).toBe('user');
    });

    it('VALID: {filePath: "simple-guard.ts", suffix: "-guard"} => returns "simple"', () => {
      expect(
        filepathBasenameWithoutSuffixTransformer({
          filePath: 'simple-guard.ts',
          suffix: '-guard',
        }),
      ).toBe('simple');
    });
  });

  describe('suffix with extension (string)', () => {
    it('VALID: {filePath: "/path/to/user-broker.proxy.ts", suffix: ".proxy.ts"} => returns "user-broker"', () => {
      expect(
        filepathBasenameWithoutSuffixTransformer({
          filePath: '/path/to/user-broker.proxy.ts',
          suffix: '.proxy.ts',
        }),
      ).toBe('user-broker');
    });

    it('VALID: {filePath: "/src/test.spec.ts", suffix: ".spec.ts"} => returns "test"', () => {
      expect(
        filepathBasenameWithoutSuffixTransformer({
          filePath: '/src/test.spec.ts',
          suffix: '.spec.ts',
        }),
      ).toBe('test');
    });

    it('VALID: {filePath: "component.test.tsx", suffix: ".test.tsx"} => returns "component"', () => {
      expect(
        filepathBasenameWithoutSuffixTransformer({
          filePath: 'component.test.tsx',
          suffix: '.test.tsx',
        }),
      ).toBe('component');
    });
  });

  describe('suffix array (tries longest first)', () => {
    it('VALID: {filePath: "/path/user-broker.ts", suffix: ["-broker", "-adapter"]} => returns "user"', () => {
      expect(
        filepathBasenameWithoutSuffixTransformer({
          filePath: '/path/user-broker.ts',
          suffix: ['-broker', '-adapter'],
        }),
      ).toBe('user');
    });

    it('VALID: {filePath: "/path/user-adapter.ts", suffix: ["-broker", "-adapter"]} => returns "user"', () => {
      expect(
        filepathBasenameWithoutSuffixTransformer({
          filePath: '/path/user-adapter.ts',
          suffix: ['-broker', '-adapter'],
        }),
      ).toBe('user');
    });

    it('VALID: {filePath: "test.proxy.ts", suffix: [".proxy.ts", ".test.ts"]} => returns "test"', () => {
      expect(
        filepathBasenameWithoutSuffixTransformer({
          filePath: 'test.proxy.ts',
          suffix: ['.proxy.ts', '.test.ts'],
        }),
      ).toBe('test');
    });

    it('VALID: {filePath: "test.spec.ts", suffix: [".test.ts", ".spec.ts"]} => returns "test"', () => {
      expect(
        filepathBasenameWithoutSuffixTransformer({
          filePath: 'test.spec.ts',
          suffix: ['.test.ts', '.spec.ts'],
        }),
      ).toBe('test');
    });
  });

  describe('no suffix match (fallback)', () => {
    it('FALLBACK: {filePath: "/path/to/user-broker.ts", suffix: "-contract"} => returns "user-broker"', () => {
      expect(
        filepathBasenameWithoutSuffixTransformer({
          filePath: '/path/to/user-broker.ts',
          suffix: '-contract',
        }),
      ).toBe('user-broker');
    });

    it('FALLBACK: {filePath: "/path/file.ts", suffix: ".proxy.ts"} => returns "file"', () => {
      expect(
        filepathBasenameWithoutSuffixTransformer({
          filePath: '/path/file.ts',
          suffix: '.proxy.ts',
        }),
      ).toBe('file');
    });

    it('FALLBACK: {filePath: "name.tsx", suffix: ["-broker", "-contract"]} => returns "name"', () => {
      expect(
        filepathBasenameWithoutSuffixTransformer({
          filePath: 'name.tsx',
          suffix: ['-broker', '-contract'],
        }),
      ).toBe('name');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {filePath: "/path/to/.ts", suffix: "-broker"} => returns ""', () => {
      expect(
        filepathBasenameWithoutSuffixTransformer({
          filePath: '/path/to/.ts',
          suffix: '-broker',
        }),
      ).toBe('');
    });

    it('EDGE: {filePath: "no-extension", suffix: "-extension"} => returns "no"', () => {
      expect(
        filepathBasenameWithoutSuffixTransformer({
          filePath: 'no-extension',
          suffix: '-extension',
        }),
      ).toBe('no');
    });

    it('EDGE: {filePath: "", suffix: "-broker"} => returns ""', () => {
      expect(
        filepathBasenameWithoutSuffixTransformer({
          filePath: '',
          suffix: '-broker',
        }),
      ).toBe('');
    });
  });
});
