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
    it('VALID: {playwright exits 0} => returns pass result with no test failures', async () => {
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      const result = await checkRunE2eBroker({
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
            stdout: '{"suites":[],"errors":[]}',
            stderr: '',
            exitCode: 0,
          }),
        }),
      );
    });
  });

  describe('failing tests', () => {
    it('VALID: {playwright exits 1 with failures} => returns fail result with parsed test failures', async () => {
      const proxy = checkRunE2eBrokerProxy();
      const playwrightOutput = JSON.stringify({
        suites: [
          {
            title: 'login.spec.ts',
            suites: [],
            specs: [
              {
                title: 'should display login form',
                file: 'e2e/login.spec.ts',
                tests: [
                  {
                    status: 'unexpected',
                    results: [{ error: { message: 'Element not found' } }],
                  },
                ],
              },
            ],
          },
        ],
      });
      proxy.setupFail({ stdout: playwrightOutput });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunE2eBroker({
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
              suitePath: 'e2e/login.spec.ts',
              testName: 'login.spec.ts > should display login form',
              message: 'Element not found',
            }),
          ],
          filesCount: 1,
          rawOutput: RawOutputStub({ stdout: playwrightOutput, stderr: '', exitCode: 1 }),
        }),
      );
    });
  });

  describe('unparseable output', () => {
    it('VALID: {playwright exits 1 with non-JSON output} => returns fail result with empty test failures', async () => {
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupFailWithBadOutput();

      const projectFolder = ProjectFolderStub();

      const result = await checkRunE2eBroker({
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
    it('VALID: {playwright output with suites} => returns filesCount from top-level suites', async () => {
      const proxy = checkRunE2eBrokerProxy();
      const expectedSuiteCount = 2;
      const playwrightOutput = JSON.stringify({
        suites: [
          { title: 'a.spec.ts', suites: [], specs: [] },
          { title: 'b.spec.ts', suites: [], specs: [] },
        ],
      });
      proxy.setupPassWithOutput({ stdout: playwrightOutput });

      const projectFolder = ProjectFolderStub();

      const result = await checkRunE2eBroker({
        projectFolder,
        fileList: [],
      });

      expect(result.filesCount).toStrictEqual(expectedSuiteCount);
    });
  });

  describe('file list filtering', () => {
    it('VALID: {fileList provided} => appends file paths to playwright args', async () => {
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass();

      const projectFolder = ProjectFolderStub();

      await checkRunE2eBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'e2e/login.spec.ts' })],
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual(['test', '--reporter=json', 'e2e/login.spec.ts']);
    });
  });
});
