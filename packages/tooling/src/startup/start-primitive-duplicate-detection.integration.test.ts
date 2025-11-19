import * as path from 'path';
import { execSync } from 'child_process';
import { createIntegrationEnvironment } from '@questmaestro/testing';
import { CommandResultStub } from '../contracts/command-result/command-result.stub';
import { ExitCodeStub } from '../contracts/exit-code/exit-code.stub';
import { ProcessOutputStub } from '../contracts/process-output/process-output.stub';
import type { ExecErrorStub } from '../contracts/exec-error/exec-error.stub';

type ExecError = ReturnType<typeof ExecErrorStub>;

const isExecError = (error: unknown): error is ExecError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as Record<PropertyKey, unknown>).status === 'number'
  );
};

const startupPath = path.join(
  process.cwd(),
  'src',
  'startup',
  'start-primitive-duplicate-detection.ts',
);

const runStartup = ({ args }: { args: readonly string[] }) => {
  const command = `npx tsx ${startupPath} ${args.join(' ')}`;

  try {
    const stdout = execSync(command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
    });
    return CommandResultStub({
      exitCode: ExitCodeStub({ value: 0 }),
      stdout: ProcessOutputStub({ value: stdout }),
      stderr: ProcessOutputStub({ value: '' }),
    });
  } catch (error) {
    if (!isExecError(error)) {
      throw error;
    }
    const execError = error;
    const DEFAULT_EXIT_CODE = 1;
    const exitCode = execError.status ?? DEFAULT_EXIT_CODE;
    const stdout = execError.stdout?.toString() ?? '';
    const stderr = execError.stderr?.toString() ?? '';
    return CommandResultStub({
      exitCode: ExitCodeStub({ value: exitCode }),
      stdout: ProcessOutputStub({ value: stdout }),
      stderr: ProcessOutputStub({ value: stderr }),
    });
  }
};

describe('StartPrimitiveDuplicateDetection', () => {
  describe('with no duplicates', () => {
    it('VALID: {pattern: "**/*.ts", files: unique strings} => returns exit code 0 with success message', () => {
      const env = createIntegrationEnvironment({
        baseName: 'no-duplicates',
        options: {
          createPackageJson: false,
        },
      });

      env.writeFile({
        fileName: 'file1.ts',
        content: `export const message1 = 'unique message one';`,
      });
      env.writeFile({
        fileName: 'file2.ts',
        content: `export const message2 = 'unique message two';`,
      });

      const result = runStartup({
        args: [`--pattern=**/*.ts`, `--cwd=${env.projectPath}`],
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Scanning for duplicate primitives\.\.\./u);
      expect(result.stdout).toMatch(/Pattern: \*\*\/\*\.ts/u);
      expect(result.stdout).toMatch(/Threshold: 3\+ occurrences/u);
      expect(result.stdout).toMatch(/✅ No duplicate primitives found!/u);
    });
  });

  describe('with duplicates', () => {
    it('VALID: {pattern: "**/*.ts", files: 3 occurrences of same string} => reports duplicate with locations', () => {
      const env = createIntegrationEnvironment({
        baseName: 'basic-duplicates',
        options: {
          createPackageJson: false,
        },
      });

      env.writeFile({
        fileName: 'file1.ts',
        content: `export const message = 'duplicate string';\nexport const other = 'different';`,
      });
      env.writeFile({
        fileName: 'file2.ts',
        content: `export const msg = 'duplicate string';\nexport const value = 123;`,
      });
      env.writeFile({ fileName: 'file3.ts', content: `export const text = 'duplicate string';` });

      const result = runStartup({
        args: [`--pattern=**/*.ts`, `--cwd=${env.projectPath}`],
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Found 1 duplicate primitive\(s\):/u);
      expect(result.stdout).toMatch(/STRING: "duplicate string"/u);
      expect(result.stdout).toMatch(/Occurrences: 3/u);
      expect(result.stdout).toMatch(/file3\.ts:[\s\S]*file2\.ts:[\s\S]*file1\.ts:/u);
    });
  });

  describe('with custom threshold', () => {
    it('VALID: {threshold: 2, files: 2 occurrences} => reports duplicate', () => {
      const env = createIntegrationEnvironment({
        baseName: 'threshold-2',
        options: {
          createPackageJson: false,
        },
      });

      env.writeFile({ fileName: 'file1.ts', content: `export const msg = 'twice only';` });
      env.writeFile({ fileName: 'file2.ts', content: `export const text = 'twice only';` });

      const result = runStartup({
        args: [`--pattern=**/*.ts`, `--cwd=${env.projectPath}`, `--threshold=2`],
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Threshold: 2\+ occurrences/u);
      expect(result.stdout).toMatch(/Found 1 duplicate primitive\(s\):/u);
      expect(result.stdout).toMatch(/STRING: "twice only"/u);
      expect(result.stdout).toMatch(/Occurrences: 2/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {files: empty directory} => returns no duplicates message', () => {
      const env = createIntegrationEnvironment({
        baseName: 'empty-dir',
        options: {
          createPackageJson: false,
        },
      });

      const result = runStartup({
        args: [`--pattern=**/*.ts`, `--cwd=${env.projectPath}`],
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/✅ No duplicate primitives found!/u);
    });

    it('EDGE: {files: very long string duplicated} => reports duplicate with full value', () => {
      const env = createIntegrationEnvironment({
        baseName: 'long-string',
        options: {
          createPackageJson: false,
        },
      });

      const longString = 'This is a very long string that appears multiple times in the codebase';
      env.writeFile({ fileName: 'file1.ts', content: `export const msg1 = '${longString}';` });
      env.writeFile({ fileName: 'file2.ts', content: `export const msg2 = '${longString}';` });
      env.writeFile({ fileName: 'file3.ts', content: `export const msg3 = '${longString}';` });

      const result = runStartup({
        args: [`--pattern=**/*.ts`, `--cwd=${env.projectPath}`],
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Found 1 duplicate primitive\(s\):/u);
      expect(result.stdout).toMatch(
        /STRING: "This is a very long string that appears multiple times in the codebase"/u,
      );
      expect(result.stdout).toMatch(/Occurrences: 3/u);
    });
  });

  describe('with regex literals', () => {
    it('VALID: {files: duplicate regex patterns} => reports as REGEX type', () => {
      const env = createIntegrationEnvironment({
        baseName: 'regex-duplicates',
        options: {
          createPackageJson: false,
        },
      });

      env.writeFile({ fileName: 'file1.ts', content: `export const pattern1 = /^[a-z]+$/;` });
      env.writeFile({ fileName: 'file2.ts', content: `export const pattern2 = /^[a-z]+$/;` });
      env.writeFile({ fileName: 'file3.ts', content: `export const pattern3 = /^[a-z]+$/;` });

      const result = runStartup({
        args: [`--pattern=**/*.ts`, `--cwd=${env.projectPath}`],
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Found 1 duplicate primitive\(s\):/u);
      expect(result.stdout).toMatch(/REGEX: "\/\^\[a-z\]\+\$\/"/u);
      expect(result.stdout).toMatch(/Occurrences: 3/u);
    });
  });
});
