import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { RawOutputStub } from '../../../contracts/raw-output/raw-output.stub';
import { TestFailureStub } from '../../../contracts/test-failure/test-failure.stub';
import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';
import { FileTimingStub } from '../../../contracts/file-timing/file-timing.stub';
import { OpenHandleStub } from '../../../contracts/open-handle/open-handle.stub';

import { checkRunIntegrationBroker } from './check-run-integration-broker';
import { checkRunIntegrationBrokerProxy } from './check-run-integration-broker.proxy';

describe('checkRunIntegrationBroker', () => {
  describe('passing tests', () => {
    it('VALID: {jest exits 0} => returns pass result with no test failures', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPass({ projectFolder });

      const result = await checkRunIntegrationBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
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
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupFail({ projectFolder, stdout: jestOutput });

      const result = await checkRunIntegrationBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
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
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupFailWithBadOutput({ projectFolder });

      const result = await checkRunIntegrationBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
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

  describe('source export condition', () => {
    it('VALID: {shared source barrel reachable} => spawns jest with NODE_OPTIONS=--conditions=source', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPass({ projectFolder });

      await checkRunIntegrationBroker({ projectFolder, fileList: [] });

      expect(proxy.getSpawnedNodeOptions()).toBe('--conditions=source');
    });

    it('VALID: {consumer install, shared packs dist only} => spawns jest with no NODE_OPTIONS at all', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupSourceConditionUnsupported({ projectFolder });
      proxy.setupPass({ projectFolder });

      await checkRunIntegrationBroker({ projectFolder, fileList: [] });

      expect(proxy.getSpawnedNodeOptions()).toBe(undefined);
    });
  });

  describe('unscoped run', () => {
    it('VALID: {no fileList} => passes --maxWorkers=25% and stays off --runInBand', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPass({ projectFolder });

      await checkRunIntegrationBroker({
        projectFolder,
        fileList: [],
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        '--json',
        '--no-color',
        '--forceExit',
        '--maxWorkers=25%',
        '--testTimeout=30000',
        '--testPathPatterns',
        '\\.integration\\.test\\.(ts|tsx|js|jsx)$',
      ]);
    });
  });

  describe('file list filtering', () => {
    it('VALID: {fileList provided} => passes --findRelatedTests and --runInBand with files to jest', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPass({ projectFolder });

      await checkRunIntegrationBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/index.ts' })],
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        '--json',
        '--no-color',
        '--forceExit',
        '--testTimeout=30000',
        '--testPathPatterns',
        '\\.integration\\.test\\.(ts|tsx|js|jsx)$',
        '--runInBand',
        '--detectOpenHandles',
        '--findRelatedTests',
        'src/index.ts',
      ]);
    });
  });

  describe('directory path filtering', () => {
    it('VALID: {fileList with directory path} => combines directory with integration pattern in --testPathPatterns, and stays off --runInBand', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setDiscoveredFiles({
        files: ['src/flows/chat-replay/chat-replay.integration.test.ts', 'discovered.ts'],
      });
      proxy.setupPass({ projectFolder });

      await checkRunIntegrationBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/flows/chat-replay' })],
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        '--json',
        '--no-color',
        '--forceExit',
        '--maxWorkers=25%',
        '--testTimeout=30000',
        '--testPathPatterns',
        '(?:src/flows/chat-replay).*\\.integration\\.test\\.(ts|tsx|js|jsx)$',
      ]);
    });

    it('VALID: {fileList with multiple directory paths} => joins paths in combined pattern, and stays off --runInBand', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setDiscoveredFiles({
        files: [
          'src/flows/quest/quest.integration.test.ts',
          'src/flows/install/install.integration.test.ts',
        ],
      });
      proxy.setupPass({ projectFolder });

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
        '--maxWorkers=25%',
        '--testTimeout=30000',
        '--testPathPatterns',
        '(?:src/flows/quest|src/flows/install).*\\.integration\\.test\\.(ts|tsx|js|jsx)$',
      ]);
    });

    it('VALID: {fileList with .integration.test.ts file} => uses --findRelatedTests with matching file', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPass({ projectFolder });

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
        '--testTimeout=30000',
        '--testPathPatterns',
        '\\.integration\\.test\\.(ts|tsx|js|jsx)$',
        '--runInBand',
        '--detectOpenHandles',
        '--findRelatedTests',
        'src/flows/chat-replay/chat-replay-flow.integration.test.ts',
      ]);
    });

    it('VALID: {fileList with non-integration .test.ts file} => skips without spawning jest', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPass({ projectFolder });

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
          discoveredCount: 1,
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

      expect(proxy.getSpawnedArgs()).toBe(undefined);
    });

    it('VALID: {fileList with mix of integration and unit test files} => only passes integration files to --findRelatedTests', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPass({ projectFolder });

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
        '--testTimeout=30000',
        '--testPathPatterns',
        '\\.integration\\.test\\.(ts|tsx|js|jsx)$',
        '--runInBand',
        '--detectOpenHandles',
        '--findRelatedTests',
        'src/flows/chat-replay/chat-replay-flow.integration.test.ts',
      ]);
    });
  });

  describe('directory with no matching integration tests', () => {
    it('VALID: {fileList with directory that has no integration tests in discovered files} => skips without spawning jest', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPass({ projectFolder });

      const result = await checkRunIntegrationBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/transformers' })],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
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

      expect(proxy.getSpawnedArgs()).toBe(undefined);
    });
  });

  describe('testNamePattern', () => {
    it('VALID: {testNamePattern provided, no file scope} => appends --testNamePattern to jest args and stays off --runInBand', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPass({ projectFolder });

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
        '--maxWorkers=25%',
        '--testTimeout=30000',
        '--testPathPatterns',
        '\\.integration\\.test\\.(ts|tsx|js|jsx)$',
        '--testNamePattern',
        'should connect',
      ]);
    });
  });

  describe('testNamePattern zero matches', () => {
    it('VALID: {testNamePattern matches no tests} => skips the package and records the pattern as unmatched', async () => {
      const jestOutput = JSON.stringify({
        testResults: [{ name: 'src/index.integration.test.ts', assertionResults: [] }],
        numTotalTestSuites: 1,
        numPassedTests: 0,
        success: true,
      });
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPassWithOutput({ projectFolder, stdout: jestOutput });

      const result = await checkRunIntegrationBroker({
        projectFolder,
        fileList: [],
        testNamePattern: 'XYZNONEXISTENT',
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'skip',
          testNamePatternMatch: 'unmatched',
          errors: [],
          testFailures: [],
          filesCount: 1,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.integration.test.ts'],
          rawOutput: RawOutputStub({ stdout: jestOutput, stderr: '', exitCode: 0 }),
        }),
      );
    });

    it('VALID: {testNamePattern matches some tests} => returns pass recording the pattern as matched', async () => {
      const jestOutput = JSON.stringify({
        testResults: [{ name: 'src/index.integration.test.ts', assertionResults: [] }],
        numTotalTestSuites: 1,
        numPassedTests: 3,
        success: true,
      });
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPassWithOutput({ projectFolder, stdout: jestOutput });

      const result = await checkRunIntegrationBroker({
        projectFolder,
        fileList: [],
        testNamePattern: 'VALID',
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'pass',
          testNamePatternMatch: 'matched',
          errors: [],
          testFailures: [],
          filesCount: 1,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.integration.test.ts'],
          rawOutput: RawOutputStub({ stdout: jestOutput, stderr: '', exitCode: 0 }),
        }),
      );
    });

    it('VALID: {no testNamePattern with zero tests} => returns pass', async () => {
      const jestOutput = JSON.stringify({
        testResults: [{ name: 'src/index.integration.test.ts', assertionResults: [] }],
        numTotalTestSuites: 1,
        numPassedTests: 0,
        success: true,
      });
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPassWithOutput({ projectFolder, stdout: jestOutput });

      const result = await checkRunIntegrationBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          filesCount: 1,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.integration.test.ts'],
          rawOutput: RawOutputStub({ stdout: jestOutput, stderr: '', exitCode: 0 }),
        }),
      );
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

  describe('no related tests in file scope', () => {
    it('VALID: {fileList provided, jest finds no related integration tests} => returns skip not fail', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupFailWithStderr({
        projectFolder,
        stdout: '',
        stderr:
          'No tests found, exiting with code 1\nRun with `--passWithNoTests` to exit with code 0\nPattern: testing.ts|\\.integration\\.test\\.(ts|tsx|js|jsx)$ - 0 matches',
      });

      const result = await checkRunIntegrationBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'testing.ts' })],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'skip',
          errors: [],
          testFailures: [],
          rawOutput: RawOutputStub({
            stdout: '',
            stderr: 'no integration tests related to changed files',
            exitCode: 0,
          }),
        }),
      );
    });

    it('VALID: {no fileList, jest emits no-tests banner} => returns fail preserving full-run protection', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupFailWithStderr({
        projectFolder,
        stdout: '',
        stderr: 'No tests found, exiting with code 1\n',
      });

      const result = await checkRunIntegrationBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'fail',
          errors: [],
          testFailures: [],
          onlyDiscovered: ['discovered.ts'],
          rawOutput: RawOutputStub({
            stdout: 'No tests found, exiting with code 1\n',
            stderr: '',
            exitCode: 1,
          }),
        }),
      );
    });
  });

  describe('fileTimings', () => {
    it('VALID: {jest output with startTime/endTime} => returns fileTimings with per-file durations', async () => {
      const jestOutput = JSON.stringify({
        testResults: [
          {
            name: 'src/flows/install/install.integration.test.ts',
            assertionResults: [],
            startTime: 5000,
            endTime: 8500,
          },
          {
            name: 'src/flows/quest/quest.integration.test.ts',
            assertionResults: [],
            startTime: 9000,
            endTime: 10200,
          },
        ],
        numTotalTestSuites: 2,
        numPassedTests: 5,
        success: true,
      });
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPassWithOutput({ projectFolder, stdout: jestOutput });

      const result = await checkRunIntegrationBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          filesCount: 2,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: [
            'src/flows/install/install.integration.test.ts',
            'src/flows/quest/quest.integration.test.ts',
          ],
          fileTimings: [
            FileTimingStub({
              filePath: 'src/flows/install/install.integration.test.ts',
              durationMs: 3500,
              testMs: 0,
            }),
            FileTimingStub({
              filePath: 'src/flows/quest/quest.integration.test.ts',
              durationMs: 1200,
              testMs: 0,
            }),
          ],
          rawOutput: RawOutputStub({ stdout: jestOutput, stderr: '', exitCode: 0 }),
        }),
      );
    });

    it('EDGE: {jest output without startTime/endTime} => returns empty fileTimings', async () => {
      const jestOutput = JSON.stringify({
        testResults: [
          { name: 'src/flows/install/install.integration.test.ts', assertionResults: [] },
        ],
        numTotalTestSuites: 1,
        numPassedTests: 2,
        success: true,
      });
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPassWithOutput({ projectFolder, stdout: jestOutput });

      const result = await checkRunIntegrationBroker({
        projectFolder,
        fileList: [],
      });

      expect(result.fileTimings).toStrictEqual([]);
    });

    it('VALID: {jest output with assertionResults carrying durations} => returns testMs summed from assertion durations', async () => {
      const jestOutput = JSON.stringify({
        testResults: [
          {
            name: 'src/flows/install/install.integration.test.ts',
            assertionResults: [
              { status: 'passed', fullName: 'VALID: {a} => b', duration: 320 },
              { status: 'passed', fullName: 'VALID: {c} => d', duration: 180 },
            ],
            startTime: 5000,
            endTime: 8500,
          },
        ],
        numTotalTestSuites: 1,
        numPassedTests: 2,
        success: true,
      });
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPassWithOutput({ projectFolder, stdout: jestOutput });

      const result = await checkRunIntegrationBroker({
        projectFolder,
        fileList: [],
      });

      expect(result.fileTimings).toStrictEqual([
        FileTimingStub({
          filePath: 'src/flows/install/install.integration.test.ts',
          durationMs: 3500,
          testMs: 500,
        }),
      ]);
    });

    it('EDGE: {jest output with null and absent assertion duration} => coerces both to 0 in the testMs sum', async () => {
      const jestOutput = JSON.stringify({
        testResults: [
          {
            name: 'src/flows/install/install.integration.test.ts',
            assertionResults: [
              { status: 'passed', fullName: 'VALID: {a} => b', duration: 90 },
              { status: 'passed', fullName: 'VALID: {c} => d', duration: null },
              { status: 'passed', fullName: 'VALID: {e} => f' },
            ],
            startTime: 5000,
            endTime: 8500,
          },
        ],
        numTotalTestSuites: 1,
        numPassedTests: 3,
        success: true,
      });
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPassWithOutput({ projectFolder, stdout: jestOutput });

      const result = await checkRunIntegrationBroker({
        projectFolder,
        fileList: [],
      });

      expect(result.fileTimings).toStrictEqual([
        FileTimingStub({
          filePath: 'src/flows/install/install.integration.test.ts',
          durationMs: 3500,
          testMs: 90,
        }),
      ]);
    });
  });

  describe('openHandles', () => {
    it('VALID: {jest output with openHandles entries} => returns matching OpenHandle values on the result', async () => {
      const jestOutput = JSON.stringify({
        testResults: [],
        numTotalTestSuites: 1,
        openHandles: [
          {
            name: 'Error',
            message: 'TCPSERVERWRAP',
            stack: 'at Server.listen (src/startup/start-server.ts:12:5)',
          },
          {
            name: 'Error',
            message: 'Timeout',
            stack: 'at Timeout._onTimeout (src/adapters/poll/poll-adapter.ts:8:3)',
          },
        ],
        success: true,
      });
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPassWithOutput({ projectFolder, stdout: jestOutput });

      const result = await checkRunIntegrationBroker({
        projectFolder,
        fileList: [],
      });

      expect(result.openHandles).toStrictEqual([
        OpenHandleStub({
          name: 'Error',
          message: 'TCPSERVERWRAP',
          stack: 'at Server.listen (src/startup/start-server.ts:12:5)',
        }),
        OpenHandleStub({
          name: 'Error',
          message: 'Timeout',
          stack: 'at Timeout._onTimeout (src/adapters/poll/poll-adapter.ts:8:3)',
        }),
      ]);
    });

    it('EDGE: {openHandles entry with no name, message or stack} => coerces name to Error and message/stack to empty string', async () => {
      const jestOutput = JSON.stringify({
        testResults: [],
        numTotalTestSuites: 1,
        openHandles: [{}],
        success: true,
      });
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPassWithOutput({ projectFolder, stdout: jestOutput });

      const result = await checkRunIntegrationBroker({
        projectFolder,
        fileList: [],
      });

      expect(result.openHandles).toStrictEqual([
        OpenHandleStub({ name: 'Error', message: '', stack: '' }),
      ]);
    });

    it('EMPTY: {jest output with no openHandles key} => returns empty openHandles', async () => {
      const jestOutput = JSON.stringify({
        testResults: [],
        numTotalTestSuites: 1,
        success: true,
      });
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunIntegrationBrokerProxy();
      proxy.setupPassWithOutput({ projectFolder, stdout: jestOutput });

      const result = await checkRunIntegrationBroker({
        projectFolder,
        fileList: [],
      });

      expect(result.openHandles).toStrictEqual([]);
    });
  });

  // Jest refuses `--runInBand` and `--maxWorkers` together and exits non-zero with its usage
  // banner, which ward then reports as a crash plus a DISCOVERY MISMATCH naming nothing close to
  // the real cause. Derived from the args each scope actually spawns — never a copy of any
  // expected array above — so a scope this broker grows later stays covered without editing this
  // test.
  describe('no jest command carries both --runInBand and a --maxWorkers flag', () => {
    it('VALID: {file scope, directory scope, mixed scope, unscoped run} => spawns no jest command with both flags', async () => {
      const projectFolder = ProjectFolderStub();

      const fileScopeProxy = checkRunIntegrationBrokerProxy();
      fileScopeProxy.setupPass({ projectFolder });
      await checkRunIntegrationBroker({
        projectFolder,
        fileList: [
          GitRelativePathStub({
            value: 'src/flows/chat-replay/chat-replay-flow.integration.test.ts',
          }),
        ],
      });
      const fileScopeArgs = String(fileScopeProxy.getSpawnedArgs()).split(',');

      const directoryScopeProxy = checkRunIntegrationBrokerProxy();
      directoryScopeProxy.setDiscoveredFiles({
        files: ['src/flows/chat-replay/chat-replay.integration.test.ts', 'discovered.ts'],
      });
      directoryScopeProxy.setupPass({ projectFolder });
      await checkRunIntegrationBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/flows/chat-replay' })],
      });
      const directoryScopeArgs = String(directoryScopeProxy.getSpawnedArgs()).split(',');

      const mixedScopeProxy = checkRunIntegrationBrokerProxy();
      mixedScopeProxy.setupPass({ projectFolder });
      await checkRunIntegrationBroker({
        projectFolder,
        fileList: [
          GitRelativePathStub({
            value: 'src/flows/chat-replay/chat-replay-flow.integration.test.ts',
          }),
          GitRelativePathStub({ value: 'src/flows/install' }),
        ],
      });
      const mixedScopeArgs = String(mixedScopeProxy.getSpawnedArgs()).split(',');

      const unscopedProxy = checkRunIntegrationBrokerProxy();
      unscopedProxy.setupPass({ projectFolder });
      await checkRunIntegrationBroker({ projectFolder, fileList: [] });
      const unscopedArgs = String(unscopedProxy.getSpawnedArgs()).split(',');

      const scopedArgLists = [fileScopeArgs, directoryScopeArgs, mixedScopeArgs, unscopedArgs];

      const violationCounts = scopedArgLists.map((argsList) => {
        const runInBandCount = argsList.filter((arg) => arg === '--runInBand').length;
        const maxWorkersCount = argsList.filter((arg) => arg.startsWith('--maxWorkers')).length;
        return Math.min(runInBandCount, maxWorkersCount);
      });

      const totalViolations = violationCounts.reduce((sum, count) => sum + count, 0);

      expect(totalViolations).toBe(0);
    });
  });
});
