import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardResultStub } from '../../../contracts/ward-result/ward-result.stub';
import { CheckResultStub } from '../../../contracts/check-result/check-result.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { ErrorEntryStub } from '../../../contracts/error-entry/error-entry.stub';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';

import { commandListBroker } from './command-list-broker';
import { commandListBrokerProxy } from './command-list-broker.proxy';

describe('commandListBroker', () => {
  describe('result found', () => {
    it('VALID: {wardResult with errors} => writes error list to stdout', async () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                status: 'fail',
                errors: [
                  ErrorEntryStub({ filePath: 'src/index.ts', line: 10, message: 'Unexpected any' }),
                ],
              }),
            ],
          }),
        ],
      });

      const proxy = commandListBrokerProxy();
      proxy.setupWithResult({ content: JSON.stringify(wardResult) });

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const runId = RunIdStub();

      await commandListBroker({ rootPath, runId });

      expect({
        stderrCalls: proxy.getStderrCalls(),
        stdoutCallCount: proxy.getStdoutCalls().length,
      }).toStrictEqual({
        stderrCalls: [],
        stdoutCallCount: 1,
      });
    });
  });

  describe('no result found', () => {
    it('EMPTY: {no ward results} => writes error message to stderr', async () => {
      const proxy = commandListBrokerProxy();
      proxy.setupNoResult();

      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const runId = RunIdStub();

      await commandListBroker({ rootPath, runId });

      expect({
        stderrCalls: proxy.getStderrCalls(),
        stdoutCalls: proxy.getStdoutCalls(),
      }).toStrictEqual({
        stderrCalls: [['No ward results found\n']],
        stdoutCalls: [],
      });
    });
  });
});
