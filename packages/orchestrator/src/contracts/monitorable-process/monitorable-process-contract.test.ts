import { monitorableProcessContract } from './monitorable-process-contract';
import type { MonitorableProcess } from './monitorable-process-contract';
import { MonitorableProcessStub } from './monitorable-process.stub';

describe('monitorableProcessContract', () => {
  describe('valid processes', () => {
    it('VALID: {kill, on} => parses successfully', () => {
      // `.loose()` infers `{[x: string]: unknown}` — `kill`/`on` live outside the schema (see the
      // contract's own header), so this cast asserts what this test itself supplied above.
      const result = monitorableProcessContract.parse({
        kill: () => true,
        on: () => undefined,
      }) as MonitorableProcess;

      expect(result.kill()).toBe(true);
    });

    it('VALID: {stub} => creates monitorable process with kill', () => {
      const process = MonitorableProcessStub();

      expect(process.kill()).toBe(true);
    });

    it('VALID: {stub on exit} => registers exit listener without throwing', () => {
      const process = MonitorableProcessStub();

      process.on('exit', () => undefined);

      expect(process).toStrictEqual({
        kill: expect.any(Function),
        on: expect.any(Function),
      });
    });
  });

  describe('partial inputs', () => {
    it('VALID: {missing kill} => the contract carries no required data of its own', () => {
      const result = monitorableProcessContract.parse({
        on: () => undefined,
      });

      expect(result).toStrictEqual({ on: expect.any(Function) });
    });

    it('VALID: {missing on} => the contract carries no required data of its own', () => {
      const result = monitorableProcessContract.parse({
        kill: () => true,
      });

      expect(result).toStrictEqual({ kill: expect.any(Function) });
    });
  });
});
