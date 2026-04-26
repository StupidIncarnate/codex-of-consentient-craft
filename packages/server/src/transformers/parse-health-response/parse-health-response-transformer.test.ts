import { parseHealthResponseTransformer } from './parse-health-response-transformer';

describe('parseHealthResponseTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {value: valid response shape} => returns parsed HealthResponse', () => {
      const result = parseHealthResponseTransformer({
        value: { status: 'ok', timestamp: '2024-01-01T00:00:00Z' },
      });

      expect(result?.status).toBe('ok');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: not an object} => returns undefined', () => {
      const result = parseHealthResponseTransformer({ value: 'hello' });

      expect(result).toBe(undefined);
    });

    it('INVALID: {value: missing status} => returns undefined', () => {
      const result = parseHealthResponseTransformer({ value: { timestamp: 'x' } });

      expect(result).toBe(undefined);
    });
  });
});
