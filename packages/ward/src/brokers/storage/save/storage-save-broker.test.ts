import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { WardResultStub } from '../../../contracts/ward-result/ward-result.stub';

import { storageSaveBroker } from './storage-save-broker';
import { storageSaveBrokerProxy } from './storage-save-broker.proxy';

describe('storageSaveBroker', () => {
  describe('successful save', () => {
    it('VALID: {rootPath, wardResult} => writes JSON file to .ward directory', async () => {
      const proxy = storageSaveBrokerProxy();
      proxy.setupSuccess();

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const wardResult = WardResultStub();

      await expect(storageSaveBroker({ rootPath, wardResult })).resolves.toBeUndefined();
    });
  });

  describe('mkdir failure', () => {
    it('ERROR: {mkdir fails} => throws error', async () => {
      const proxy = storageSaveBrokerProxy();
      proxy.setupMkdirFail({ error: new Error('EACCES: permission denied') });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const wardResult = WardResultStub();

      await expect(storageSaveBroker({ rootPath, wardResult })).rejects.toThrow(
        /EACCES: permission denied/u,
      );
    });
  });

  describe('write failure', () => {
    it('ERROR: {write fails} => throws error', async () => {
      const proxy = storageSaveBrokerProxy();
      proxy.setupWriteFail({ error: new Error('ENOSPC: no space left') });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const wardResult = WardResultStub();

      await expect(storageSaveBroker({ rootPath, wardResult })).rejects.toThrow(
        /ENOSPC: no space left/u,
      );
    });
  });
});
