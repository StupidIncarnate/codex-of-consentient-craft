import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { RawOutputStub } from '../../../contracts/raw-output/raw-output.stub';
import { TestFailureStub } from '../../../contracts/test-failure/test-failure.stub';

import { checkRunE2eBroker } from './check-run-e2e-broker';
import { checkRunE2eBrokerProxy } from './check-run-e2e-broker.proxy';

describe('checkRunE2eBroker', () => {
  describe('passing e2e', () => {
    it('VALID: {playwright exits 0} => returns pass result with no test failures', async () => {
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass();

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      const result = await checkRunE2eBroker({ rootPath });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder: ProjectFolderStub({ name: 'root', path: '/home/user/project' }),
          status: 'pass',
          errors: [],
          testFailures: [],
          rawOutput: RawOutputStub({ stdout: '{"suites":[]}', stderr: '', exitCode: 0 }),
        }),
      );
    });
  });

  describe('failing e2e', () => {
    it('VALID: {playwright exits 1 with failures} => returns fail result with parsed test failures', async () => {
      const proxy = checkRunE2eBrokerProxy();
      const playwrightOutput = JSON.stringify({
        suites: [
          {
            title: 'login.spec.ts',
            specs: [
              {
                title: 'should login',
                tests: [
                  {
                    status: 'unexpected',
                    results: [{ status: 'failed', error: { message: 'Login failed' } }],
                  },
                ],
              },
            ],
            suites: [],
          },
        ],
      });
      proxy.setupFail({ stdout: playwrightOutput });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      const result = await checkRunE2eBroker({ rootPath });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder: ProjectFolderStub({ name: 'root', path: '/home/user/project' }),
          status: 'fail',
          errors: [],
          testFailures: [
            TestFailureStub({
              suitePath: 'login.spec.ts',
              testName: 'should login',
              message: 'Login failed',
            }),
          ],
          rawOutput: RawOutputStub({ stdout: playwrightOutput, stderr: '', exitCode: 1 }),
        }),
      );
    });
  });
});
