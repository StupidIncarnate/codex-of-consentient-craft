import { WardResultStub } from '@dungeonmaster/ward/dist/src/contracts/ward-result/ward-result.stub';
import { WardErrorListStub } from '@dungeonmaster/ward/dist/src/contracts/ward-error-list/ward-error-list.stub';
import { RunIdStub } from '@dungeonmaster/ward/dist/src/contracts/run-id/run-id.stub';

import { wardListAdapter } from './ward-list-adapter';
import { wardListAdapterProxy } from './ward-list-adapter.proxy';

describe('wardListAdapter', () => {
  describe('successful list', () => {
    it('VALID: {no runId, result exists} => returns formatted list', async () => {
      const proxy = wardListAdapterProxy();
      const wardResult = WardResultStub();
      const expectedList = WardErrorListStub({
        value: 'src/app.ts\n  lint  no-unused-vars (line 15)',
      });

      proxy.setupStorageReturns({ wardResult });
      proxy.setupListReturns({ list: expectedList });

      const result = await wardListAdapter({});

      expect(result).toBe(String(expectedList));
    });

    it('VALID: {runId provided, result exists} => returns formatted list', async () => {
      const proxy = wardListAdapterProxy();
      const wardResult = WardResultStub();
      const expectedList = WardErrorListStub({
        value: 'src/app.ts\n  lint  error',
      });

      proxy.setupStorageReturns({ wardResult });
      proxy.setupListReturns({ list: expectedList });

      const result = await wardListAdapter({
        runId: RunIdStub(),
      });

      expect(result).toBe(String(expectedList));
    });

    it('VALID: {packagePath provided, result exists} => returns formatted list', async () => {
      const proxy = wardListAdapterProxy();
      const wardResult = WardResultStub();
      const expectedList = WardErrorListStub({
        value: 'src/app.ts\n  lint  error',
      });

      proxy.setupStorageReturns({ wardResult });
      proxy.setupListReturns({ list: expectedList });

      const result = await wardListAdapter({
        packagePath: 'packages/mcp',
      });

      expect(result).toBe(String(expectedList));
    });

    it('VALID: {result exists, no errors} => returns no errors message', async () => {
      const proxy = wardListAdapterProxy();
      const wardResult = WardResultStub();

      proxy.setupStorageReturns({ wardResult });
      proxy.setupListReturns({ list: WardErrorListStub({ value: '' }) });

      const result = await wardListAdapter({});

      expect(result).toBe('No errors found');
    });
  });

  describe('root fallback', () => {
    it('VALID: {packagePath, not in package .ward but in root .ward} => falls back to root and returns list', async () => {
      const proxy = wardListAdapterProxy();
      const wardResult = WardResultStub();
      const expectedList = WardErrorListStub({
        value: 'src/app.ts\n  lint  error',
      });

      proxy.setupStorageFallbackSequence({ packageResult: null, rootResult: wardResult });
      proxy.setupListReturns({ list: expectedList });

      const result = await wardListAdapter({
        runId: RunIdStub(),
        packagePath: 'packages/orchestrator',
      });

      expect(result).toStrictEqual(String(expectedList));
    });

    it('VALID: {packagePath, not in package or root .ward} => returns guidance message', async () => {
      const proxy = wardListAdapterProxy();
      proxy.setupStorageFallbackSequence({ packageResult: null, rootResult: null });

      const result = await wardListAdapter({
        runId: RunIdStub(),
        packagePath: 'packages/orchestrator',
      });

      expect(String(result)).toMatch(/do not pass packagePath/u);
    });

    it('VALID: {no packagePath} => does not attempt fallback', async () => {
      const proxy = wardListAdapterProxy();
      proxy.setupStorageReturns({ wardResult: null });

      const result = await wardListAdapter({
        runId: RunIdStub(),
      });

      expect(String(result)).toMatch(/do not pass packagePath/u);
    });
  });

  describe('no results found', () => {
    it('VALID: {no runId, no result} => returns not found message', async () => {
      const proxy = wardListAdapterProxy();
      proxy.setupStorageReturns({ wardResult: null });

      const result = await wardListAdapter({});

      expect(result).toBe('No ward results found');
    });
  });

  describe('error cases', () => {
    it('ERROR: {storage throws} => throws error', async () => {
      const proxy = wardListAdapterProxy();
      proxy.setupStorageThrows({ error: new Error('Storage read failed') });

      await expect(wardListAdapter({})).rejects.toThrow(/Storage read failed/u);
    });
  });
});
