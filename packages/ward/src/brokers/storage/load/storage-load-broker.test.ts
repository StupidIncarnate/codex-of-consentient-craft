import {
  AbsoluteFilePathStub,
  FileContentsStub,
  FilePathStub,
} from '@dungeonmaster/shared/contracts';

import { WardResultStub } from '../../../contracts/ward-result/ward-result.stub';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';

import { storageLoadBroker } from './storage-load-broker';
import { storageLoadBrokerProxy } from './storage-load-broker.proxy';

describe('storageLoadBroker', () => {
  describe('load by runId', () => {
    it('VALID: {runId provided, file exists} => returns parsed WardResult', async () => {
      const wardResult = WardResultStub();
      const proxy = storageLoadBrokerProxy();
      proxy.setupRunById({ content: JSON.stringify(wardResult) });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const runId = RunIdStub();

      const result = await storageLoadBroker({ rootPath, runId });

      expect(result).toStrictEqual(wardResult);
    });

    it('ERROR: {runId provided, file not found} => returns null', async () => {
      const proxy = storageLoadBrokerProxy();
      proxy.setupReadFail({ error: new Error('ENOENT: no such file') });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });
      const runId = RunIdStub();

      const result = await storageLoadBroker({ rootPath, runId });

      expect(result).toBe(null);
    });
  });

  describe('load most recent', () => {
    it('VALID: {no runId, files exist} => returns most recent WardResult', async () => {
      const wardResult = WardResultStub({ runId: '1739625700000-b4e2' });
      const proxy = storageLoadBrokerProxy();
      proxy.setupLatestRun({
        entries: ['run-1739625600000-a3f1.json', 'run-1739625700000-b4e2.json'],
        content: JSON.stringify(wardResult),
      });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      const result = await storageLoadBroker({ rootPath });

      expect(result).toStrictEqual(wardResult);
    });

    it('VALID: {no runId, run files with non-RunId names} => returns the latest RunId-named run', async () => {
      const wardResult = WardResultStub({ runId: '1739625700000-b4e2' });
      const proxy = storageLoadBrokerProxy();
      proxy.setupLatestRunByPath({
        entries: [
          'run-1739625600000-a3f1.json',
          'run-1739625700000-b4e2.json',
          'run-e2e-dispatch-ward-5.json',
        ],
        contents: {
          [FilePathStub({ value: '/home/user/project/.ward/run-1739625700000-b4e2.json' })]:
            FileContentsStub({ value: JSON.stringify(wardResult) }),
          [FilePathStub({ value: '/home/user/project/.ward/run-e2e-dispatch-ward-5.json' })]:
            FileContentsStub({ value: JSON.stringify({ checks: [] }) }),
        },
      });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      const result = await storageLoadBroker({ rootPath });

      expect(result).toStrictEqual(wardResult);
    });

    it('EMPTY: {no runId, only non-RunId-named run files} => returns null', async () => {
      const proxy = storageLoadBrokerProxy();
      proxy.setupLatestRunByPath({
        entries: ['run-e2e-dispatch-ward-5.json'],
        contents: {
          [FilePathStub({ value: '/home/user/project/.ward/run-e2e-dispatch-ward-5.json' })]:
            FileContentsStub({ value: JSON.stringify(WardResultStub()) }),
        },
      });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      const result = await storageLoadBroker({ rootPath });

      expect(result).toBe(null);
    });

    it('EMPTY: {no runId, no files} => returns null', async () => {
      const proxy = storageLoadBrokerProxy();
      proxy.setupEmptyDir();

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      const result = await storageLoadBroker({ rootPath });

      expect(result).toBe(null);
    });

    it('ERROR: {no runId, readdir fails} => returns null', async () => {
      const proxy = storageLoadBrokerProxy();
      proxy.setupReaddirFail({ error: new Error('ENOENT: no such directory') });

      const rootPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      const result = await storageLoadBroker({ rootPath });

      expect(result).toBe(null);
    });
  });
});
