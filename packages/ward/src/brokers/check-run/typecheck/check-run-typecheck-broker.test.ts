import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { RawOutputStub } from '../../../contracts/raw-output/raw-output.stub';
import { ErrorEntryStub } from '../../../contracts/error-entry/error-entry.stub';
import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';

import { checkRunTypecheckBroker } from './check-run-typecheck-broker';
import { checkRunTypecheckBrokerProxy } from './check-run-typecheck-broker.proxy';

describe('checkRunTypecheckBroker', () => {
  describe('passing typecheck', () => {
    it('VALID: {tsc exits 0} => returns pass result with no errors', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      const result = await checkRunTypecheckBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          rawOutput: RawOutputStub({ stdout: '', stderr: '', exitCode: 0 }),
        }),
      );
    });
  });

  describe('failing typecheck', () => {
    it('VALID: {tsc exits 1 with errors} => returns fail result with parsed errors', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      const tscOutput = 'src/index.ts(10,5): error TS2345: Argument mismatch.';
      proxy.setupFail({ stdout: tscOutput });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunTypecheckBroker({
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
              message: 'TS2345: Argument mismatch.',
              severity: 'error',
            }),
          ],
          testFailures: [],
          rawOutput: RawOutputStub({ stdout: tscOutput, stderr: '', exitCode: 1 }),
        }),
      );
    });
  });

  describe('filesCount', () => {
    it('VALID: {glob returns ts and tsx files} => returns combined filesCount', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      proxy.setupPass();
      proxy.setupGlobTs({ output: 'src/a.ts\nsrc/b.ts' });
      proxy.setupGlobTsx({ output: 'src/c.tsx' });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunTypecheckBroker({
        projectFolder,
        fileList: [],
      });

      expect(result.filesCount).toBe(3);
    });
  });

  describe('filtered by file list', () => {
    it('VALID: {tsc fails but errors not in file list} => returns pass after filtering', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      const tscOutput = 'src/other.ts(5,1): error TS2345: Type mismatch.';
      proxy.setupFail({ stdout: tscOutput });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunTypecheckBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/index.ts' })],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          rawOutput: RawOutputStub({ stdout: tscOutput, stderr: '', exitCode: 1 }),
        }),
      );
    });
  });
});
