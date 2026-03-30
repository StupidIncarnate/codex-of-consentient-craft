import {
  integrationEnvironmentCreateBroker,
  BaseNameStub,
  FileNameStub,
  FileContentStub,
} from '@dungeonmaster/testing';

import { toolingRunnerHarness } from '../../../test/harnesses/tooling-runner/tooling-runner.harness';

describe('StartPrimitiveDuplicateDetection', () => {
  const harness = toolingRunnerHarness();

  describe('with no duplicates', () => {
    it('VALID: {pattern: "**/*.ts", files: unique strings} => returns exit code 0 with success message', () => {
      const env = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'no-duplicates' }),
        options: {
          createPackageJson: false,
        },
      });

      env.writeFile({
        fileName: FileNameStub({ value: 'file1.ts' }),
        content: FileContentStub({ value: `export const message1 = 'unique message one';` }),
      });
      env.writeFile({
        fileName: FileNameStub({ value: 'file2.ts' }),
        content: FileContentStub({ value: `export const message2 = 'unique message two';` }),
      });

      const result = harness.runStartup({
        args: [`--pattern=**/*.ts`, `--cwd=${env.guildPath}`],
      });

      expect({
        exitCode: result.exitCode,
        stdout: result.stdout,
      }).toStrictEqual({
        exitCode: 0,
        stdout: expect.stringMatching(
          /Scanning for duplicate primitives\.\.\.[\s\S]+Pattern: \*\*\/\*\.ts[\s\S]+Threshold: 3\+ occurrences[\s\S]+No duplicate primitives found!$/msu,
        ),
      });
    });
  });

  describe('with duplicates', () => {
    it('VALID: {pattern: "**/*.ts", files: 3 occurrences of same string} => reports duplicate with locations', () => {
      const env = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'basic-duplicates' }),
        options: {
          createPackageJson: false,
        },
      });

      env.writeFile({
        fileName: FileNameStub({ value: 'file1.ts' }),
        content: FileContentStub({
          value: `export const message = 'duplicate string';\nexport const other = 'different';`,
        }),
      });
      env.writeFile({
        fileName: FileNameStub({ value: 'file2.ts' }),
        content: FileContentStub({
          value: `export const msg = 'duplicate string';\nexport const value = 123;`,
        }),
      });
      env.writeFile({
        fileName: FileNameStub({ value: 'file3.ts' }),
        content: FileContentStub({ value: `export const text = 'duplicate string';` }),
      });

      const result = harness.runStartup({
        args: [`--pattern=**/*.ts`, `--cwd=${env.guildPath}`],
      });

      expect({
        exitCode: result.exitCode,
        stdout: result.stdout,
      }).toStrictEqual({
        exitCode: 0,
        stdout: expect.stringMatching(
          /Found 1 duplicate primitive\(s\):[\s\S]+STRING: "duplicate string"[\s\S]+Occurrences: 3[\s\S]+file3\.ts:[\s\S]+file2\.ts:[\s\S]+file1\.ts:.+$/su,
        ),
      });
    });
  });

  describe('with custom threshold', () => {
    it('VALID: {threshold: 2, files: 2 occurrences} => reports duplicate', () => {
      const env = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'threshold-2' }),
        options: {
          createPackageJson: false,
        },
      });

      env.writeFile({
        fileName: FileNameStub({ value: 'file1.ts' }),
        content: FileContentStub({ value: `export const msg = 'twice only';` }),
      });
      env.writeFile({
        fileName: FileNameStub({ value: 'file2.ts' }),
        content: FileContentStub({ value: `export const text = 'twice only';` }),
      });

      const result = harness.runStartup({
        args: [`--pattern=**/*.ts`, `--cwd=${env.guildPath}`, `--threshold=2`],
      });

      expect({
        exitCode: result.exitCode,
        stdout: result.stdout,
      }).toStrictEqual({
        exitCode: 0,
        stdout: expect.stringMatching(
          /Threshold: 2\+ occurrences[\s\S]+Found 1 duplicate primitive\(s\):[\s\S]+STRING: "twice only"[\s\S]+Occurrences: 2$/msu,
        ),
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {files: empty directory} => returns no duplicates message', () => {
      const env = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'empty-dir' }),
        options: {
          createPackageJson: false,
        },
      });

      const result = harness.runStartup({
        args: [`--pattern=**/*.ts`, `--cwd=${env.guildPath}`],
      });

      expect({
        exitCode: result.exitCode,
        stdout: result.stdout,
      }).toStrictEqual({
        exitCode: 0,
        stdout: expect.stringMatching(/No duplicate primitives found!$/msu),
      });
    });

    it('EDGE: {files: very long string duplicated} => reports duplicate with full value', () => {
      const env = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'long-string' }),
        options: {
          createPackageJson: false,
        },
      });

      const longString = 'This is a very long string that appears multiple times in the codebase';
      env.writeFile({
        fileName: FileNameStub({ value: 'file1.ts' }),
        content: FileContentStub({ value: `export const msg1 = '${longString}';` }),
      });
      env.writeFile({
        fileName: FileNameStub({ value: 'file2.ts' }),
        content: FileContentStub({ value: `export const msg2 = '${longString}';` }),
      });
      env.writeFile({
        fileName: FileNameStub({ value: 'file3.ts' }),
        content: FileContentStub({ value: `export const msg3 = '${longString}';` }),
      });

      const result = harness.runStartup({
        args: [`--pattern=**/*.ts`, `--cwd=${env.guildPath}`],
      });

      expect({
        exitCode: result.exitCode,
        stdout: result.stdout,
      }).toStrictEqual({
        exitCode: 0,
        stdout: expect.stringMatching(
          /Found 1 duplicate primitive\(s\):[\s\S]+STRING: "This is a very long string that appears multiple times in the codebase"[\s\S]+Occurrences: 3$/msu,
        ),
      });
    });
  });

  describe('with regex literals', () => {
    it('VALID: {files: duplicate regex patterns} => reports as REGEX type', () => {
      const env = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'regex-duplicates' }),
        options: {
          createPackageJson: false,
        },
      });

      env.writeFile({
        fileName: FileNameStub({ value: 'file1.ts' }),
        content: FileContentStub({ value: `export const pattern1 = /^[a-z]+$/;` }),
      });
      env.writeFile({
        fileName: FileNameStub({ value: 'file2.ts' }),
        content: FileContentStub({ value: `export const pattern2 = /^[a-z]+$/;` }),
      });
      env.writeFile({
        fileName: FileNameStub({ value: 'file3.ts' }),
        content: FileContentStub({ value: `export const pattern3 = /^[a-z]+$/;` }),
      });

      const result = harness.runStartup({
        args: [`--pattern=**/*.ts`, `--cwd=${env.guildPath}`],
      });

      expect({
        exitCode: result.exitCode,
        stdout: result.stdout,
      }).toStrictEqual({
        exitCode: 0,
        stdout: expect.stringMatching(
          /Found 1 duplicate primitive\(s\):[\s\S]+REGEX: "\/\^\[a-z\]\+\$\/"[\s\S]+Occurrences: 3$/msu,
        ),
      });
    });
  });
});
