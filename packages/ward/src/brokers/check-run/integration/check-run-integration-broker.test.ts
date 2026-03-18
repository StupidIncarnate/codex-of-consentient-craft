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
          discoveredCount: 2,
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          onlyDiscovered: ['discovered.ts'],
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
          discoveredCount: 2,
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
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.integration.test.ts'],
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
          discoveredCount: 2,
          projectFolder,
          status: 'fail',
          errors: [],
          testFailures: [],
          onlyDiscovered: ['discovered.ts'],
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

  describe('directory path filtering', () => {
    it('VALID: {fileList with directory path} => combines directory with integration pattern in --testPathPatterns', async () => {
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      await checkRunIntegrationBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/flows/chat-replay' })],
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        '--json',
        '--no-color',
        '--forceExit',
        '--detectOpenHandles',
        '--testPathPatterns',
        '(?:src/flows/chat-replay).*\\.integration\\.test\\.ts$',
        '--runInBand',
      ]);
    });

    it('VALID: {fileList with multiple directory paths} => joins paths in combined pattern', async () => {
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      await checkRunIntegrationBroker({
        projectFolder,
        fileList: [
          GitRelativePathStub({ value: 'src/flows/quest' }),
          GitRelativePathStub({ value: 'src/flows/install' }),
        ],
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        '--json',
        '--no-color',
        '--forceExit',
        '--detectOpenHandles',
        '--testPathPatterns',
        '(?:src/flows/quest|src/flows/install).*\\.integration\\.test\\.ts$',
        '--runInBand',
      ]);
    });

    it('VALID: {fileList with .integration.test.ts file} => uses --findRelatedTests with matching file', async () => {
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      await checkRunIntegrationBroker({
        projectFolder,
        fileList: [
          GitRelativePathStub({
            value: 'src/flows/chat-replay/chat-replay-flow.integration.test.ts',
          }),
        ],
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
        'src/flows/chat-replay/chat-replay-flow.integration.test.ts',
      ]);
    });

    it('VALID: {fileList with non-integration .test.ts file} => skips without spawning jest', async () => {
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      const result = await checkRunIntegrationBroker({
        projectFolder,
        fileList: [
          GitRelativePathStub({
            value: 'src/brokers/quest/orchestration-loop/spawn-ward-layer-broker.test.ts',
          }),
        ],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 2,
          projectFolder,
          status: 'skip',
          errors: [],
          testFailures: [],
          rawOutput: RawOutputStub({
            stdout: '',
            stderr: 'no matching integration test files in passthrough',
            exitCode: 0,
          }),
        }),
      );

      expect(proxy.getSpawnedArgs()).toBeUndefined();
    });

    it('VALID: {fileList with mix of integration and unit test files} => only passes integration files to --findRelatedTests', async () => {
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      await checkRunIntegrationBroker({
        projectFolder,
        fileList: [
          GitRelativePathStub({
            value: 'src/brokers/quest/spawn-ward-layer-broker.test.ts',
          }),
          GitRelativePathStub({
            value: 'src/flows/chat-replay/chat-replay-flow.integration.test.ts',
          }),
        ],
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
        'src/flows/chat-replay/chat-replay-flow.integration.test.ts',
      ]);
    });
  });

  describe('testNamePattern', () => {
    it('VALID: {testNamePattern provided} => appends --testNamePattern to jest args', async () => {
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      await checkRunIntegrationBroker({
        projectFolder,
        fileList: [],
        testNamePattern: 'should connect',
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
        '--testNamePattern',
        'should connect',
      ]);
    });
  });

  describe('skip on zero discovered', () => {
    it('VALID: {no integration test files discovered} => returns skip result without spawning jest', async () => {
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupNoTestFiles();

      const projectFolder = ProjectFolderStub();

      const result = await checkRunIntegrationBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'skip',
          errors: [],
          testFailures: [],
          rawOutput: RawOutputStub({
            stdout: '',
            stderr: 'no test files discovered',
            exitCode: 0,
          }),
        }),
      );
    });
  });
});
