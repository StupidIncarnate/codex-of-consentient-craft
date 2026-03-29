import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { RawOutputStub } from '../../../contracts/raw-output/raw-output.stub';
import { ErrorEntryStub } from '../../../contracts/error-entry/error-entry.stub';
import { FileTimingStub } from '../../../contracts/file-timing/file-timing.stub';

import { checkRunLintBroker } from './check-run-lint-broker';
import { checkRunLintBrokerProxy } from './check-run-lint-broker.proxy';

describe('checkRunLintBroker', () => {
  describe('passing lint', () => {
    it('VALID: {eslint exits 0} => returns pass result with no errors', async () => {
      const proxy = checkRunLintBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      const result = await checkRunLintBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          rawOutput: RawOutputStub({ stdout: '[]', stderr: '', exitCode: 0 }),
        }),
      );
    });
  });

  describe('non-json eslint output', () => {
    it('EDGE: {eslint outputs non-JSON text} => returns fail result with empty errors and raw output preserved', async () => {
      const proxy = checkRunLintBrokerProxy();
      const nonJsonOutput = 'Oops! Something went wrong! See above for details.';
      proxy.setupNonJsonFailure({ stdout: nonJsonOutput });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunLintBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'fail',
          errors: [],
          testFailures: [],
          rawOutput: RawOutputStub({ stdout: nonJsonOutput, stderr: '', exitCode: 1 }),
        }),
      );
    });
  });

  describe('failing lint', () => {
    it('VALID: {eslint exits 1 with errors} => returns fail result with parsed errors', async () => {
      const proxy = checkRunLintBrokerProxy();
      const eslintOutput = JSON.stringify([
        {
          filePath: 'src/index.ts',
          messages: [
            { ruleId: 'no-unused-vars', severity: 2, message: 'Unused var', line: 10, column: 5 },
          ],
        },
      ]);
      proxy.setupFail({ stdout: eslintOutput });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunLintBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'fail',
          errors: [
            ErrorEntryStub({
              filePath: 'src/index.ts',
              line: 10,
              column: 5,
              message: 'Unused var',
              rule: 'no-unused-vars',
              severity: 'error',
            }),
          ],
          testFailures: [],
          filesCount: 1,
          rawOutput: RawOutputStub({ stdout: eslintOutput, stderr: '', exitCode: 1 }),
        }),
      );
    });
  });

  describe('filesCount', () => {
    it('VALID: {eslint passes with 3 files} => returns filesCount from JSON array length', async () => {
      const proxy = checkRunLintBrokerProxy();
      const eslintOutput = JSON.stringify([
        { filePath: 'a.ts', messages: [] },
        { filePath: 'b.ts', messages: [] },
        { filePath: 'c.ts', messages: [] },
      ]);
      proxy.setupPassWithOutput({ stdout: eslintOutput });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunLintBroker({
        projectFolder,
        fileList: [],
      });

      expect(result.filesCount).toBe(3);
    });
  });

  describe('stderr contamination', () => {
    it('VALID: {eslint passes with stderr warnings} => returns correct filesCount', async () => {
      const proxy = checkRunLintBrokerProxy();
      const eslintOutput = JSON.stringify([
        { filePath: 'a.ts', messages: [] },
        { filePath: 'b.ts', messages: [] },
      ]);
      proxy.setupPassWithStderr({
        stdout: eslintOutput,
        stderr: 'Warning: some deprecation notice from eslint plugin',
      });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunLintBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          filesCount: 2,
          discoveredCount: 2,
          rawOutput: RawOutputStub({
            stdout: `${eslintOutput}Warning: some deprecation notice from eslint plugin`,
            stderr: '',
            exitCode: 0,
          }),
        }),
      );
    });
  });

  describe('fileTimings', () => {
    it('VALID: {eslint output with stats} => returns fileTimings with per-file durations', async () => {
      const proxy = checkRunLintBrokerProxy();
      const eslintOutput = JSON.stringify([
        {
          filePath: 'src/index.ts',
          messages: [],
          stats: {
            times: {
              passes: [{ total: 12.5 }, { total: 3.2 }],
            },
          },
        },
        {
          filePath: 'src/utils.ts',
          messages: [],
          stats: {
            times: {
              passes: [{ total: 8.1 }],
            },
          },
        },
      ]);
      proxy.setupPassWithOutput({ stdout: eslintOutput });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunLintBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          filesCount: 2,
          discoveredCount: 2,
          fileTimings: [
            FileTimingStub({ filePath: 'src/index.ts', durationMs: 15.7 }),
            FileTimingStub({ filePath: 'src/utils.ts', durationMs: 8.1 }),
          ],
          rawOutput: RawOutputStub({ stdout: eslintOutput, stderr: '', exitCode: 0 }),
        }),
      );
    });

    it('EDGE: {eslint output without stats} => returns empty fileTimings', async () => {
      const proxy = checkRunLintBrokerProxy();
      const eslintOutput = JSON.stringify([{ filePath: 'src/index.ts', messages: [] }]);
      proxy.setupPassWithOutput({ stdout: eslintOutput });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunLintBroker({
        projectFolder,
        fileList: [],
      });

      expect(result.fileTimings).toStrictEqual([]);
    });
  });
});
