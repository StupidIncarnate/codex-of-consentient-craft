import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { RawOutputStub } from '../../../contracts/raw-output/raw-output.stub';
import { ErrorEntryStub } from '../../../contracts/error-entry/error-entry.stub';
import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';

import { checkRunTypecheckBroker } from './check-run-typecheck-broker';
import { checkRunTypecheckBrokerProxy } from './check-run-typecheck-broker.proxy';

describe('checkRunTypecheckBroker', () => {
  describe('passing typecheck', () => {
    it('VALID: {tsc exits 0 with listFiles output} => returns pass result with filesCount', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      const listFilesOutput = [
        '/project/node_modules/typescript/lib/lib.es5.d.ts',
        '/project/src/index.ts',
        '/project/src/utils.ts',
        '/project/src/types.ts',
      ].join('\n');
      proxy.setupPass({ stdout: listFilesOutput });

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
          filesCount: 3,
          rawOutput: RawOutputStub({ stdout: listFilesOutput, exitCode: 0 }),
        }),
      );
    });
  });

  describe('failing typecheck', () => {
    it('VALID: {tsc exits 1 with errors and listFiles} => returns fail result with parsed errors and filesCount', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      const tscOutput = [
        '/project/node_modules/typescript/lib/lib.es5.d.ts',
        '/project/src/index.ts',
        '/project/src/utils.ts',
        'src/index.ts(10,5): error TS2345: Argument mismatch.',
      ].join('\n');
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
          filesCount: 2,
          rawOutput: RawOutputStub({ stdout: tscOutput, stderr: '', exitCode: 1 }),
        }),
      );
    });
  });

  describe('crash handling', () => {
    it('VALID: {tsc exits 1 but parser finds 0 errors} => status stays fail', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      const tscOutput = 'error TS5058: The specified path does not exist';
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
          errors: [],
          testFailures: [],
          filesCount: 0,
          rawOutput: RawOutputStub({ stdout: tscOutput, stderr: '', exitCode: 1 }),
        }),
      );
    });
  });

  describe('missing tsconfig.json', () => {
    it('VALID: {no tsconfig.json in project folder} => returns skip result with reason', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      proxy.setupNoTsconfig();

      const projectFolder = ProjectFolderStub();

      const result = await checkRunTypecheckBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'skip',
          errors: [],
          testFailures: [],
          filesCount: 0,
          rawOutput: RawOutputStub({ stdout: '', stderr: 'no tsconfig.json', exitCode: 0 }),
        }),
      );
    });
  });

  describe('filtered by file list', () => {
    it('VALID: {tsc fails but errors not in file list} => returns pass after filtering', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      const tscOutput = [
        '/project/src/index.ts',
        'src/other.ts(5,1): error TS2345: Type mismatch.',
      ].join('\n');
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
          filesCount: 1,
          rawOutput: RawOutputStub({ stdout: tscOutput, stderr: '', exitCode: 1 }),
        }),
      );
    });
  });
});
