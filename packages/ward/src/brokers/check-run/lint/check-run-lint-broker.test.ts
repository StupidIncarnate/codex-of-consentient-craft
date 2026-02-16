import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { RawOutputStub } from '../../../contracts/raw-output/raw-output.stub';
import { ErrorEntryStub } from '../../../contracts/error-entry/error-entry.stub';

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
          rawOutput: RawOutputStub({ stdout: eslintOutput, stderr: '', exitCode: 1 }),
        }),
      );
    });
  });
});
