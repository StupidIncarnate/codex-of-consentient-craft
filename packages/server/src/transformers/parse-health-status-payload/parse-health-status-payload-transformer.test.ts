import { HealthStatusPayloadStub } from '@dungeonmaster/shared/contracts';

import { parseHealthStatusPayloadTransformer } from './parse-health-status-payload-transformer';

describe('parseHealthStatusPayloadTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {value: valid payload shape} => returns parsed HealthStatusPayload', () => {
      const payload = HealthStatusPayloadStub();

      const result = parseHealthStatusPayloadTransformer({ value: payload });

      expect(result).toStrictEqual(payload);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: not an object} => returns undefined', () => {
      const result = parseHealthStatusPayloadTransformer({ value: 'hello' });

      expect(result).toBe(undefined);
    });

    it('INVALID: {value: missing uptimeSeconds} => returns undefined', () => {
      const result = parseHealthStatusPayloadTransformer({
        value: { status: 'ok', version: '0.1.0' },
      });

      expect(result).toBe(undefined);
    });
  });
});
