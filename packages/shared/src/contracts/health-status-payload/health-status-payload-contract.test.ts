import { healthStatusPayloadContract } from './health-status-payload-contract';
import { HealthStatusPayloadStub } from './health-status-payload.stub';

describe('healthStatusPayloadContract', () => {
  describe('valid payloads', () => {
    it('VALID: {status: ok, uptimeSeconds, version} => parses successfully', () => {
      const result = healthStatusPayloadContract.parse(HealthStatusPayloadStub());

      expect(result).toStrictEqual({
        status: 'ok',
        uptimeSeconds: 120,
        version: '1.0.0',
      });
    });

    it('VALID: {status: degraded} => parses successfully', () => {
      const result = healthStatusPayloadContract.parse(
        HealthStatusPayloadStub({ status: 'degraded' }),
      );

      expect(result).toStrictEqual({
        status: 'degraded',
        uptimeSeconds: 120,
        version: '1.0.0',
      });
    });

    it('EDGE: {uptimeSeconds: 0} => parses successfully, so the first frame after server start is deliverable', () => {
      const result = healthStatusPayloadContract.parse(
        HealthStatusPayloadStub({ uptimeSeconds: 0 }),
      );

      expect(result).toStrictEqual({
        status: 'ok',
        uptimeSeconds: 0,
        version: '1.0.0',
      });
    });
  });

  describe('invalid payloads', () => {
    it('INVALID: {status: "unknown"} => throws validation error', () => {
      expect(() => {
        healthStatusPayloadContract.parse({
          status: 'unknown',
          uptimeSeconds: 120,
          version: '1.0.0',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: missing uptimeSeconds => throws validation error', () => {
      expect(() => {
        healthStatusPayloadContract.parse({
          status: 'ok',
          version: '1.0.0',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {uptimeSeconds: 1.5} => throws validation error', () => {
      expect(() => {
        healthStatusPayloadContract.parse({
          status: 'ok',
          uptimeSeconds: 1.5,
          version: '1.0.0',
        });
      }).toThrow(/Expected integer, received float/u);
    });

    it('INVALID: {uptimeSeconds: -1} => throws validation error', () => {
      expect(() => {
        healthStatusPayloadContract.parse({
          status: 'ok',
          uptimeSeconds: -1,
          version: '1.0.0',
        });
      }).toThrow(/Number must be greater than or equal to 0/u);
    });

    it('INVALID: {version: ""} => throws validation error', () => {
      expect(() => {
        healthStatusPayloadContract.parse({
          status: 'ok',
          uptimeSeconds: 120,
          version: '',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });
  });
});
