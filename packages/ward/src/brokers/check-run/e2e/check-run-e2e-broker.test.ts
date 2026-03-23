import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { RawOutputStub } from '../../../contracts/raw-output/raw-output.stub';
import { TestFailureStub } from '../../../contracts/test-failure/test-failure.stub';
import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';

import { checkRunE2eBroker } from './check-run-e2e-broker';
import { checkRunE2eBrokerProxy } from './check-run-e2e-broker.proxy';

describe('checkRunE2eBroker', () => {
  describe('skip', () => {
    it('VALID: {no playwright.config.ts} => returns skip result', async () => {
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupNoPlaywrightConfig();

      const projectFolder = ProjectFolderStub();

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
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      const result = await checkRunE2eBroker({
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
            stdout: '',
            stderr: '',
            exitCode: 0,
          }),
        }),
      );
    });

    it('VALID: {playwright exits 0 with line output} => returns pass result with filesCount from line output', async () => {
      const proxy = checkRunE2eBrokerProxy();
      const lineOutput = [
        '[1/2] [chromium] › e2e/web/smoke.spec.ts:20:7 › Smoke › loads page',
        '[2/2] [chromium] › e2e/web/chat.spec.ts:10:7 › Chat › sends message',
      ].join('\n');
      proxy.setupPassWithOutput({ stdout: lineOutput });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunE2eBroker({
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
          filesCount: 2,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['e2e/web/smoke.spec.ts', 'e2e/web/chat.spec.ts'],
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
      const proxy = checkRunE2eBrokerProxy();
      const failOutput = [
        '[1/1] [chromium] › e2e/login.spec.ts:10:7 › Login › should display login form',
        '  1) [chromium] › e2e/login.spec.ts:10:7 › Login › should display login form ',
        '',
        '    Element not found',
        '',
      ].join('\n');
      proxy.setupFail({ stdout: failOutput });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunE2eBroker({
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
              suitePath: 'e2e/login.spec.ts',
              testName: 'Login › should display login form',
              message: 'Element not found',
            }),
          ],
          filesCount: 1,
          onlyProcessed: ['e2e/login.spec.ts'],
          onlyDiscovered: ['discovered.ts'],
          rawOutput: RawOutputStub({ stdout: failOutput, stderr: '', exitCode: 1 }),
        }),
      );
    });
  });

  describe('fail with empty output', () => {
    it('VALID: {playwright exits 1 with empty output} => returns fail result with no test failures', async () => {
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupFailWithEmptyOutput();

      const projectFolder = ProjectFolderStub();

      const result = await checkRunE2eBroker({
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
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      await checkRunE2eBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'e2e/login.spec.ts' })],
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual(['test', '--reporter=line', 'e2e/login.spec.ts']);
    });

    it('VALID: {fileList with no e2e files} => returns skip result', async () => {
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      const result = await checkRunE2eBroker({
        projectFolder,
        fileList: [
          GitRelativePathStub({ value: 'src/brokers/user/user-broker.ts' }),
          GitRelativePathStub({ value: 'src/guards/is-admin/is-admin-guard.test.ts' }),
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
            stderr: 'no matching e2e test files in passthrough',
            exitCode: 0,
          }),
        }),
      );
    });

    it('VALID: {fileList with mixed files} => passes only e2e files to playwright', async () => {
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      await checkRunE2eBroker({
        projectFolder,
        fileList: [
          GitRelativePathStub({ value: 'src/brokers/user/user-broker.ts' }),
          GitRelativePathStub({ value: 'e2e/web/smoke.spec.ts' }),
        ],
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual(['test', '--reporter=line', 'e2e/web/smoke.spec.ts']);
    });
  });

  describe('test name pattern', () => {
    it('VALID: {testNamePattern provided} => adds --grep flag to playwright args', async () => {
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      await checkRunE2eBroker({
        projectFolder,
        fileList: [],
        testNamePattern: 'login',
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual(['test', '--reporter=line', '--grep', 'login']);
    });
  });
});
