import { WardResultStub } from '@dungeonmaster/ward/dist/src/contracts/ward-result/ward-result.stub';
import { CheckResultStub } from '@dungeonmaster/ward/dist/src/contracts/check-result/check-result.stub';
import { ProjectResultStub } from '@dungeonmaster/ward/dist/src/contracts/project-result/project-result.stub';
import { RunIdStub } from '@dungeonmaster/ward/dist/src/contracts/run-id/run-id.stub';
import { CheckTypeStub } from '@dungeonmaster/ward/dist/src/contracts/check-type/check-type.stub';

import { wardRawAdapter } from './ward-raw-adapter';
import { wardRawAdapterProxy } from './ward-raw-adapter.proxy';

describe('wardRawAdapter', () => {
  describe('successful raw output', () => {
    it('VALID: {runId, checkType with stdout} => returns raw stdout', async () => {
      const proxy = wardRawAdapterProxy();
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: CheckTypeStub({ value: 'lint' }),
            projectResults: [
              ProjectResultStub({
                rawOutput: { stdout: 'lint output here', stderr: '', exitCode: 0 },
              }),
            ],
          }),
        ],
      });

      proxy.setupStorageReturns({ wardResult });

      const result = await wardRawAdapter({
        runId: RunIdStub(),
        checkType: CheckTypeStub({ value: 'lint' }),
      });

      expect(result).toBe('lint output here');
    });

    it('VALID: {runId, checkType with stderr} => returns raw stderr', async () => {
      const proxy = wardRawAdapterProxy();
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: CheckTypeStub({ value: 'typecheck' }),
            projectResults: [
              ProjectResultStub({
                rawOutput: { stdout: '', stderr: 'type errors here', exitCode: 1 },
              }),
            ],
          }),
        ],
      });

      proxy.setupStorageReturns({ wardResult });

      const result = await wardRawAdapter({
        runId: RunIdStub(),
        checkType: CheckTypeStub({ value: 'typecheck' }),
      });

      expect(result).toBe('type errors here');
    });

    it('VALID: {runId, checkType, packagePath} => returns raw stdout with packagePath', async () => {
      const proxy = wardRawAdapterProxy();
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: CheckTypeStub({ value: 'lint' }),
            projectResults: [
              ProjectResultStub({
                rawOutput: { stdout: 'lint output here', stderr: '', exitCode: 0 },
              }),
            ],
          }),
        ],
      });

      proxy.setupStorageReturns({ wardResult });

      const result = await wardRawAdapter({
        runId: RunIdStub(),
        checkType: CheckTypeStub({ value: 'lint' }),
        packagePath: 'packages/mcp',
      });

      expect(result).toBe('lint output here');
    });

    it('VALID: {runId, checkType with no output} => returns no output message', async () => {
      const proxy = wardRawAdapterProxy();
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: CheckTypeStub({ value: 'lint' }),
            projectResults: [
              ProjectResultStub({
                rawOutput: { stdout: '', stderr: '', exitCode: 0 },
              }),
            ],
          }),
        ],
      });

      proxy.setupStorageReturns({ wardResult });

      const result = await wardRawAdapter({
        runId: RunIdStub(),
        checkType: CheckTypeStub({ value: 'lint' }),
      });

      expect(result).toBe('No raw output available');
    });
  });

  describe('root fallback', () => {
    it('VALID: {packagePath, not in package .ward but in root .ward} => falls back to root and returns raw output', async () => {
      const proxy = wardRawAdapterProxy();
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: CheckTypeStub({ value: 'lint' }),
            projectResults: [
              ProjectResultStub({
                rawOutput: { stdout: 'lint output here', stderr: '', exitCode: 0 },
              }),
            ],
          }),
        ],
      });

      proxy.setupStorageFallbackSequence({ packageResult: null, rootResult: wardResult });

      const result = await wardRawAdapter({
        runId: RunIdStub(),
        checkType: CheckTypeStub({ value: 'lint' }),
        packagePath: 'packages/orchestrator',
      });

      expect(result).toBe('lint output here');
    });

    it('VALID: {packagePath, not in package or root .ward} => returns guidance message', async () => {
      const proxy = wardRawAdapterProxy();
      proxy.setupStorageFallbackSequence({ packageResult: null, rootResult: null });

      const result = await wardRawAdapter({
        runId: RunIdStub(),
        checkType: CheckTypeStub({ value: 'lint' }),
        packagePath: 'packages/orchestrator',
      });

      expect(String(result)).toMatch(/do not pass packagePath/u);
    });
  });

  describe('no results found', () => {
    it('VALID: {no ward result with runId} => returns run-specific not found message', async () => {
      const proxy = wardRawAdapterProxy();
      proxy.setupStorageReturns({ wardResult: null });

      const result = await wardRawAdapter({
        runId: RunIdStub(),
        checkType: CheckTypeStub({ value: 'lint' }),
      });

      expect(String(result)).toMatch(/do not pass packagePath/u);
    });

    it('VALID: {no ward result without runId} => returns generic not found message', async () => {
      const proxy = wardRawAdapterProxy();
      proxy.setupStorageReturns({ wardResult: null });

      const result = await wardRawAdapter({
        checkType: CheckTypeStub({ value: 'lint' }),
      });

      expect(result).toBe('No ward results found');
    });

    it('VALID: {no matching check type} => returns check not found message', async () => {
      const proxy = wardRawAdapterProxy();
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: CheckTypeStub({ value: 'lint' }),
          }),
        ],
      });

      proxy.setupStorageReturns({ wardResult });

      const result = await wardRawAdapter({
        runId: RunIdStub(),
        checkType: CheckTypeStub({ value: 'typecheck' }),
      });

      expect(result).toBe('No typecheck check found in run 1739625600000-a3f1');
    });
  });

  describe('error cases', () => {
    it('ERROR: {storage throws} => throws error', async () => {
      const proxy = wardRawAdapterProxy();
      proxy.setupStorageThrows({ error: new Error('Storage read failed') });

      await expect(
        wardRawAdapter({
          runId: RunIdStub(),
          checkType: CheckTypeStub({ value: 'lint' }),
        }),
      ).rejects.toThrow(/Storage read failed/u);
    });
  });
});
