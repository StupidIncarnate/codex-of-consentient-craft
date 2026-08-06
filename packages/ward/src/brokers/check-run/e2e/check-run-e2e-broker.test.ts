import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { RawOutputStub } from '../../../contracts/raw-output/raw-output.stub';
import { TestFailureStub } from '../../../contracts/test-failure/test-failure.stub';
import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';
import { PassingTestStub } from '../../../contracts/passing-test/passing-test.stub';

import { checkRunE2eBroker } from './check-run-e2e-broker';
import { checkRunE2eBrokerProxy } from './check-run-e2e-broker.proxy';

describe('checkRunE2eBroker', () => {
  describe('skip', () => {
    it('VALID: {no playwright.config.ts} => returns skip result', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupNoPlaywrightConfig({ projectFolder });

      const result = await checkRunE2eBroker({
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
            stderr: 'no playwright.config.ts',
            exitCode: 0,
          }),
        }),
      );
    });
  });

  describe('passing tests', () => {
    it('VALID: {playwright exits 0 with empty output} => returns pass result with no test failures', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      const result = await checkRunE2eBroker({
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
            stdout: '',
            stderr: '',
            exitCode: 0,
          }),
        }),
      );
    });

    it('VALID: {playwright exits 0 with line output} => returns pass result with filesCount from line output', async () => {
      const lineOutput = [
        '[1/2] [chromium] › packages/web/src/flows/app/smoke.e2e.ts:20:7 › Smoke › loads page',
        '[2/2] [chromium] › packages/web/src/flows/quest-chat/chat.e2e.ts:10:7 › Chat › sends message',
      ].join('\n');
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPassWithOutput({ projectFolder, stdout: lineOutput });

      const result = await checkRunE2eBroker({
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
            'packages/web/src/flows/app/smoke.e2e.ts',
            'packages/web/src/flows/quest-chat/chat.e2e.ts',
          ],
          rawOutput: RawOutputStub({
            stdout: lineOutput,
            stderr: '',
            exitCode: 0,
          }),
        }),
      );
    });
  });

  describe('failing tests', () => {
    it('VALID: {playwright exits 1 with failure output} => returns fail result with parsed test failures', async () => {
      const failOutput = [
        '[1/1] [chromium] › packages/web/src/flows/home/login.e2e.ts:10:7 › Login › should display login form',
        '  1) [chromium] › packages/web/src/flows/home/login.e2e.ts:10:7 › Login › should display login form ',
        '',
        '    Element not found',
        '',
      ].join('\n');
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupFail({ projectFolder, stdout: failOutput });

      const result = await checkRunE2eBroker({
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
              suitePath: 'packages/web/src/flows/home/login.e2e.ts',
              testName: 'Login › should display login form',
              message: 'Element not found',
            }),
          ],
          filesCount: 1,
          onlyProcessed: ['packages/web/src/flows/home/login.e2e.ts'],
          onlyDiscovered: ['discovered.ts'],
          rawOutput: RawOutputStub({ stdout: failOutput, stderr: '', exitCode: 1 }),
        }),
      );
    });
  });

  describe('fail with empty output', () => {
    it('VALID: {playwright exits 1 with empty output} => returns fail result with no test failures', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupFailWithEmptyOutput({ projectFolder });

      const result = await checkRunE2eBroker({
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
            stdout: '',
            stderr: '',
            exitCode: 1,
          }),
        }),
      );
    });
  });

  describe('file list filtering', () => {
    it('VALID: {fileList with e2e spec files} => appends only e2e file paths to playwright args', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      await checkRunE2eBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'packages/web/src/flows/home/login.e2e.ts' })],
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        'test',
        '--reporter=line,json',
        'packages/web/src/flows/home/login.e2e.ts',
      ]);
    });

    it('VALID: {fileList with no e2e files} => returns skip result', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      const result = await checkRunE2eBroker({
        projectFolder,
        fileList: [
          GitRelativePathStub({ value: 'src/brokers/user/user-broker.ts' }),
          GitRelativePathStub({ value: 'src/guards/is-admin/is-admin-guard.test.ts' }),
        ],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 0,
          projectFolder,
          status: 'skip',
          errors: [],
          testFailures: [],
          rawOutput: RawOutputStub({
            stdout: '',
            stderr: 'no matching e2e test files in passthrough',
            exitCode: 0,
          }),
        }),
      );
    });

    it('VALID: {fileList with mixed files} => passes only e2e files to playwright', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      await checkRunE2eBroker({
        projectFolder,
        fileList: [
          GitRelativePathStub({ value: 'src/brokers/user/user-broker.ts' }),
          GitRelativePathStub({ value: 'packages/web/src/flows/app/smoke.e2e.ts' }),
        ],
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        'test',
        '--reporter=line,json',
        'packages/web/src/flows/app/smoke.e2e.ts',
      ]);
    });
  });

  describe('passingTests from json report', () => {
    it('VALID: {playwright writes json report with passing specs} => returns passingTests populated', async () => {
      const projectFolder = ProjectFolderStub();
      const jsonContent = JSON.stringify({
        suites: [
          {
            title: 'packages/web/src/flows/app/smoke.e2e.ts',
            specs: [
              {
                title: 'loads',
                file: 'packages/web/src/flows/app/smoke.e2e.ts',
                tests: [{ results: [{ status: 'passed', duration: 1234 }] }],
              },
            ],
          },
        ],
      });
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPassWithJsonReport({ projectFolder, jsonContent });

      const result = await checkRunE2eBroker({
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
          passingTests: [
            PassingTestStub({
              suitePath: 'packages/web/src/flows/app/smoke.e2e.ts',
              testName: 'packages/web/src/flows/app/smoke.e2e.ts › loads',
              durationMs: 1234,
            }),
          ],
          rawOutput: RawOutputStub({
            stdout: '',
            stderr: '',
            exitCode: 0,
          }),
        }),
      );
    });

    it('VALID: {json report missing} => returns empty passingTests', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      const result = await checkRunE2eBroker({
        projectFolder,
        fileList: [],
      });

      expect(result.passingTests).toStrictEqual([]);
    });
  });

  describe('test name pattern', () => {
    it('VALID: {testNamePattern provided} => adds --grep and --pass-with-no-tests to playwright args', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      await checkRunE2eBroker({
        projectFolder,
        fileList: [],
        testNamePattern: 'login',
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        'test',
        '--reporter=line,json',
        '--grep',
        'login',
        '--pass-with-no-tests',
      ]);
    });

    it('VALID: {testNamePattern matches no spec} => skips the package and records the pattern as unmatched', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      const result = await checkRunE2eBroker({
        projectFolder,
        fileList: [],
        testNamePattern: 'XYZNONEXISTENT',
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'skip',
          testNamePatternMatch: 'unmatched',
          errors: [],
          testFailures: [],
          filesCount: 0,
          discoveredCount: 0,
          rawOutput: RawOutputStub({ stdout: '', stderr: '', exitCode: 0 }),
        }),
      );
    });

    it('VALID: {testNamePattern matches a spec} => returns pass recording the pattern as matched', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPassWithOutput({
        projectFolder,
        stdout: '[1/1] [chromium] › discovered.e2e.ts:3:1 › login works',
      });

      const result = await checkRunE2eBroker({
        projectFolder,
        fileList: [],
        testNamePattern: 'login',
      });

      expect({
        status: result.status,
        testNamePatternMatch: result.testNamePatternMatch,
        filesCount: result.filesCount,
      }).toStrictEqual({
        status: 'pass',
        testNamePatternMatch: 'matched',
        filesCount: 1,
      });
    });
  });
});
