import { runIndexContract } from './run-index-contract';
import { RunIndexStub } from './run-index.stub';

describe('runIndexContract', () => {
  describe('valid indexes', () => {
    it('VALID: {console, server, network counts} => parses the complete index', () => {
      const result = runIndexContract.parse({
        console: { errors: 0, warnings: 2 },
        server: { errors: 0 },
        network: { exchanges: 14, failed: 0 },
      });

      expect(result).toStrictEqual({
        console: { errors: 0, warnings: 2 },
        server: { errors: 0 },
        network: { exchanges: 14, failed: 0 },
      });
    });
  });

  describe('an index an older build wrote', () => {
    it('VALID: {network: {exchanges: 9, non2xx: 1}} => reads non2xx as failed', () => {
      const result = runIndexContract.parse({
        console: { errors: 0, warnings: 0 },
        server: { errors: 0 },
        network: { exchanges: 9, non2xx: 1 },
      });

      expect(result).toStrictEqual({
        console: { errors: 0, warnings: 0 },
        server: { errors: 0 },
        network: { exchanges: 9, failed: 1 },
      });
    });

    it('VALID: {network carries both failed and non2xx} => keeps failed and drops non2xx', () => {
      const result = runIndexContract.parse({
        console: { errors: 0, warnings: 0 },
        server: { errors: 0 },
        network: { exchanges: 9, failed: 0, non2xx: 1 },
      });

      expect(result).toStrictEqual({
        console: { errors: 0, warnings: 0 },
        server: { errors: 0 },
        network: { exchanges: 9, failed: 0 },
      });
    });
  });

  describe('empty windows', () => {
    it('EMPTY: {every count: 0} => a run that found nothing still produces a real index', () => {
      const result = runIndexContract.parse({
        console: { errors: 0, warnings: 0 },
        server: { errors: 0 },
        network: { exchanges: 0, failed: 0 },
      });

      expect(result).toStrictEqual({
        console: { errors: 0, warnings: 0 },
        server: { errors: 0 },
        network: { exchanges: 0, failed: 0 },
      });
    });
  });

  describe('invalid indexes', () => {
    it('INVALID: {missing network.failed} => throws validation error', () => {
      expect(() =>
        runIndexContract.parse({
          console: { errors: 0, warnings: 0 },
          server: { errors: 0 },
          network: { exchanges: 14 },
        } as never),
      ).toThrow(/Required/u);
    });

    it('INVALID: {negative console.errors} => throws validation error', () => {
      expect(() =>
        runIndexContract.parse({
          console: { errors: -1, warnings: 0 },
          server: { errors: 0 },
          network: { exchanges: 0, failed: 0 },
        } as never),
      ).toThrow(/Number must be greater than or equal to 0/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates an index with two console warnings and fourteen exchanges', () => {
      const result = RunIndexStub();

      expect(result).toStrictEqual({
        console: { errors: 0, warnings: 2 },
        server: { errors: 0 },
        network: { exchanges: 14, failed: 0 },
      });
    });
  });
});
