import { WardResultStub } from '@dungeonmaster/ward/dist/contracts/ward-result/ward-result.stub';
import { WardFileDetailStub } from '@dungeonmaster/ward/dist/contracts/ward-file-detail/ward-file-detail.stub';
import { RunIdStub } from '@dungeonmaster/ward/dist/contracts/run-id/run-id.stub';

import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

import { wardDetailAdapter } from './ward-detail-adapter';
import { wardDetailAdapterProxy } from './ward-detail-adapter.proxy';

describe('wardDetailAdapter', () => {
  describe('successful detail', () => {
    it('VALID: {runId, filePath} => returns detailed errors', async () => {
      const proxy = wardDetailAdapterProxy();
      const wardResult = WardResultStub();
      const expectedDetail = WardFileDetailStub({
        value: 'src/app.ts\n  lint  no-unused-vars (line 15)\n    message',
      });

      proxy.setupStorageReturns({ wardResult });
      proxy.setupDetailReturns({ detail: expectedDetail });

      const result = await wardDetailAdapter({
        runId: RunIdStub(),
        filePath: ContentTextStub({ value: 'src/app.ts' }),
      });

      expect(result).toBe(String(expectedDetail));
    });

    it('VALID: {runId, filePath, packagePath} => returns detailed errors with packagePath', async () => {
      const proxy = wardDetailAdapterProxy();
      const wardResult = WardResultStub();
      const expectedDetail = WardFileDetailStub({
        value: 'src/app.ts\n  lint  no-unused-vars (line 15)\n    message',
      });

      proxy.setupStorageReturns({ wardResult });
      proxy.setupDetailReturns({ detail: expectedDetail });

      const result = await wardDetailAdapter({
        runId: RunIdStub(),
        filePath: ContentTextStub({ value: 'src/app.ts' }),
        packagePath: 'packages/mcp',
      });

      expect(result).toBe(String(expectedDetail));
    });

    it('VALID: {runId, filePath, verbose} => returns verbose detail', async () => {
      const proxy = wardDetailAdapterProxy();
      const wardResult = WardResultStub();
      const expectedDetail = WardFileDetailStub({
        value: 'src/app.ts\n  FAIL "test"\n    full stack trace',
      });

      proxy.setupStorageReturns({ wardResult });
      proxy.setupDetailReturns({ detail: expectedDetail });

      const result = await wardDetailAdapter({
        runId: RunIdStub(),
        filePath: ContentTextStub({ value: 'src/app.ts' }),
        verbose: true,
      });

      expect(result).toBe(String(expectedDetail));
    });
  });

  describe('no results found', () => {
    it('VALID: {runId, no result} => returns run-specific not found message', async () => {
      const proxy = wardDetailAdapterProxy();
      proxy.setupStorageReturns({ wardResult: null });

      const result = await wardDetailAdapter({
        runId: RunIdStub(),
        filePath: ContentTextStub({ value: 'src/app.ts' }),
      });

      expect(result).toBe('No ward result found for run 1739625600000-a3f1');
    });

    it('VALID: {no runId, no result} => returns generic not found message', async () => {
      const proxy = wardDetailAdapterProxy();
      proxy.setupStorageReturns({ wardResult: null });

      const result = await wardDetailAdapter({
        filePath: ContentTextStub({ value: 'src/app.ts' }),
      });

      expect(result).toBe('No ward results found');
    });
  });

  describe('error cases', () => {
    it('ERROR: {storage throws} => throws error', async () => {
      const proxy = wardDetailAdapterProxy();
      proxy.setupStorageThrows({ error: new Error('Storage read failed') });

      await expect(
        wardDetailAdapter({
          runId: RunIdStub(),
          filePath: ContentTextStub({ value: 'src/app.ts' }),
        }),
      ).rejects.toThrow(/Storage read failed/u);
    });
  });
});
