import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { RawOutputStub } from '../../../contracts/raw-output/raw-output.stub';
import { TestFailureStub } from '../../../contracts/test-failure/test-failure.stub';
import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';
import { ErrorEntryStub } from '../../../contracts/error-entry/error-entry.stub';

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
          discoveredCount: 2,
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
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.test.ts'],
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
          discoveredCount: 2,
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          filesCount: expectedSuiteCount,
          onlyDiscovered: ['discovered.ts'],
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
          discoveredCount: 2,
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
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.test.ts'],
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
        '--testPathIgnorePatterns',
        '\\.integration\\.test\\.ts$|\\.e2e\\.test\\.ts$',
        '--runInBand',
        '--findRelatedTests',
        'src/index.ts',
      ]);
    });
  });

  describe('directory path filtering', () => {
    it('VALID: {fileList with directory path} => uses --testPathPatterns instead of --findRelatedTests', async () => {
      const proxy = checkRunUnitBrokerProxy();
      proxy.setDiscoveredFiles({
        files: ['src/brokers/quest/orchestration-loop/some-broker.test.ts', 'discovered.ts'],
      });
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      await checkRunUnitBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/brokers/quest/orchestration-loop' })],
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        '--json',
        '--no-color',
        '--forceExit',
        '--detectOpenHandles',
        '--testPathIgnorePatterns',
        '\\.integration\\.test\\.ts$|\\.e2e\\.test\\.ts$',
        '--runInBand',
        '--testPathPatterns',
        'src/brokers/quest/orchestration-loop',
      ]);
    });

    it('VALID: {fileList with multiple directory paths} => joins paths with pipe in --testPathPatterns', async () => {
      const proxy = checkRunUnitBrokerProxy();
      proxy.setDiscoveredFiles({
        files: [
          'src/brokers/quest/some-broker.test.ts',
          'src/transformers/some-transformer.test.ts',
        ],
      });
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      await checkRunUnitBroker({
        projectFolder,
        fileList: [
          GitRelativePathStub({ value: 'src/brokers/quest' }),
          GitRelativePathStub({ value: 'src/transformers' }),
        ],
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        '--json',
        '--no-color',
        '--forceExit',
        '--detectOpenHandles',
        '--testPathIgnorePatterns',
        '\\.integration\\.test\\.ts$|\\.e2e\\.test\\.ts$',
        '--runInBand',
        '--testPathPatterns',
        'src/brokers/quest|src/transformers',
      ]);
    });
  });

  describe('file type filtering', () => {
    it('VALID: {fileList with only .integration.test.ts file} => skips without spawning jest', async () => {
      const proxy = checkRunUnitBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      const result = await checkRunUnitBroker({
        projectFolder,
        fileList: [
          GitRelativePathStub({
            value: 'src/flows/chat-replay/chat-replay-flow.integration.test.ts',
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
            stderr: 'no matching unit test files in passthrough',
            exitCode: 0,
          }),
        }),
      );

      expect(proxy.getSpawnedArgs()).toBeUndefined();
    });

    it('VALID: {fileList with mix of unit and integration files} => only passes unit files to --findRelatedTests', async () => {
      const proxy = checkRunUnitBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      await checkRunUnitBroker({
        projectFolder,
        fileList: [
          GitRelativePathStub({ value: 'src/brokers/quest/spawn-ward-layer-broker.test.ts' }),
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
        '--testPathIgnorePatterns',
        '\\.integration\\.test\\.ts$|\\.e2e\\.test\\.ts$',
        '--runInBand',
        '--findRelatedTests',
        'src/brokers/quest/spawn-ward-layer-broker.test.ts',
      ]);
    });
  });

  describe('directory with no matching unit tests', () => {
    it('VALID: {fileList with directory that has no unit tests in discovered files} => skips without spawning jest', async () => {
      const proxy = checkRunUnitBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      const result = await checkRunUnitBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/transformers' })],
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
            stderr: 'no matching unit test files in passthrough',
            exitCode: 0,
          }),
        }),
      );

      expect(proxy.getSpawnedArgs()).toBeUndefined();
    });
  });

  describe('testNamePattern', () => {
    it('VALID: {testNamePattern provided} => appends --testNamePattern to jest args', async () => {
      const proxy = checkRunUnitBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      await checkRunUnitBroker({
        projectFolder,
        fileList: [],
        testNamePattern: 'my specific test',
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        '--json',
        '--no-color',
        '--forceExit',
        '--detectOpenHandles',
        '--testPathIgnorePatterns',
        '\\.integration\\.test\\.ts$|\\.e2e\\.test\\.ts$',
        '--runInBand',
        '--testNamePattern',
        'my specific test',
      ]);
    });

    it('VALID: {testNamePattern with directory path} => appends both --testPathPatterns and --testNamePattern', async () => {
      const proxy = checkRunUnitBrokerProxy();
      proxy.setDiscoveredFiles({
        files: ['src/brokers/quest/some-broker.test.ts', 'discovered.ts'],
      });
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      await checkRunUnitBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/brokers/quest' })],
        testNamePattern: 'foo|bar',
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        '--json',
        '--no-color',
        '--forceExit',
        '--detectOpenHandles',
        '--testPathIgnorePatterns',
        '\\.integration\\.test\\.ts$|\\.e2e\\.test\\.ts$',
        '--runInBand',
        '--testPathPatterns',
        'src/brokers/quest',
        '--testNamePattern',
        'foo|bar',
      ]);
    });
  });

  describe('testNamePattern zero matches', () => {
    it('VALID: {testNamePattern matches no tests} => returns fail with error about zero matching tests', async () => {
      const proxy = checkRunUnitBrokerProxy();
      const jestOutput = JSON.stringify({
        testResults: [{ name: 'src/index.test.ts', assertionResults: [] }],
        numTotalTestSuites: 1,
        numPassedTests: 0,
        success: true,
      });
      proxy.setupPassWithOutput({ stdout: jestOutput });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunUnitBroker({
        projectFolder,
        fileList: [],
        testNamePattern: 'XYZNONEXISTENT',
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 2,
          projectFolder,
          status: 'fail',
          errors: [
            ErrorEntryStub({
              filePath: 'jest',
              line: 0,
              column: 0,
              message:
                '--onlyTests pattern "XYZNONEXISTENT" matched 0 tests — possible typo or stale test name',
              severity: 'error',
            }),
          ],
          testFailures: [],
          filesCount: 1,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.test.ts'],
          rawOutput: RawOutputStub({ stdout: jestOutput, stderr: '', exitCode: 0 }),
        }),
      );
    });

    it('VALID: {testNamePattern matches some tests} => returns pass with no errors', async () => {
      const proxy = checkRunUnitBrokerProxy();
      const jestOutput = JSON.stringify({
        testResults: [{ name: 'src/index.test.ts', assertionResults: [] }],
        numTotalTestSuites: 1,
        numPassedTests: 3,
        success: true,
      });
      proxy.setupPassWithOutput({ stdout: jestOutput });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunUnitBroker({
        projectFolder,
        fileList: [],
        testNamePattern: 'VALID',
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 2,
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          filesCount: 1,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.test.ts'],
          rawOutput: RawOutputStub({ stdout: jestOutput, stderr: '', exitCode: 0 }),
        }),
      );
    });

    it('VALID: {no testNamePattern with zero tests} => returns pass preserving existing behavior', async () => {
      const proxy = checkRunUnitBrokerProxy();
      const jestOutput = JSON.stringify({
        testResults: [{ name: 'src/index.test.ts', assertionResults: [] }],
        numTotalTestSuites: 1,
        numPassedTests: 0,
        success: true,
      });
      proxy.setupPassWithOutput({ stdout: jestOutput });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunUnitBroker({
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
          filesCount: 1,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.test.ts'],
          rawOutput: RawOutputStub({ stdout: jestOutput, stderr: '', exitCode: 0 }),
        }),
      );
    });
  });

  describe('skip on zero discovered', () => {
    it('VALID: {no test files discovered} => returns skip result without spawning jest', async () => {
      const proxy = checkRunUnitBrokerProxy();
      proxy.setupNoTestFiles();

      const projectFolder = ProjectFolderStub();

      const result = await checkRunUnitBroker({
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
