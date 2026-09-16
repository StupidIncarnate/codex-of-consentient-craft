import { netUnixRequestAdapter } from './net-unix-request-adapter';
import { netUnixRequestAdapterProxy } from './net-unix-request-adapter.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { DriverRequestStub } from '../../../contracts/driver-request/driver-request.stub';
import { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';

describe('netUnixRequestAdapter', () => {
  describe('a well-formed frame round-trips', () => {
    it('VALID: {response frame} => resolves with the parsed DriverResponse', async () => {
      const proxy = netUnixRequestAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      const request = DriverRequestStub({ kind: 'ping', payload: '' });
      const response = DriverResponseStub({ ok: true, payload: '{"alive":true}', error: null });

      proxy.respondsWith({ socketPath, response });

      const result = await netUnixRequestAdapter({ socketPath, request, timeoutMs: 5000 });

      expect(result).toStrictEqual({ ok: true, payload: '{"alive":true}', error: null });
    });

    it('VALID: {request} => writes one newline-terminated JSON request frame', async () => {
      const proxy = netUnixRequestAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      const request = DriverRequestStub({ kind: 'ping', payload: '' });
      const response = DriverResponseStub({ ok: true, payload: '', error: null });

      proxy.respondsWith({ socketPath, response });

      await netUnixRequestAdapter({ socketPath, request, timeoutMs: 5000 });

      expect(proxy.getWrittenFor({ socketPath })).toBe('{"kind":"ping","payload":""}\n');
    });
  });

  describe('a malformed frame is rejected, never thrown from a field access', () => {
    it('ERROR: {frame: invalid JSON} => rejects with a real error naming the malformed frame', async () => {
      const proxy = netUnixRequestAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      const request = DriverRequestStub({ kind: 'ping', payload: '' });

      proxy.respondsWithRawFrame({ socketPath, frame: 'not-json\n' });

      await expect(netUnixRequestAdapter({ socketPath, request, timeoutMs: 5000 })).rejects.toThrow(
        /Malformed frame from driver/u,
      );
    });

    it('ERROR: {frame: valid JSON missing required field} => rejects with a real error naming the malformed frame', async () => {
      const proxy = netUnixRequestAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      const request = DriverRequestStub({ kind: 'ping', payload: '' });

      proxy.respondsWithRawFrame({ socketPath, frame: '{"payload":"","error":null}\n' });

      await expect(netUnixRequestAdapter({ socketPath, request, timeoutMs: 5000 })).rejects.toThrow(
        /Malformed frame from driver/u,
      );
    });
  });

  describe('the connection refuses, and the adapter lets the raw error through', () => {
    it('ERROR: {connect: ECONNREFUSED, stale socket file} => rejects with that exact error', async () => {
      const proxy = netUnixRequestAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      const request = DriverRequestStub({ kind: 'ping', payload: '' });
      const connectError = Object.assign(new Error('connect ECONNREFUSED'), {
        code: 'ECONNREFUSED',
      });

      proxy.connectFails({ socketPath, error: connectError });

      await expect(netUnixRequestAdapter({ socketPath, request, timeoutMs: 5000 })).rejects.toBe(
        connectError,
      );
    });

    it('ERROR: {connect: ENOENT, no socket file at all} => rejects with that exact error', async () => {
      const proxy = netUnixRequestAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_never_existed.sock',
      });
      const request = DriverRequestStub({ kind: 'ping', payload: '' });
      const connectError = Object.assign(new Error('connect ENOENT'), { code: 'ENOENT' });

      proxy.connectFails({ socketPath, error: connectError });

      await expect(netUnixRequestAdapter({ socketPath, request, timeoutMs: 5000 })).rejects.toBe(
        connectError,
      );
    });
  });

  describe('the driver never answers', () => {
    it('ERROR: {no response within timeoutMs} => rejects naming the socket path and the ceiling', async () => {
      const proxy = netUnixRequestAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      const request = DriverRequestStub({ kind: 'ping', payload: '' });

      proxy.neverResponds({ socketPath });

      await expect(netUnixRequestAdapter({ socketPath, request, timeoutMs: 10 })).rejects.toThrow(
        /Socket request to \/tmp\/dm-siege-sockets\/inst_7f3a9c21\.sock timed out after 10ms/u,
      );
    });
  });
});
