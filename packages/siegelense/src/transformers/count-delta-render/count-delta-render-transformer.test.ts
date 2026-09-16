import { ReadingCountStub } from '../../contracts/reading-count/reading-count.stub';
import { countDeltaRenderTransformer } from './count-delta-render-transformer';

describe('countDeltaRenderTransformer', () => {
  describe('valid deltas', () => {
    it('VALID: {before: 0, after: 2} => renders "+2"', () => {
      const result = countDeltaRenderTransformer({
        before: ReadingCountStub({ value: 0 }),
        after: ReadingCountStub({ value: 2 }),
      });

      expect(result).toBe('+2');
    });

    it('VALID: {before: 3, after: 0} => renders "-3"', () => {
      const result = countDeltaRenderTransformer({
        before: ReadingCountStub({ value: 3 }),
        after: ReadingCountStub({ value: 0 }),
      });

      expect(result).toBe('-3');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {before: 4, after: 4} => renders "+0", never the unsigned "0", so a delta is never mistaken for a count', () => {
      const result = countDeltaRenderTransformer({
        before: ReadingCountStub({ value: 4 }),
        after: ReadingCountStub({ value: 4 }),
      });

      expect(result).toBe('+0');
    });
  });
});
