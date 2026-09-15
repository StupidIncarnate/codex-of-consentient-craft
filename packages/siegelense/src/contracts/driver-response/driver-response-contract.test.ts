import { driverResponseContract } from './driver-response-contract';
import { DriverResponseStub } from './driver-response.stub';

describe('driverResponseContract', () => {
  describe('valid frames', () => {
    it('VALID: {ok: true, payload: a JSON-encoded RunResult, error: null} => parses a successful answer', () => {
      const payload = JSON.stringify({
        instanceId: 'inst_7f3a9c21',
        runId: 'run_1',
        status: 'done',
      });
      const response = DriverResponseStub({ ok: true, payload, error: null });

      const result = driverResponseContract.parse(response);

      expect(result).toStrictEqual({ ok: true, payload, error: null });
    });

    it('VALID: {ok: false, payload: "", error: a message} => parses a frame reporting the driver\'s own failure', () => {
      const response = DriverResponseStub({
        ok: false,
        payload: '',
        error: 'run request failed schema validation: instanceId Required',
      });

      const result = driverResponseContract.parse(response);

      expect(result).toStrictEqual({
        ok: false,
        payload: '',
        error: 'run request failed schema validation: instanceId Required',
      });
    });
  });

  describe('the socket round trip', () => {
    it('VALID: {ok: true, payload: a JSON-encoded RunResult} => JSON.stringify then parse round-trips', () => {
      const response = DriverResponseStub({
        ok: true,
        payload: JSON.stringify({ instanceId: 'inst_7f3a9c21', runId: 'run_1', status: 'done' }),
        error: null,
      });

      const wireFrame: unknown = JSON.parse(JSON.stringify(response));
      const result = driverResponseContract.parse(wireFrame);

      expect(result).toStrictEqual(response);
    });
  });

  describe('malformed frames', () => {
    it('INVALID: {ok: "yes"} => a non-boolean ok throws validation error rather than something unrecognisable', () => {
      expect(() =>
        driverResponseContract.parse({ ok: 'yes' as never, payload: '', error: null }),
      ).toThrow(/Expected boolean/u);
    });

    it('INVALID: {missing error} => throws Required, because .nullable() is not .optional()', () => {
      expect(() => driverResponseContract.parse({ ok: true, payload: '' })).toThrow(/Required/u);
    });
  });
});
