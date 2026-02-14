import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  integrationEnvironmentCreateBroker,
  BaseNameStub,
  FileNameStub,
  FileContentStub,
} from '@dungeonmaster/testing';

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
 * This test uses integrationEnvironmentCreateBroker which automatically cleans up via jest.setup.js
 */

describe('Tmp Environment E2E', () => {
  describe('file operations in /tmp', () => {
    it('VALID: can create and read files in /tmp', () => {
      const env = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'file-ops-test' }),
        options: { createPackageJson: false },
      });

      env.writeFile({
        fileName: FileNameStub({ value: 'test.txt' }),
        content: FileContentStub({ value: 'Hello from /tmp!' }),
      });

      expect(env.fileExists({ fileName: FileNameStub({ value: 'test.txt' }) })).toBe(true);
      expect(env.readFile({ fileName: FileNameStub({ value: 'test.txt' }) })).toBe(
        'Hello from /tmp!',
      );
    });

    it('VALID: can create nested directory structure', () => {
      const env = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'nested-dirs' }),
        options: { createPackageJson: false },
      });

      env.writeFile({
        fileName: FileNameStub({ value: 'src/components/Button.tsx' }),
        content: FileContentStub({ value: 'export const Button = () => <button />;' }),
      });
      env.writeFile({
        fileName: FileNameStub({ value: 'src/utils/helpers.ts' }),
        content: FileContentStub({ value: 'export const helper = () => {};' }),
      });

      expect(
        env.fileExists({ fileName: FileNameStub({ value: 'src/components/Button.tsx' }) }),
      ).toBe(true);
      expect(env.fileExists({ fileName: FileNameStub({ value: 'src/utils/helpers.ts' }) })).toBe(
        true,
      );
    });
  });

  describe('executing TypeScript files in /tmp', () => {
    it('VALID: can run tsx on files in /tmp', () => {
      const env = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'tsx-execution' }),
        options: { createPackageJson: false },
      });

      env.writeFile({
        fileName: FileNameStub({ value: 'hello.ts' }),
        content: FileContentStub({
          value: `const greeting: string = 'Hello from /tmp';
console.log(greeting);`,
        }),
      });

      const result = execSync(`npx tsx ${path.join(env.guildPath, 'hello.ts')}`, {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
      });

      expect(result.trim()).toBe('Hello from /tmp');
    });

    it('VALID: can run Node.js scripts that import from other files', () => {
      const env = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'module-imports' }),
        options: { createPackageJson: false },
      });

      env.writeFile({
        fileName: FileNameStub({ value: 'utils.ts' }),
        content: FileContentStub({
          value: `export const add = (a: number, b: number): number => a + b;`,
        }),
      });

      env.writeFile({
        fileName: FileNameStub({ value: 'main.ts' }),
        content: FileContentStub({
          value: `import { add } from './utils';
console.log(add(2, 3));`,
        }),
      });

      const result = execSync(`npx tsx ${path.join(env.guildPath, 'main.ts')}`, {
        encoding: 'utf8',
        env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
      });

      expect(result.trim()).toBe('5');
    });
  });

  describe('CLI tool testing in /tmp', () => {
    it('VALID: can test a CLI tool that reads files from /tmp', () => {
      const env = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'cli-tool-test' }),
        options: { createPackageJson: false },
      });

      // Create a config file
      env.writeFile({
        fileName: FileNameStub({ value: 'config.json' }),
        content: FileContentStub({ value: JSON.stringify({ name: 'test-app', version: '1.0.0' }) }),
      });

      // Read it back programmatically (simulating what a CLI tool would do)
      const configPath = path.join(env.guildPath, 'config.json');
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);

      expect(config.name).toBe('test-app');
      expect(config.version).toBe('1.0.0');
    });

    it('VALID: can test file existence checks in /tmp', () => {
      const env = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'file-checks' }),
        options: { createPackageJson: false },
      });

      env.writeFile({
        fileName: FileNameStub({ value: 'package.json' }),
        content: FileContentStub({ value: '{}' }),
      });
      env.writeFile({
        fileName: FileNameStub({ value: '.gitignore' }),
        content: FileContentStub({ value: 'node_modules' }),
      });

      expect(env.fileExists({ fileName: FileNameStub({ value: 'package.json' }) })).toBe(true);
      expect(env.fileExists({ fileName: FileNameStub({ value: '.gitignore' }) })).toBe(true);
      expect(env.fileExists({ fileName: FileNameStub({ value: 'nonexistent.txt' }) })).toBe(false);
    });
  });

  describe('automatic cleanup', () => {
    it('VALID: environments are automatically cleaned up after each test', () => {
      const env = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'cleanup-test' }),
        options: { createPackageJson: false },
      });

      env.writeFile({
        fileName: FileNameStub({ value: 'test1.txt' }),
        content: FileContentStub({ value: 'content 1' }),
      });
      env.writeFile({
        fileName: FileNameStub({ value: 'test2.txt' }),
        content: FileContentStub({ value: 'content 2' }),
      });
      env.writeFile({
        fileName: FileNameStub({ value: 'subdir/test3.txt' }),
        content: FileContentStub({ value: 'content 3' }),
      });

      const { guildPath } = env;

      expect(fs.existsSync(guildPath)).toBe(true);

      // No manual cleanup needed! jest.setup.js handles it automatically
      // This test documents that files exist during the test
      // They will be cleaned up after the test completes
    });
  });

  describe('running ESLint in /tmp WITH setupEslint option', () => {
    it('VALID: setupEslint creates exact tsconfig.json', () => {
      const env = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'eslint-tsconfig' }),
        options: {
          createPackageJson: false,
          setupEslint: true,
        },
      });

      const tsconfig = JSON.parse(
        env.readFile({ fileName: FileNameStub({ value: 'tsconfig.json' }) }),
      );

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
      const env = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'eslint-config-js' }),
        options: {
          createPackageJson: false,
          setupEslint: true,
        },
      });

      const eslintConfig = env.readFile({ fileName: FileNameStub({ value: 'eslint.config.js' }) });
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
