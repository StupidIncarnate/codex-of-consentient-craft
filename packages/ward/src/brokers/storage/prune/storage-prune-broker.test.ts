import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { storagePruneBroker } from './storage-prune-broker';
import { storagePruneBrokerProxy } from './storage-prune-broker.proxy';

describe('storagePruneBroker', () => {
  describe('expired files', () => {
    it('VALID: {run files older than TTL} => deletes expired files', async () => {
      const now = 1739629200000;
      const expiredTimestamp = now - 3700000;

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({
        entries: [`run-${expiredTimestamp}-a3f1.json`],
        now,
      });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      await expect(storagePruneBroker({ rootPath })).resolves.toBeUndefined();
    });
  });

  describe('fresh files', () => {
    it('VALID: {run files within TTL} => keeps fresh files', async () => {
      const now = 1739629200000;
      const freshTimestamp = now - 1000;

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({
        entries: [`run-${freshTimestamp}-b4e2.json`],
        now,
      });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      await expect(storagePruneBroker({ rootPath })).resolves.toBeUndefined();
    });
  });

  describe('empty directory', () => {
    it('EMPTY: {no run files} => completes without error', async () => {
      const proxy = storagePruneBrokerProxy();
      proxy.setupEmpty();

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      await expect(storagePruneBroker({ rootPath })).resolves.toBeUndefined();
    });
  });

  describe('non-run files', () => {
    it('VALID: {non-run files in directory} => ignores non-run files', async () => {
      const now = 1739629200000;

      const proxy = storagePruneBrokerProxy();
      proxy.setupWithFiles({
        entries: ['config.json', 'readme.md'],
        now,
      });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      await expect(storagePruneBroker({ rootPath })).resolves.toBeUndefined();
    });
  });

  describe('missing directory', () => {
    it('ERROR: {.ward directory does not exist} => silently ignores error', async () => {
      const proxy = storagePruneBrokerProxy();
      proxy.setupReaddirFail({ error: new Error('ENOENT: no such file or directory') });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      await expect(storagePruneBroker({ rootPath })).resolves.toBeUndefined();
    });
  });
});
