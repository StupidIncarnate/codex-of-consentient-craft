import { WardResultStub } from '@dungeonmaster/ward/dist/src/contracts/ward-result/ward-result.stub';
import { WardFileDetailStub } from '@dungeonmaster/ward/dist/src/contracts/ward-file-detail/ward-file-detail.stub';
import { RunIdStub } from '@dungeonmaster/ward/dist/src/contracts/run-id/run-id.stub';

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

  describe('root fallback', () => {
    it('VALID: {packagePath, not in package .ward but in root .ward} => falls back to root and returns detail', async () => {
      const proxy = wardDetailAdapterProxy();
      const wardResult = WardResultStub();
      const expectedDetail = WardFileDetailStub({
        value: 'src/app.ts\n  lint  no-unused-vars (line 15)\n    message',
      });

      proxy.setupStorageFallbackSequence({ packageResult: null, rootResult: wardResult });
      proxy.setupDetailReturns({ detail: expectedDetail });

      const result = await wardDetailAdapter({
        runId: RunIdStub(),
        filePath: ContentTextStub({ value: 'src/app.ts' }),
        packagePath: 'packages/orchestrator',
      });

      expect(result).toStrictEqual(String(expectedDetail));
    });

    it('VALID: {packagePath, not in package or root .ward} => returns guidance message', async () => {
      const proxy = wardDetailAdapterProxy();
      proxy.setupStorageFallbackSequence({ packageResult: null, rootResult: null });

      const result = await wardDetailAdapter({
        runId: RunIdStub(),
        filePath: ContentTextStub({ value: 'src/app.ts' }),
        packagePath: 'packages/orchestrator',
      });

      expect(String(result)).toMatch(/do not pass packagePath/u);
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

      expect(String(result)).toMatch(/do not pass packagePath/u);
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
