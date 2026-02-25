import { WardResultStub } from '@dungeonmaster/ward/dist/contracts/ward-result/ward-result.stub';
import { WardErrorListStub } from '@dungeonmaster/ward/dist/contracts/ward-error-list/ward-error-list.stub';
import { RunIdStub } from '@dungeonmaster/ward/dist/contracts/run-id/run-id.stub';

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

  describe('no results found', () => {
    it('VALID: {no runId, no result} => returns not found message', async () => {
      const proxy = wardListAdapterProxy();
      proxy.setupStorageReturns({ wardResult: null });

      const result = await wardListAdapter({});

      expect(result).toBe('No ward results found');
    });

    it('VALID: {runId provided, no result} => returns run-specific not found message', async () => {
      const proxy = wardListAdapterProxy();
      proxy.setupStorageReturns({ wardResult: null });

      const result = await wardListAdapter({
        runId: RunIdStub(),
      });

      expect(result).toBe('No ward result found for run 1739625600000-a3f1');
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
