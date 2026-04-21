import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardResultStub } from '../../../contracts/ward-result/ward-result.stub';
import { CheckResultStub } from '../../../contracts/check-result/check-result.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { ErrorEntryStub } from '../../../contracts/error-entry/error-entry.stub';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';

import { commandDetailBroker } from './command-detail-broker';
import { commandDetailBrokerProxy } from './command-detail-broker.proxy';

type ErrorFilePath = ReturnType<typeof ErrorEntryStub>['filePath'];

describe('commandDetailBroker', () => {
  describe('result found', () => {
    it('VALID: {wardResult, filePath} => writes file detail to stdout', async () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                status: 'fail',
                errors: [
                  ErrorEntryStub({
                    filePath: 'src/index.ts',
                    line: 10,
                    column: 5,
                    message: 'Unexpected any',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const proxy = commandDetailBrokerProxy();
      proxy.setupWithResult({ content: JSON.stringify(wardResult) });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const runId = RunIdStub();

      await commandDetailBroker({
        rootPath,
        runId,
        filePath: 'src/index.ts' as ErrorFilePath,
      });

      expect(process.stdout.write).toHaveBeenCalledWith(
        'src/index.ts\n  lint (line 10, col 5)\n    Unexpected any\n',
      );
    });
  });

  describe('result found without filePath', () => {
    it('VALID: {wardResult, no filePath} => writes all details to stdout', async () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                status: 'fail',
                errors: [
                  ErrorEntryStub({
                    filePath: 'src/index.ts',
                    line: 10,
                    column: 5,
                    message: 'Unexpected any',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const proxy = commandDetailBrokerProxy();
      proxy.setupWithResult({ content: JSON.stringify(wardResult) });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const runId = RunIdStub();

      await commandDetailBroker({
        rootPath,
        runId,
      });

      expect(process.stdout.write).toHaveBeenCalledWith(
        'src/index.ts\n  lint (line 10, col 5)\n    Unexpected any\n',
      );
    });
  });

  describe('json output', () => {
    it('VALID: {wardResult, json: true} => writes JSON detail to stdout', async () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                status: 'fail',
                errors: [
                  ErrorEntryStub({
                    filePath: 'src/index.ts',
                    line: 10,
                    column: 5,
                    message: 'Unexpected any',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const proxy = commandDetailBrokerProxy();
      proxy.setupWithResult({ content: JSON.stringify(wardResult) });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const runId = RunIdStub();

      await commandDetailBroker({
        rootPath,
        runId,
        json: true,
      });

      const stdoutCalls = proxy.getStdoutCalls();
      const parsed: unknown = JSON.parse(stdoutCalls[0] as never);

      expect(parsed).toStrictEqual({
        runId: '1739625600000-a3f1',
        timestamp: 1739625600000,
        checks: [
          {
            checkType: 'lint',
            status: 'fail',
            projectResults: [
              {
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'fail',
                errors: [
                  {
                    filePath: 'src/index.ts',
                    line: 10,
                    column: 5,
                    message: 'Unexpected any',
                    severity: 'error',
                  },
                ],
                testFailures: [],
                passingTests: [],
                filesCount: 0,
                discoveredCount: 0,
              },
            ],
          },
        ],
      });
    });

    it('VALID: {wardResult, json: true, filePath} => ignores filePath and writes full JSON to stdout', async () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                status: 'pass',
              }),
            ],
          }),
        ],
      });

      const proxy = commandDetailBrokerProxy();
      proxy.setupWithResult({ content: JSON.stringify(wardResult) });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const runId = RunIdStub();

      await commandDetailBroker({
        rootPath,
        runId,
        filePath: 'src/index.ts' as ErrorFilePath,
        json: true,
      });

      const stdoutCalls = proxy.getStdoutCalls();
      const parsed: unknown = JSON.parse(stdoutCalls[0] as never);

      expect(parsed).toStrictEqual({
        runId: '1739625600000-a3f1',
        timestamp: 1739625600000,
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              {
                projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
                status: 'pass',
                errors: [],
                testFailures: [],
                passingTests: [],
                filesCount: 0,
                discoveredCount: 0,
              },
            ],
          },
        ],
      });
    });
  });

  describe('no result found', () => {
    it('EMPTY: {missing run id} => writes error message to stderr', async () => {
      const proxy = commandDetailBrokerProxy();
      proxy.setupNoResult();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const runId = RunIdStub();

      await commandDetailBroker({
        rootPath,
        runId,
        filePath: 'src/index.ts' as ErrorFilePath,
      });

      expect(proxy.getStderrCalls()).toStrictEqual([`No ward result found for run ${runId}\n`]);
      expect(proxy.getStdoutCalls()).toStrictEqual([]);
    });
  });
});
