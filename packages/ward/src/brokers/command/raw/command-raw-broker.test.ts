
import { WardRunResultStub } from '../../../contracts/ward-result/ward-result.stub';
import { CheckResultStub } from '../../../contracts/check-result/check-result.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { RawOutputStub } from '../../../contracts/raw-output/raw-output.stub';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';

import { commandRawBroker } from './command-raw-broker';
import { commandRawBrokerProxy } from './command-raw-broker.proxy';

describe('commandRawBroker', () => {
  describe('result found with matching check', () => {
    it('VALID: {wardResult, checkType: lint} => writes raw stdout to stdout', async () => {
      const wardResult = WardRunResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                rawOutput: RawOutputStub({ stdout: 'lint output here', stderr: '' }),
              }),
            ],
          }),
        ],
      });

      const proxy = commandRawBrokerProxy();
      proxy.setupWithResult({ content: JSON.stringify(wardResult) });

      const rootPath = '/project';
      const runId = RunIdStub();
      const checkType = 'lint';

      await commandRawBroker({ rootPath, runId, checkType });

      expect(proxy.getStdoutCalls()).toStrictEqual(['lint output here\n']);
    });

    it('VALID: {wardResult with stderr} => writes raw stderr to stdout', async () => {
      const wardResult = WardRunResultStub({
        checks: [
          CheckResultStub({
            checkType: 'typecheck',
            status: 'fail',
            projectResults: [
              ProjectResultStub({
                rawOutput: RawOutputStub({ stdout: '', stderr: 'type error output' }),
              }),
            ],
          }),
        ],
      });

      const proxy = commandRawBrokerProxy();
      proxy.setupWithResult({ content: JSON.stringify(wardResult) });

      const rootPath = '/project';
      const runId = RunIdStub();
      const checkType = 'typecheck';

      await commandRawBroker({ rootPath, runId, checkType });

      expect(proxy.getStdoutCalls()).toStrictEqual(['type error output\n']);
    });
  });

  describe('no matching check', () => {
    it('EMPTY: {wardResult without matching checkType} => writes error to stderr', async () => {
      const wardResult = WardRunResultStub({
        checks: [CheckResultStub({ checkType: 'lint', status: 'pass' })],
      });

      const proxy = commandRawBrokerProxy();
      proxy.setupWithResult({ content: JSON.stringify(wardResult) });

      const rootPath = '/project';
      const runId = RunIdStub();
      const checkType = 'typecheck';

      await commandRawBroker({ rootPath, runId, checkType });

      expect(proxy.getStderrCalls()).toStrictEqual([`No typecheck check found in run ${runId}\n`]);
    });
  });

  describe('no result found', () => {
    it('EMPTY: {missing run id} => writes error message to stderr', async () => {
      const proxy = commandRawBrokerProxy();
      proxy.setupNoResult();

      const rootPath = '/project';
      const runId = RunIdStub();
      const checkType = 'lint';

      await commandRawBroker({ rootPath, runId, checkType });

      expect(proxy.getStderrCalls()).toStrictEqual([`No ward result found for run ${runId}\n`]);
    });
  });
});
