import { rateLimitWindowContract } from './rate-limit-window-contract';
import { RateLimitWindowStub } from './rate-limit-window.stub';

describe('rateLimitWindowContract', () => {
  describe('valid windows', () => {
    it('VALID: full window => parses successfully', () => {
      const window = RateLimitWindowStub();

      const result = rateLimitWindowContract.parse(window);

      expect(result).toStrictEqual({
        usedPercentage: 42,
        resetsAt: '2026-05-05T15:00:00.000Z',
      });
    });

    it('VALID: {usedPercentage: 0} => parses successfully', () => {
      const result = rateLimitWindowContract.parse(RateLimitWindowStub({ usedPercentage: 0 }));

      expect(result).toStrictEqual({
        usedPercentage: 0,
        resetsAt: '2026-05-05T15:00:00.000Z',
      });
    });

    it('VALID: {usedPercentage: 100} => parses successfully', () => {
      const result = rateLimitWindowContract.parse(RateLimitWindowStub({ usedPercentage: 100 }));

      expect(result).toStrictEqual({
        usedPercentage: 100,
        resetsAt: '2026-05-05T15:00:00.000Z',
      });
    });
  });

  describe('invalid windows', () => {
    it('INVALID: {usedPercentage: -1} => throws validation error', () => {
      expect(() => {
        rateLimitWindowContract.parse({
          usedPercentage: -1,
          resetsAt: '2026-05-05T15:00:00.000Z',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {usedPercentage: 101} => throws validation error', () => {
      expect(() => {
        rateLimitWindowContract.parse({
          usedPercentage: 101,
          resetsAt: '2026-05-05T15:00:00.000Z',
        });
      }).toThrow(/too_big/u);
    });

    it('INVALID: {resetsAt: not-a-timestamp} => throws validation error', () => {
      expect(() => {
        rateLimitWindowContract.parse({
          usedPercentage: 42,
          resetsAt: 'not-a-timestamp',
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID: missing required fields => throws validation error', () => {
      expect(() => {
        rateLimitWindowContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
