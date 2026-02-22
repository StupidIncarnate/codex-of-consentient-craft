import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { RawOutputStub } from '../../../contracts/raw-output/raw-output.stub';
import { TestFailureStub } from '../../../contracts/test-failure/test-failure.stub';
import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';

import { checkRunUnitBroker } from './check-run-unit-broker';
import { checkRunUnitBrokerProxy } from './check-run-unit-broker.proxy';

describe('checkRunUnitBroker', () => {
  describe('passing tests', () => {
    it('VALID: {jest exits 0} => returns pass result with no test failures', async () => {
      const proxy = checkRunUnitBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      const result = await checkRunUnitBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          rawOutput: RawOutputStub({
            stdout: '{"testResults":[],"numTotalTestSuites":0,"success":true}',
            stderr: '',
            exitCode: 0,
          }),
        }),
      );
    });
  });

  describe('failing tests', () => {
    it('VALID: {jest exits 1 with failures} => returns fail result with parsed test failures', async () => {
      const proxy = checkRunUnitBrokerProxy();
      const jestOutput = JSON.stringify({
        testResults: [
          {
            name: 'src/index.test.ts',
            assertionResults: [
              {
                status: 'failed',
                fullName: 'should return valid result',
                failureMessages: ['Expected true to be false'],
              },
            ],
          },
        ],
        success: false,
      });
      proxy.setupFail({ stdout: jestOutput });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunUnitBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'fail',
          errors: [],
          testFailures: [
            TestFailureStub({
              suitePath: 'src/index.test.ts',
              testName: 'should return valid result',
              message: 'Expected true to be false',
            }),
          ],
          rawOutput: RawOutputStub({ stdout: jestOutput, stderr: '', exitCode: 1 }),
        }),
      );
    });
  });

  describe('unparseable output', () => {
    it('VALID: {jest exits 1 with non-JSON output} => returns fail result with empty test failures', async () => {
      const proxy = checkRunUnitBrokerProxy();
      proxy.setupFailWithBadOutput();

      const projectFolder = ProjectFolderStub();

      const result = await checkRunUnitBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'fail',
          errors: [],
          testFailures: [],
          rawOutput: RawOutputStub({
            stdout: 'not valid json \x1b[31m',
            stderr: '',
            exitCode: 1,
          }),
        }),
      );
    });
  });

  describe('filesCount', () => {
    it('VALID: {jest output with numTotalTestSuites} => returns filesCount from jest output', async () => {
      const proxy = checkRunUnitBrokerProxy();
      const expectedSuiteCount = 3;
      const jestOutput = JSON.stringify({
        testResults: [
          { name: 'a.test.ts', assertionResults: [] },
          { name: 'b.test.ts', assertionResults: [] },
        ],
        numTotalTestSuites: expectedSuiteCount,
        success: true,
      });
      proxy.setupPassWithOutput({ stdout: jestOutput });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunUnitBroker({
        projectFolder,
        fileList: [],
      });

      expect(result.filesCount).toStrictEqual(expectedSuiteCount);
    });
  });

  describe('stderr contamination', () => {
    it('VALID: {jest passes with ts-jest warnings on stderr} => returns pass with correct filesCount', async () => {
      const proxy = checkRunUnitBrokerProxy();
      const expectedSuiteCount = 1;
      const jestOutput = JSON.stringify({
        testResults: [],
        numTotalTestSuites: expectedSuiteCount,
        success: true,
      });
      proxy.setupPassWithStderr({
        stdout: jestOutput,
        stderr:
          'ts-jest[ts-compiler] (WARN) Unable to process file, falling back to original content',
      });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunUnitBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          filesCount: expectedSuiteCount,
          rawOutput: RawOutputStub({
            stdout: `${jestOutput}ts-jest[ts-compiler] (WARN) Unable to process file, falling back to original content`,
            stderr: '',
            exitCode: 0,
          }),
        }),
      );
    });

    it('VALID: {jest fails with stderr warnings} => returns fail with parsed test failures', async () => {
      const proxy = checkRunUnitBrokerProxy();
      const stderrText = 'ts-jest[ts-compiler] (WARN) Unable to process file';
      const jestOutput = JSON.stringify({
        testResults: [
          {
            name: 'src/index.test.ts',
            assertionResults: [
              {
                status: 'failed',
                fullName: 'should work correctly',
                failureMessages: ['Expected true to be false'],
              },
            ],
          },
        ],
        success: false,
      });
      proxy.setupFailWithStderr({
        stdout: jestOutput,
        stderr: stderrText,
      });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunUnitBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'fail',
          errors: [],
          testFailures: [
            TestFailureStub({
              suitePath: 'src/index.test.ts',
              testName: 'should work correctly',
              message: 'Expected true to be false',
            }),
          ],
          rawOutput: RawOutputStub({
            stdout: `${jestOutput}${stderrText}`,
            stderr: '',
            exitCode: 1,
          }),
        }),
      );
    });
  });

  describe('file list filtering', () => {
    it('VALID: {fileList provided} => passes --findRelatedTests and --runInBand with files to jest', async () => {
      const proxy = checkRunUnitBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      await checkRunUnitBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/index.ts' })],
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        '--json',
        '--no-color',
        '--forceExit',
        '--detectOpenHandles',
        '--runInBand',
        '--findRelatedTests',
        'src/index.ts',
      ]);
    });
  });
});
