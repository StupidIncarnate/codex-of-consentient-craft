import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardResultStub } from '../../../contracts/ward-result/ward-result.stub';
import { CheckResultStub } from '../../../contracts/check-result/check-result.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';

import { storageSaveBroker } from './storage-save-broker';
import { storageSaveBrokerProxy } from './storage-save-broker.proxy';

const failingWardResult = (): ReturnType<typeof WardResultStub> =>
  WardResultStub({
    checks: [
      CheckResultStub({
        status: 'fail',
        projectResults: [ProjectResultStub({ status: 'fail' })],
      }),
    ],
  });

describe('storageSaveBroker', () => {
  describe('successful save', () => {
    it('VALID: {rootPath, wardResult with failures} => writes JSON file to .ward directory', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const wardResult = failingWardResult();

      const proxy = storageSaveBrokerProxy();
      proxy.setupSuccess({ rootPath, runId: wardResult.runId });

      await expect(storageSaveBroker({ rootPath, wardResult })).resolves.toStrictEqual({
        success: true,
      });
    });
  });

  describe('all checks pass', () => {
    it('VALID: {wardResult with no failures} => still writes file', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const wardResult = WardResultStub();

      const proxy = storageSaveBrokerProxy();
      proxy.setupSuccess({ rootPath, runId: wardResult.runId });

      await expect(storageSaveBroker({ rootPath, wardResult })).resolves.toStrictEqual({
        success: true,
      });
    });
  });

  describe('mkdir failure', () => {
    it('ERROR: {mkdir fails} => throws error', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const wardResult = failingWardResult();

      const proxy = storageSaveBrokerProxy();
      proxy.setupMkdirFail({ rootPath, error: new Error('EACCES: permission denied') });

      await expect(storageSaveBroker({ rootPath, wardResult })).rejects.toThrow(
        /EACCES: permission denied/u,
      );
    });
  });

  describe('write failure', () => {
    it('ERROR: {write fails} => throws error', async () => {
      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const wardResult = failingWardResult();

      const proxy = storageSaveBrokerProxy();
      proxy.setupWriteFail({
        rootPath,
        runId: wardResult.runId,
        error: new Error('ENOSPC: no space left'),
      });

      await expect(storageSaveBroker({ rootPath, wardResult })).rejects.toThrow(
        /ENOSPC: no space left/u,
      );
    });
  });
});
