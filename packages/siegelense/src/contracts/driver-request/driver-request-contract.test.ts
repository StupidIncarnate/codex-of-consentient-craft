import { driverRequestContract } from './driver-request-contract';
import { DriverRequestStub } from './driver-request.stub';

describe('driverRequestContract', () => {
  describe('valid frames', () => {
    it('VALID: {kind: "ping", payload: ""} => parses the boot-poll frame', () => {
      const request = DriverRequestStub({ kind: 'ping', payload: '' });

      const result = driverRequestContract.parse(request);

      expect(result).toStrictEqual({ kind: 'ping', payload: '' });
    });

    it('VALID: {kind: "run", payload: a JSON-encoded RunRequest} => parses the batch frame', () => {
      const payload = JSON.stringify({
        instanceId: 'inst_7f3a9c21',
        steps: [{ step: 'goto', path: '/' }],
        stopOn: 'error',
      });
      const request = DriverRequestStub({ kind: 'run', payload });

      const result = driverRequestContract.parse(request);

      expect(result).toStrictEqual({ kind: 'run', payload });
    });
  });

  describe('the socket round trip', () => {
    it('VALID: {kind: "run", payload: a JSON-encoded RunRequest} => JSON.stringify then parse round-trips', () => {
      const request = DriverRequestStub({
        kind: 'run',
        payload: JSON.stringify({ instanceId: 'inst_7f3a9c21', steps: [], stopOn: 'never' }),
      });

      const wireFrame: unknown = JSON.parse(JSON.stringify(request));
      const result = driverRequestContract.parse(wireFrame);

      expect(result).toStrictEqual(request);
    });
  });

  describe('malformed frames', () => {
    it('INVALID: {kind: "status"} => an unlisted kind throws validation error rather than something unrecognisable', () => {
      expect(() => driverRequestContract.parse({ kind: 'status' as never, payload: '' })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {missing payload} => throws Required', () => {
      expect(() => driverRequestContract.parse({ kind: 'ping' })).toThrow(/Required/u);
    });
  });
});
