import { smoketestTeardownCheckContract } from './smoketest-teardown-check-contract';
import {
  PortFreeTeardownCheckStub,
  ProcessGoneTeardownCheckStub,
} from './smoketest-teardown-check.stub';

describe('smoketestTeardownCheckContract', () => {
  describe('valid checks', () => {
    it('VALID: {kind: "port-free", port: 4751} => parses to port-free check', () => {
      const result = PortFreeTeardownCheckStub();

      expect(result).toStrictEqual({
        kind: 'port-free',
        port: 4751,
      });
    });

    it('VALID: {kind: "port-free", port: 8080} => parses to port-free check with custom port', () => {
      const result = PortFreeTeardownCheckStub({ port: 8080 });

      expect(result).toStrictEqual({
        kind: 'port-free',
        port: 8080,
      });
    });

    it('VALID: {kind: "process-gone", pid: 12345} => parses to process-gone check', () => {
      const result = ProcessGoneTeardownCheckStub();

      expect(result).toStrictEqual({
        kind: 'process-gone',
        pid: 12345,
      });
    });

    it('VALID: {kind: "process-gone", pid: 1} => parses to process-gone check with low pid', () => {
      const result = ProcessGoneTeardownCheckStub({ pid: 1 });

      expect(result).toStrictEqual({
        kind: 'process-gone',
        pid: 1,
      });
    });
  });

  describe('invalid checks', () => {
    it('INVALID: {kind: "nonsense"} => throws for unknown discriminator', () => {
      expect(() => {
        smoketestTeardownCheckContract.parse({ kind: 'nonsense' as never, port: 4751 });
      }).toThrow(/Invalid discriminator value/u);
    });

    it('INVALID: {kind: "port-free", port: 0} => throws for out-of-range port', () => {
      expect(() => {
        smoketestTeardownCheckContract.parse({ kind: 'port-free', port: 0 });
      }).toThrow(/greater than or equal to 1/u);
    });

    it('INVALID: {kind: "port-free", port: 70000} => throws for port above max', () => {
      expect(() => {
        smoketestTeardownCheckContract.parse({ kind: 'port-free', port: 70_000 });
      }).toThrow(/less than or equal to 65535/u);
    });

    it('INVALID: {kind: "process-gone", pid: 0} => throws for non-positive pid', () => {
      expect(() => {
        smoketestTeardownCheckContract.parse({ kind: 'process-gone', pid: 0 });
      }).toThrow(/greater than 0/u);
    });

    it('INVALID: {kind: "process-gone", pid: 1.5} => throws for non-integer pid', () => {
      expect(() => {
        smoketestTeardownCheckContract.parse({ kind: 'process-gone', pid: 1.5 });
      }).toThrow(/integer/u);
    });
  });
});
