import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { StepFilePathStub } from '../../../contracts/step-file-path/step-file-path.stub';
import type { StepFileNotFoundError } from '../../../errors/step-file-not-found/step-file-not-found-error';
import { stepFileBroker } from './step-file-broker';
import { stepFileBrokerProxy } from './step-file-broker.proxy';

describe('stepFileBroker', () => {
  describe('a file that exists in lane home', () => {
    it('VALID: {existing file in homePath} => reads file contents and returns ContentText', async () => {
      const proxy = stepFileBrokerProxy();
      const lane = LaneSessionStub({
        homePath: '/tmp/test-lane-home',
        browser: null,
      });
      const path = StepFilePathStub({ value: 'usage-ledger.json' });
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test-lane-home/usage-ledger.json' });

      proxy.setupFileExists({
        filePath,
        content: '{"units": 100}',
      });

      const result = await stepFileBroker({ lane, path });

      expect(result).toBe('{"units": 100}');
    });
  });

  describe('a file that exists in evidence directory', () => {
    it('VALID: {existing file in evidencePath} => reads file contents and returns ContentText', async () => {
      const proxy = stepFileBrokerProxy();
      const lane = LaneSessionStub({
        homePath: '/tmp/test-lane-home',
        evidencePath: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1',
        browser: null,
      });
      const path = StepFilePathStub({ value: 'api-server.log' });
      const homeFilePath = AbsoluteFilePathStub({ value: '/tmp/test-lane-home/api-server.log' });
      const evidenceFilePath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/api-server.log',
      });

      proxy.setupFileNotFound({ filePath: homeFilePath });
      proxy.setupFileExists({
        filePath: evidenceFilePath,
        content: 'server started on port 3000\nready for requests',
      });

      const result = await stepFileBroker({ lane, path });

      expect(result).toBe('server started on port 3000\nready for requests');
    });
  });

  describe('a file that is absent', () => {
    it('ERROR: {absent file} => throws StepFileNotFoundError', async () => {
      const proxy = stepFileBrokerProxy();
      const lane = LaneSessionStub({
        homePath: '/tmp/test-lane-home',
        evidencePath: '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1',
        browser: null,
      });
      const path = StepFilePathStub({ value: 'missing.log' });
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test-lane-home/missing.log' });
      const evidenceFilePath = AbsoluteFilePathStub({
        value:
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_1/missing.log',
      });

      proxy.setupFileNotFound({ filePath, evidenceFilePath });

      const error = await stepFileBroker({ lane, path }).then(
        (): never => {
          throw new Error('Expected stepFileBroker to reject');
        },
        (caught: unknown): StepFileNotFoundError => caught as StepFileNotFoundError,
      );

      expect({
        name: error.name,
        message: error.message,
        path: error.path,
        homePath: error.homePath,
      }).toStrictEqual({
        name: 'StepFileNotFoundError',
        message: 'file "missing.log" does not exist in lane home "/tmp/test-lane-home"',
        path: 'missing.log',
        homePath: '/tmp/test-lane-home',
      });
    });
  });
});
