import { EpochMsStub } from '../../contracts/epoch-ms/epoch-ms.stub';
import { elapsedRenderTransformer } from './elapsed-render-transformer';

describe('elapsedRenderTransformer', () => {
  describe('boundary table', () => {
    it.each([
      [1999, '1s'],
      [59_000, '59s'],
      [60_000, '1m'],
      [3_599_000, '59m'],
      [3_600_000, '1h'],
      [86_400_000, '1d'],
    ])('VALID: {elapsedMs: %i} => renders %s', (elapsedMs, expected) => {
      const result = elapsedRenderTransformer({ elapsedMs: EpochMsStub({ value: elapsedMs }) });

      expect(result).toBe(expected);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {elapsedMs: 0} => renders the zero-second boundary', () => {
      const result = elapsedRenderTransformer({ elapsedMs: EpochMsStub({ value: 0 }) });

      expect(result).toBe('0s');
    });
  });
});
