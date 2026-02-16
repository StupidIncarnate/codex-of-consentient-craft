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
        expect.stringMatching(/^src\/index\.ts\n {2}lint/u),
      );
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

      expect(process.stderr.write).toHaveBeenCalledWith(
        expect.stringMatching(/^No ward result found for run/u),
      );
      expect(process.stdout.write).not.toHaveBeenCalled();
    });
  });
});
