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
          /^Scanning for duplicate primitives\.\.\.\n {2}Pattern: \*\*\/\*\.ts\n {2}Directory: [^\n]+\n {2}Threshold: 3\+ occurrences\n {2}Min length: 3 characters\n\n✅ No duplicate primitives found!\n$/su,
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
          /^Scanning for duplicate primitives\.\.\.\n {2}Pattern: \*\*\/\*\.ts\n {2}Directory: [^\n]+\n {2}Threshold: 3\+ occurrences\n {2}Min length: 3 characters\n\nFound 1 duplicate primitive\(s\):\n\n━+\nSTRING: "duplicate string"\nOccurrences: 3\n\n {2}[^\n]+file3\.ts:\d+:\d+\n {2}[^\n]+file2\.ts:\d+:\d+\n {2}[^\n]+file1\.ts:\d+:\d+\n\n\nSuggestion: Extract these literals to statics files:\n {2}packages\/\*\/src\/statics\/\[domain\]\/\[domain\]-statics\.ts\n$/su,
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
          /^Scanning for duplicate primitives\.\.\.\n {2}Pattern: \*\*\/\*\.ts\n {2}Directory: [^\n]+\n {2}Threshold: 2\+ occurrences\n {2}Min length: 3 characters\n\nFound 1 duplicate primitive\(s\):\n\n━+\nSTRING: "twice only"\nOccurrences: 2\n\n {2}[^\n]+file2\.ts:\d+:\d+\n {2}[^\n]+file1\.ts:\d+:\d+\n\n\nSuggestion: Extract these literals to statics files:\n {2}packages\/\*\/src\/statics\/\[domain\]\/\[domain\]-statics\.ts\n$/su,
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
        stdout: expect.stringMatching(
          /^Scanning for duplicate primitives\.\.\.\n {2}Pattern: \*\*\/\*\.ts\n {2}Directory: [^\n]+\n {2}Threshold: 3\+ occurrences\n {2}Min length: 3 characters\n\n✅ No duplicate primitives found!\n$/su,
        ),
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
          /^Scanning for duplicate primitives\.\.\.\n {2}Pattern: \*\*\/\*\.ts\n {2}Directory: [^\n]+\n {2}Threshold: 3\+ occurrences\n {2}Min length: 3 characters\n\nFound 1 duplicate primitive\(s\):\n\n━+\nSTRING: "This is a very long string that appears multiple times in the codebase"\nOccurrences: 3\n\n {2}[^\n]+file3\.ts:\d+:\d+\n {2}[^\n]+file2\.ts:\d+:\d+\n {2}[^\n]+file1\.ts:\d+:\d+\n\n\nSuggestion: Extract these literals to statics files:\n {2}packages\/\*\/src\/statics\/\[domain\]\/\[domain\]-statics\.ts\n$/su,
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
          /^Scanning for duplicate primitives\.\.\.\n {2}Pattern: \*\*\/\*\.ts\n {2}Directory: [^\n]+\n {2}Threshold: 3\+ occurrences\n {2}Min length: 3 characters\n\nFound 1 duplicate primitive\(s\):\n\n━+\nREGEX: "\/\^\[a-z\]\+\$\/"\nOccurrences: 3\n\n {2}[^\n]+file3\.ts:\d+:\d+\n {2}[^\n]+file2\.ts:\d+:\d+\n {2}[^\n]+file1\.ts:\d+:\d+\n\n\nSuggestion: Extract these literals to statics files:\n {2}packages\/\*\/src\/statics\/\[domain\]\/\[domain\]-statics\.ts\n$/su,
        ),
      });
    });
  });
});
