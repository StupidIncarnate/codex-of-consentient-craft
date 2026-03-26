import { tsconfigDiscoverPatternsTransformer } from './tsconfig-discover-patterns-transformer';

describe('tsconfigDiscoverPatternsTransformer', () => {
  describe('standard tsconfig with src/**/*', () => {
    it('VALID: {include: ["src/**/*", "*.ts"]} => returns ts/tsx globs for src and *.ts', () => {
      const result = tsconfigDiscoverPatternsTransformer({
        tsconfigData: { include: ['src/**/*', '*.ts'] },
      });

      expect(result).toStrictEqual({
        patterns: ['src/**/*.ts', 'src/**/*.tsx', '*.ts'],
        exclude: ['node_modules', 'dist'],
      });
    });
  });

  describe('bare directory include', () => {
    it('VALID: {include: ["src", "vite.config.ts"]} => expands bare dir and keeps ts file', () => {
      const result = tsconfigDiscoverPatternsTransformer({
        tsconfigData: { include: ['src', 'vite.config.ts'] },
      });

      expect(result).toStrictEqual({
        patterns: ['src/**/*.ts', 'src/**/*.tsx', 'vite.config.ts'],
        exclude: ['node_modules', 'dist'],
      });
    });
  });

  describe('@types include', () => {
    it('VALID: {include: ["src/**/*", "@types/**/*"]} => expands @types to ts and d.ts', () => {
      const result = tsconfigDiscoverPatternsTransformer({
        tsconfigData: { include: ['src/**/*', '@types/**/*'] },
      });

      expect(result).toStrictEqual({
        patterns: ['src/**/*.ts', 'src/**/*.tsx', '@types/**/*.ts', '@types/**/*.d.ts'],
        exclude: ['node_modules', 'dist'],
      });
    });
  });

  describe('tsconfig with exclude', () => {
    it('VALID: {include: ["src/**/*"], exclude: ["src/generated"]} => merges exclude with defaults', () => {
      const result = tsconfigDiscoverPatternsTransformer({
        tsconfigData: { include: ['src/**/*'], exclude: ['src/generated'] },
      });

      expect(result).toStrictEqual({
        patterns: ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: ['node_modules', 'dist', 'src/generated'],
      });
    });
  });

  describe('tsconfig with specific file include', () => {
    it('VALID: {include: ["src/**/*", "index.ts"]} => keeps specific ts file as-is', () => {
      const result = tsconfigDiscoverPatternsTransformer({
        tsconfigData: { include: ['src/**/*', 'index.ts'] },
      });

      expect(result).toStrictEqual({
        patterns: ['src/**/*.ts', 'src/**/*.tsx', 'index.ts'],
        exclude: ['node_modules', 'dist'],
      });
    });
  });

  describe('tsconfig with test-tmp directory', () => {
    it('VALID: {include: ["src/**/*", "src/.test-tmp/**/*"]} => expands dotdir pattern', () => {
      const result = tsconfigDiscoverPatternsTransformer({
        tsconfigData: { include: ['src/**/*', 'src/.test-tmp/**/*'] },
      });

      expect(result).toStrictEqual({
        patterns: [
          'src/**/*.ts',
          'src/**/*.tsx',
          'src/.test-tmp/**/*.ts',
          'src/.test-tmp/**/*.tsx',
        ],
        exclude: ['node_modules', 'dist'],
      });
    });
  });

  describe('fallback on null tsconfigData', () => {
    it('EDGE: {tsconfigData: null} => returns static fallback patterns', () => {
      const result = tsconfigDiscoverPatternsTransformer({ tsconfigData: null });

      expect(result).toStrictEqual({
        patterns: ['src/**/*.ts', 'src/**/*.tsx', 'bin/**/*.ts'],
        exclude: ['node_modules', 'dist'],
      });
    });
  });

  describe('fallback on non-object tsconfigData', () => {
    it('EDGE: {tsconfigData: "not-an-object"} => returns static fallback patterns', () => {
      const result = tsconfigDiscoverPatternsTransformer({
        tsconfigData: 'not-an-object',
      });

      expect(result).toStrictEqual({
        patterns: ['src/**/*.ts', 'src/**/*.tsx', 'bin/**/*.ts'],
        exclude: ['node_modules', 'dist'],
      });
    });
  });

  describe('fallback on missing include', () => {
    it('EDGE: {tsconfigData: {}} => returns static fallback patterns', () => {
      const result = tsconfigDiscoverPatternsTransformer({ tsconfigData: {} });

      expect(result).toStrictEqual({
        patterns: ['src/**/*.ts', 'src/**/*.tsx', 'bin/**/*.ts'],
        exclude: ['node_modules', 'dist'],
      });
    });
  });

  describe('fallback on empty include', () => {
    it('EDGE: {tsconfigData: {include: []}} => returns static fallback patterns', () => {
      const result = tsconfigDiscoverPatternsTransformer({
        tsconfigData: { include: [] },
      });

      expect(result).toStrictEqual({
        patterns: ['src/**/*.ts', 'src/**/*.tsx', 'bin/**/*.ts'],
        exclude: ['node_modules', 'dist'],
      });
    });
  });

  describe('duplicate default excludes not repeated', () => {
    it('EDGE: {exclude includes "node_modules"} => does not duplicate node_modules in output', () => {
      const result = tsconfigDiscoverPatternsTransformer({
        tsconfigData: { include: ['src/**/*'], exclude: ['node_modules', 'build'] },
      });

      expect(result).toStrictEqual({
        patterns: ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: ['node_modules', 'dist', 'build'],
      });
    });
  });
});
