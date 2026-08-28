import { healthStatusPayloadContract } from './health-status-payload-contract';
import { HealthStatusPayloadStub } from './health-status-payload.stub';

describe('healthStatusPayloadContract', () => {
  describe('valid payloads', () => {
    it('VALID: {} => returns the default whole payload', () => {
      const payload = HealthStatusPayloadStub();

      expect(payload).toStrictEqual({
        status: 'ok',
        uptimeSeconds: 11520,
        version: '0.1.0',
      });
    });

    it("VALID: {status: 'degraded'} => returns a payload whose status is 'degraded'", () => {
      const payload = HealthStatusPayloadStub({ status: 'degraded' });

      expect(payload.status).toBe('degraded');
    });

    it('VALID: {status: ok, uptimeSeconds: 11520, version: 0.1.0} => parses returning exactly those three keys', () => {
      const parsed = healthStatusPayloadContract.parse({
        status: 'ok',
        uptimeSeconds: 11520,
        version: '0.1.0',
      });

      expect(parsed).toStrictEqual({
        status: 'ok',
        uptimeSeconds: 11520,
        version: '0.1.0',
      });
    });
  });

  describe('invalid payloads', () => {
    it('INVALID: {status missing} => throws validation error', () => {
      expect(() =>
        healthStatusPayloadContract.parse({
          uptimeSeconds: 11520,
          version: '0.1.0',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {uptimeSeconds missing} => throws validation error', () => {
      expect(() =>
        healthStatusPayloadContract.parse({
          status: 'ok',
          version: '0.1.0',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {version missing} => throws validation error', () => {
      expect(() =>
        healthStatusPayloadContract.parse({
          status: 'ok',
          uptimeSeconds: 11520,
        }),
      ).toThrow(/Required/u);
    });

    it("INVALID: {status: 'unhealthy'} => throws validation error", () => {
      expect(() =>
        healthStatusPayloadContract.parse({
          status: 'unhealthy',
          uptimeSeconds: 11520,
          version: '0.1.0',
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {uptimeSeconds: 1.5} => throws validation error', () => {
      expect(() =>
        healthStatusPayloadContract.parse({
          status: 'ok',
          uptimeSeconds: 1.5,
          version: '0.1.0',
        }),
      ).toThrow(/Expected integer, received float/u);
    });

    it('INVALID: {uptimeSeconds: -1} => throws validation error', () => {
      expect(() =>
        healthStatusPayloadContract.parse({
          status: 'ok',
          uptimeSeconds: -1,
          version: '0.1.0',
        }),
      ).toThrow(/Number must be greater than or equal to 0/u);
    });

    it("INVALID: {uptimeSeconds: '60'} => throws validation error", () => {
      expect(() =>
        healthStatusPayloadContract.parse({
          status: 'ok',
          uptimeSeconds: '60',
          version: '0.1.0',
        }),
      ).toThrow(/Expected number, received string/u);
    });

    it("EMPTY: {version: ''} => throws validation error", () => {
      expect(() =>
        healthStatusPayloadContract.parse({
          status: 'ok',
          uptimeSeconds: 11520,
          version: '',
        }),
      ).toThrow(/String must contain at least 1/u);
    });
  });
});
