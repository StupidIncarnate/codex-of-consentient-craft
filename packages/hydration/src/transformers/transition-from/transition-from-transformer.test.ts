import { transitionFromTransformer } from './transition-from-transformer';

describe('transitionFromTransformer', () => {
  describe('a record carrying the field', () => {
    it('VALID: {record: {status: "created"}, field: "status"} => returns "created"', () => {
      const result = transitionFromTransformer({
        record: { status: 'created' },
        field: 'status',
      });

      expect(result).toBe('created');
    });
  });

  describe('a record with no value under that field', () => {
    it('EMPTY: {record: {}, field: "status"} => returns undefined', () => {
      const result = transitionFromTransformer({
        record: {},
        field: 'status',
      });

      expect(result).toBe(undefined);
    });
  });
});
