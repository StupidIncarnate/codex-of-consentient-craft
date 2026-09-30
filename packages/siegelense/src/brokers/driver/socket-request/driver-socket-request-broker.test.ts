import { driverSocketRequestBroker } from './driver-socket-request-broker';
import { driverSocketRequestBrokerProxy } from './driver-socket-request-broker.proxy';
import { DriverRequestStub } from '../../../contracts/driver-request/driver-request.stub';
import { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';

const SOCKET_PATH = '/tmp/dm-siege-sockets/inst_7f3a9c21.sock';

describe('driverSocketRequestBroker', () => {
  describe('a well-formed frame round-trips', () => {
    it('VALID: {response frame} => resolves with the parsed DriverResponse', async () => {
      const proxy = driverSocketRequestBrokerProxy();
      const request = DriverRequestStub({ kind: 'ping', payload: '' });
      proxy.respondsWith({
        socketPath: SOCKET_PATH,
        response: DriverResponseStub({ ok: true, payload: '{"alive":true}', error: null }),
      });

      const result = await driverSocketRequestBroker({
        socketPath: SOCKET_PATH,
        request,
        timeoutMs: 5000,
      });

      expect(result).toStrictEqual({ ok: true, payload: '{"alive":true}', error: null });
    });

    it('VALID: {request} => writes the request as one JSON line', async () => {
      const proxy = driverSocketRequestBrokerProxy();
      const request = DriverRequestStub({ kind: 'kill', payload: '' });
      proxy.respondsWith({
        socketPath: SOCKET_PATH,
        response: DriverResponseStub({ ok: true, payload: '', error: null }),
      });

      await driverSocketRequestBroker({ socketPath: SOCKET_PATH, request, timeoutMs: 5000 });

      expect(proxy.getRequestLinesFor({ socketPath: SOCKET_PATH })).toStrictEqual([
        '{"kind":"kill","payload":""}',
      ]);
    });
  });

  describe('a malformed frame rejects, never throws from a field access', () => {
    it('ERROR: {line: not JSON} => rejects naming the socket and the malformed frame', async () => {
      const proxy = driverSocketRequestBrokerProxy();
      const request = DriverRequestStub({ kind: 'ping', payload: '' });
      proxy.respondsWithRawLine({ socketPath: SOCKET_PATH, line: 'not-json' });

      await expect(
        driverSocketRequestBroker({ socketPath: SOCKET_PATH, request, timeoutMs: 5000 }),
      ).rejects.toThrow(
        /^Malformed frame from driver at \/tmp\/dm-siege-sockets\/inst_7f3a9c21\.sock: SyntaxError: /u,
      );
    });

    it('ERROR: {line: JSON missing ok} => rejects naming the socket and the malformed frame', async () => {
      const proxy = driverSocketRequestBrokerProxy();
      const request = DriverRequestStub({ kind: 'ping', payload: '' });
      proxy.respondsWithRawLine({ socketPath: SOCKET_PATH, line: '{"payload":"","error":null}' });

      await expect(
        driverSocketRequestBroker({ socketPath: SOCKET_PATH, request, timeoutMs: 5000 }),
      ).rejects.toThrow(
        /^Malformed frame from driver at \/tmp\/dm-siege-sockets\/inst_7f3a9c21\.sock: .*"ok"/su,
      );
    });
  });

  describe('the connection fails, and its own error passes through', () => {
    it('ERROR: {connect: ECONNREFUSED} => rejects with the connection error', async () => {
      const proxy = driverSocketRequestBrokerProxy();
      const request = DriverRequestStub({ kind: 'ping', payload: '' });
      proxy.connectFailsRefused({ socketPath: SOCKET_PATH });

      await expect(
        driverSocketRequestBroker({ socketPath: SOCKET_PATH, request, timeoutMs: 5000 }),
      ).rejects.toThrow(/^connect ECONNREFUSED \/tmp\/dm-siege-sockets\/inst_7f3a9c21\.sock$/u);
    });

    it('ERROR: {connect: ENOENT} => rejects with the connection error', async () => {
      const proxy = driverSocketRequestBrokerProxy();
      const request = DriverRequestStub({ kind: 'ping', payload: '' });
      proxy.connectFailsNoSocket({ socketPath: SOCKET_PATH });

      await expect(
        driverSocketRequestBroker({ socketPath: SOCKET_PATH, request, timeoutMs: 5000 }),
      ).rejects.toThrow(/^connect ENOENT \/tmp\/dm-siege-sockets\/inst_7f3a9c21\.sock$/u);
    });
  });

  describe('the driver never answers', () => {
    it('ERROR: {no response within timeoutMs} => rejects naming the socket and the ceiling', async () => {
      const proxy = driverSocketRequestBrokerProxy();
      const request = DriverRequestStub({ kind: 'ping', payload: '' });
      proxy.neverResponds({ socketPath: SOCKET_PATH });

      await expect(
        driverSocketRequestBroker({ socketPath: SOCKET_PATH, request, timeoutMs: 10 }),
      ).rejects.toThrow(
        /^Socket request to \/tmp\/dm-siege-sockets\/inst_7f3a9c21\.sock timed out after 10ms$/u,
      );
    });
  });
});
