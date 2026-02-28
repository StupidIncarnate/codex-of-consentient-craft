import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { RawOutputStub } from '../../../contracts/raw-output/raw-output.stub';
import { TestFailureStub } from '../../../contracts/test-failure/test-failure.stub';
import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';

import { checkRunIntegrationBroker } from './check-run-integration-broker';
import { checkRunIntegrationBrokerProxy } from './check-run-integration-broker.proxy';

describe('checkRunIntegrationBroker', () => {
  describe('passing tests', () => {
    it('VALID: {jest exits 0} => returns pass result with no test failures', async () => {
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      const result = await checkRunIntegrationBroker({
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
      const proxy = checkRunIntegrationBrokerProxy();
      const jestOutput = JSON.stringify({
        testResults: [
          {
            name: 'src/index.integration.test.ts',
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

      const result = await checkRunIntegrationBroker({
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
              suitePath: 'src/index.integration.test.ts',
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
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupFailWithBadOutput();

      const projectFolder = ProjectFolderStub();

      const result = await checkRunIntegrationBroker({
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

  describe('file list filtering', () => {
    it('VALID: {fileList provided} => passes --findRelatedTests and --runInBand with files to jest', async () => {
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      await checkRunIntegrationBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/index.ts' })],
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        '--json',
        '--no-color',
        '--forceExit',
        '--detectOpenHandles',
        '--testPathPatterns',
        '\\.integration\\.test\\.ts$',
        '--runInBand',
        '--findRelatedTests',
        'src/index.ts',
      ]);
    });
  });
});
