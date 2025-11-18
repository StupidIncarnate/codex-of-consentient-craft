/**
 * Tests for create-integration-environment utilities
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  createIntegrationEnvironment,
  cleanupAllEnvironments,
  getCreatedEnvironments,
} from './create-integration-environment';

describe('createIntegrationEnvironment', () => {
  describe('createIntegrationEnvironment', () => {
    it('VALID: {baseName} => creates temp directory with unique ID', () => {
      const env = createIntegrationEnvironment({ baseName: 'test-env' });

      const projectPathMatches = Boolean(/\/tmp\/test-env-[a-f0-9]{8}/u.exec(env.projectPath));
      const projectNameMatches = Boolean(/^test-env-[a-f0-9]{8}$/u.exec(env.projectName));
      const pathExists = fs.existsSync(env.projectPath);

      env.cleanup();

      expect(projectPathMatches).toBe(true);
      expect(projectNameMatches).toBe(true);
      expect(pathExists).toBe(true);
    });

    it('VALID: {baseName, options: {createPackageJson: false}} => creates directory without package.json', () => {
      const env = createIntegrationEnvironment({
        baseName: 'test-no-pkg',
        options: { createPackageJson: false },
      });

      const pathExists = fs.existsSync(env.projectPath);
      const packageJsonExists = fs.existsSync(path.join(env.projectPath, 'package.json'));

      env.cleanup();

      expect(pathExists).toBe(true);
      expect(packageJsonExists).toBe(false);
    });

    it('VALID: {baseName, options: {createPackageJson: true}} => creates directory with package.json', () => {
      const env = createIntegrationEnvironment({
        baseName: 'test-with-pkg',
        options: { createPackageJson: true },
      });

      const packageJsonExists = fs.existsSync(path.join(env.projectPath, 'package.json'));
      const packageJson = env.getPackageJson();
      const nameMatches = Boolean(/^test-with-pkg-[a-f0-9]{8}$/u.exec(packageJson.name));

      env.cleanup();

      expect(packageJsonExists).toBe(true);
      expect(nameMatches).toBe(true);
      expect(packageJson.version).toBe('1.0.0');
    });

    it('VALID: {baseName, options: {setupEslint: true}} => creates eslint config files', () => {
      const env = createIntegrationEnvironment({
        baseName: 'test-eslint',
        options: { setupEslint: true },
      });

      const tsconfigExists = fs.existsSync(path.join(env.projectPath, 'tsconfig.json'));
      const eslintConfigExists = fs.existsSync(path.join(env.projectPath, 'eslint.config.js'));

      env.cleanup();

      expect(tsconfigExists).toBe(true);
      expect(eslintConfigExists).toBe(true);
    });
  });

  describe('TestProject methods', () => {
    it('VALID: fileExists() => returns true for existing files', () => {
      const env = createIntegrationEnvironment({ baseName: 'test-file-exists' });
      env.writeFile({ fileName: 'test.txt', content: 'hello' });

      const testFileExists = env.fileExists({ fileName: 'test.txt' });
      const missingFileExists = env.fileExists({ fileName: 'missing.txt' });

      env.cleanup();

      expect(testFileExists).toBe(true);
      expect(missingFileExists).toBe(false);
    });

    it('VALID: writeFile() and readFile() => writes and reads file content', () => {
      const env = createIntegrationEnvironment({ baseName: 'test-read-write' });
      const content = 'test content';

      env.writeFile({ fileName: 'test.txt', content });
      const readContent = env.readFile({ fileName: 'test.txt' });

      env.cleanup();

      expect(readContent).toBe(content);
    });

    it('VALID: deleteFile() => removes existing file', () => {
      const env = createIntegrationEnvironment({ baseName: 'test-delete' });
      env.writeFile({ fileName: 'test.txt', content: 'hello' });

      const beforeDelete = env.fileExists({ fileName: 'test.txt' });
      env.deleteFile({ fileName: 'test.txt' });
      const afterDelete = env.fileExists({ fileName: 'test.txt' });

      env.cleanup();

      expect(beforeDelete).toBe(true);
      expect(afterDelete).toBe(false);
    });

    it('VALID: hasCommand() => returns true for existing commands', () => {
      const env = createIntegrationEnvironment({
        baseName: 'test-commands',
        options: { createPackageJson: true },
      });

      const hasTest = env.hasCommand({ command: 'test' });
      const hasLint = env.hasCommand({ command: 'lint' });
      const hasMissing = env.hasCommand({ command: 'missing' });

      env.cleanup();

      expect(hasTest).toBe(true);
      expect(hasLint).toBe(true);
      expect(hasMissing).toBe(false);
    });

    it('VALID: cleanup() => removes project directory', () => {
      const env = createIntegrationEnvironment({ baseName: 'test-cleanup' });
      const { projectPath } = env;

      const beforeCleanup = fs.existsSync(projectPath);
      env.cleanup();
      const afterCleanup = fs.existsSync(projectPath);

      expect(beforeCleanup).toBe(true);
      expect(afterCleanup).toBe(false);
    });
  });

  describe('getCreatedEnvironments', () => {
    it('VALID: tracks created environments', () => {
      const initialCount = getCreatedEnvironments().length;

      const env = createIntegrationEnvironment({ baseName: 'test-tracking' });
      const environments = getCreatedEnvironments();
      const newCount = environments.length;
      const lastEnv = environments[environments.length - 1];

      env.cleanup();

      expect(newCount).toBe(initialCount + 1);
      expect(lastEnv).toStrictEqual(env);
    });
  });

  describe('cleanupAllEnvironments', () => {
    it('VALID: cleans up all tracked environments', () => {
      const env1 = createIntegrationEnvironment({ baseName: 'test-cleanup-all-1' });
      const env2 = createIntegrationEnvironment({ baseName: 'test-cleanup-all-2' });

      const path1 = env1.projectPath;
      const path2 = env2.projectPath;

      const path1BeforeCleanup = fs.existsSync(path1);
      const path2BeforeCleanup = fs.existsSync(path2);

      cleanupAllEnvironments();

      const path1AfterCleanup = fs.existsSync(path1);
      const path2AfterCleanup = fs.existsSync(path2);
      const envCount = getCreatedEnvironments().length;

      expect(path1BeforeCleanup).toBe(true);
      expect(path2BeforeCleanup).toBe(true);
      expect(path1AfterCleanup).toBe(false);
      expect(path2AfterCleanup).toBe(false);
      expect(envCount).toBe(0);
    });
  });
});
