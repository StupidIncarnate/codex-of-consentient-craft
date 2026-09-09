import { IsoTimestampStub } from '../../contracts/iso-timestamp/iso-timestamp.stub';
import { elapsedPartsTransformer } from './elapsed-parts-transformer';

describe('elapsedPartsTransformer', () => {
  describe('positive spans', () => {
    it('VALID: {4530 second gap} => returns {hours: 1, minutes: 15, seconds: 30}', () => {
      const result = elapsedPartsTransformer({
        startedAt: IsoTimestampStub({ value: '2024-01-15T10:00:00.000Z' }),
        endedAt: IsoTimestampStub({ value: '2024-01-15T11:15:30.000Z' }),
      });

      expect(result).toStrictEqual({ hours: 1, minutes: 15, seconds: 30 });
    });

    it('VALID: {4530.9 second gap} => floors to the same {hours: 1, minutes: 15, seconds: 30}', () => {
      const result = elapsedPartsTransformer({
        startedAt: IsoTimestampStub({ value: '2024-01-15T10:00:00.000Z' }),
        endedAt: IsoTimestampStub({ value: '2024-01-15T11:15:30.900Z' }),
      });

      expect(result).toStrictEqual({ hours: 1, minutes: 15, seconds: 30 });
    });

    it('EDGE: {0 second gap} => returns {hours: 0, minutes: 0, seconds: 0}', () => {
      const result = elapsedPartsTransformer({
        startedAt: IsoTimestampStub({ value: '2024-01-15T10:00:00.000Z' }),
        endedAt: IsoTimestampStub({ value: '2024-01-15T10:00:00.000Z' }),
      });

      expect(result).toStrictEqual({ hours: 0, minutes: 0, seconds: 0 });
    });

    it('EDGE: {60 second gap} => rolls seconds into {hours: 0, minutes: 1, seconds: 0}', () => {
      const result = elapsedPartsTransformer({
        startedAt: IsoTimestampStub({ value: '2024-01-15T10:00:00.000Z' }),
        endedAt: IsoTimestampStub({ value: '2024-01-15T10:01:00.000Z' }),
      });

      expect(result).toStrictEqual({ hours: 0, minutes: 1, seconds: 0 });
    });

    it('EDGE: {3600 second gap} => rolls minutes into {hours: 1, minutes: 0, seconds: 0}', () => {
      const result = elapsedPartsTransformer({
        startedAt: IsoTimestampStub({ value: '2024-01-15T10:00:00.000Z' }),
        endedAt: IsoTimestampStub({ value: '2024-01-15T11:00:00.000Z' }),
      });

      expect(result).toStrictEqual({ hours: 1, minutes: 0, seconds: 0 });
    });
  });

  describe('negative spans', () => {
    it('EDGE: {endedAt before startedAt} => clamps to {hours: 0, minutes: 0, seconds: 0}', () => {
      const result = elapsedPartsTransformer({
        startedAt: IsoTimestampStub({ value: '2024-01-15T10:00:05.000Z' }),
        endedAt: IsoTimestampStub({ value: '2024-01-15T10:00:00.000Z' }),
      });

      expect(result).toStrictEqual({ hours: 0, minutes: 0, seconds: 0 });
    });
  });
});
