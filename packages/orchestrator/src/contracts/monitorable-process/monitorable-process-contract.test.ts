import { monitorableProcessContract } from './monitorable-process-contract';
import { MonitorableProcessStub } from './monitorable-process.stub';

describe('monitorableProcessContract', () => {
  describe('valid processes', () => {
    it('VALID: {kill, on} => parses successfully', () => {
      const result = monitorableProcessContract.parse({
        kill: () => true,
        on: () => undefined,
      });

      expect(result.kill()).toBe(true);
    });

    it('VALID: {stub} => creates monitorable process with kill', () => {
      const process = MonitorableProcessStub();

      expect(process.kill()).toBe(true);
    });

    it('VALID: {stub on exit} => registers exit listener without throwing', () => {
      const process = MonitorableProcessStub();

      expect(() => {
        process.on('exit', () => undefined);
      }).not.toThrow();
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing kill} => throws error', () => {
      expect(() =>
        monitorableProcessContract.parse({
          on: () => undefined,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing on} => throws error', () => {
      expect(() =>
        monitorableProcessContract.parse({
          kill: () => true,
        }),
      ).toThrow(/Required/u);
    });
  });
});
