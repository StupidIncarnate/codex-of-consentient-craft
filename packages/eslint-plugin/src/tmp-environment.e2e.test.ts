import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { createIntegrationEnvironment } from '@questmaestro/testing';

/**
 * E2E test to prove that integration test environments can work in /tmp
 *
 * This tests whether we actually need .test-tmp (inside the repo) or if /tmp works fine.
 *
 * Key insight: Most integration tests don't need to RUN ESLint on test files.
 * They just need to:
 * - Create test files
 * - Run CLI commands on them
 * - Verify outputs
 *
 * ESLint's type-aware rules need files in the TypeScript project (tsconfig.json include paths).
 * But if we're NOT running ESLint on test files, /tmp should work fine!
 *
 * This test uses createIntegrationEnvironment which automatically cleans up via jest.setup.js
 */

describe('Tmp Environment E2E', () => {
  describe('file operations in /tmp', () => {
    it('VALID: can create and read files in /tmp', () => {
      const env = createIntegrationEnvironment('file-ops-test', { createPackageJson: false });

      env.writeFile('test.txt', 'Hello from /tmp!');

      expect(env.fileExists('test.txt')).toBe(true);
      expect(env.readFile('test.txt')).toBe('Hello from /tmp!');
    });

    it('VALID: can create nested directory structure', () => {
      const env = createIntegrationEnvironment('nested-dirs', { createPackageJson: false });

      env.writeFile('src/components/Button.tsx', 'export const Button = () => <button />;');
      env.writeFile('src/utils/helpers.ts', 'export const helper = () => {};');

      expect(env.fileExists('src/components/Button.tsx')).toBe(true);
      expect(env.fileExists('src/utils/helpers.ts')).toBe(true);
    });
  });

  describe('executing TypeScript files in /tmp', () => {
    it('VALID: can run tsx on files in /tmp', () => {
      const env = createIntegrationEnvironment('tsx-execution', { createPackageJson: false });

      env.writeFile(
        'hello.ts',
        `const greeting: string = 'Hello from /tmp';
console.log(greeting);`,
      );

      const result = execSync(`npx tsx ${path.join(env.projectPath, 'hello.ts')}`, {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
      });

      expect(result.trim()).toBe('Hello from /tmp');
    });

    it('VALID: can run Node.js scripts that import from other files', () => {
      const env = createIntegrationEnvironment('module-imports', { createPackageJson: false });

      env.writeFile('utils.ts', `export const add = (a: number, b: number): number => a + b;`);

      env.writeFile(
        'main.ts',
        `import { add } from './utils';
console.log(add(2, 3));`,
      );

      const result = execSync(`npx tsx ${path.join(env.projectPath, 'main.ts')}`, {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
      });

      expect(result.trim()).toBe('5');
    });
  });

  describe('CLI tool testing in /tmp', () => {
    it('VALID: can test a CLI tool that reads files from /tmp', () => {
      const env = createIntegrationEnvironment('cli-tool-test', { createPackageJson: false });

      // Create a config file
      env.writeFile('config.json', JSON.stringify({ name: 'test-app', version: '1.0.0' }));

      // Read it back programmatically (simulating what a CLI tool would do)
      const configPath = path.join(env.projectPath, 'config.json');
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);

      expect(config.name).toBe('test-app');
      expect(config.version).toBe('1.0.0');
    });

    it('VALID: can test file existence checks in /tmp', () => {
      const env = createIntegrationEnvironment('file-checks', { createPackageJson: false });

      env.writeFile('package.json', '{}');
      env.writeFile('.gitignore', 'node_modules');

      expect(env.fileExists('package.json')).toBe(true);
      expect(env.fileExists('.gitignore')).toBe(true);
      expect(env.fileExists('nonexistent.txt')).toBe(false);
    });
  });

  describe('automatic cleanup', () => {
    it('VALID: environments are automatically cleaned up after each test', () => {
      const env = createIntegrationEnvironment('cleanup-test', { createPackageJson: false });

      env.writeFile('test1.txt', 'content 1');
      env.writeFile('test2.txt', 'content 2');
      env.writeFile('subdir/test3.txt', 'content 3');

      const { projectPath } = env;

      expect(fs.existsSync(projectPath)).toBe(true);

      // No manual cleanup needed! jest.setup.js handles it automatically
      // This test documents that files exist during the test
      // They will be cleaned up after the test completes
    });
  });

  describe('running ESLint in /tmp WITH setupEslint option', () => {
    it('VALID: setupEslint creates exact tsconfig.json', () => {
      const env = createIntegrationEnvironment('eslint-tsconfig', {
        createPackageJson: false,
        setupEslint: true,
      });

      const tsconfig = JSON.parse(env.readFile('tsconfig.json'));

      expect(tsconfig).toStrictEqual({
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          lib: ['ES2020'],
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
          moduleResolution: 'node',
        },
        include: ['**/*.ts', '**/*.tsx'],
        exclude: ['node_modules'],
      });
    });

    it('VALID: setupEslint creates exact eslint.config.js', () => {
      const env = createIntegrationEnvironment('eslint-config-js', {
        createPackageJson: false,
        setupEslint: true,
      });

      const eslintConfig = env.readFile('eslint.config.js');
      const expectedEslintConfig = `
// Auto-generated eslint config for integration test environment
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
];
`;

      expect(eslintConfig).toStrictEqual(expectedEslintConfig);
    });
  });
});
