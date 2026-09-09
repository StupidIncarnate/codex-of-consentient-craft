import { durationDisplayTransformer } from './duration-display-transformer';
import { ElapsedPartsStub } from '../../contracts/elapsed-parts/elapsed-parts.stub';

describe('durationDisplayTransformer', () => {
  describe('under a minute', () => {
    it('VALID: {0h 0m 0s} => returns "<1m"', () => {
      const elapsedParts = ElapsedPartsStub({ hours: 0, minutes: 0, seconds: 0 });

      const result = durationDisplayTransformer({ elapsedParts });

      expect(result).toBe('<1m');
    });

    it('VALID: {0h 0m 30s} => returns "<1m"', () => {
      const elapsedParts = ElapsedPartsStub({ hours: 0, minutes: 0, seconds: 30 });

      const result = durationDisplayTransformer({ elapsedParts });

      expect(result).toBe('<1m');
    });

    it('EDGE: {0h 0m 59s} => returns "<1m"', () => {
      const elapsedParts = ElapsedPartsStub({ hours: 0, minutes: 0, seconds: 59 });

      const result = durationDisplayTransformer({ elapsedParts });

      expect(result).toBe('<1m');
    });
  });

  describe('minutes only', () => {
    it('EDGE: {0h 1m 0s} => returns "1m"', () => {
      const elapsedParts = ElapsedPartsStub({ hours: 0, minutes: 1, seconds: 0 });

      const result = durationDisplayTransformer({ elapsedParts });

      expect(result).toBe('1m');
    });

    it('VALID: {0h 4m 30s} => returns "4m"', () => {
      const elapsedParts = ElapsedPartsStub({ hours: 0, minutes: 4, seconds: 30 });

      const result = durationDisplayTransformer({ elapsedParts });

      expect(result).toBe('4m');
    });

    it('EDGE: {0h 59m 59s} => returns "59m"', () => {
      const elapsedParts = ElapsedPartsStub({ hours: 0, minutes: 59, seconds: 59 });

      const result = durationDisplayTransformer({ elapsedParts });

      expect(result).toBe('59m');
    });
  });

  describe('an hour or more', () => {
    it('EDGE: {1h 0m 0s} => returns "1h"', () => {
      const elapsedParts = ElapsedPartsStub({ hours: 1, minutes: 0, seconds: 0 });

      const result = durationDisplayTransformer({ elapsedParts });

      expect(result).toBe('1h');
    });

    it('VALID: {1h 13m 0s} => returns "1h13m"', () => {
      const elapsedParts = ElapsedPartsStub({ hours: 1, minutes: 13, seconds: 0 });

      const result = durationDisplayTransformer({ elapsedParts });

      expect(result).toBe('1h13m');
    });

    it('VALID: {2h 0m 0s} => returns "2h"', () => {
      const elapsedParts = ElapsedPartsStub({ hours: 2, minutes: 0, seconds: 0 });

      const result = durationDisplayTransformer({ elapsedParts });

      expect(result).toBe('2h');
    });

    it('EDGE: {30h 13m 0s} => returns "30h13m"', () => {
      const elapsedParts = ElapsedPartsStub({ hours: 30, minutes: 13, seconds: 0 });

      const result = durationDisplayTransformer({ elapsedParts });

      expect(result).toBe('30h13m');
    });
  });
});
