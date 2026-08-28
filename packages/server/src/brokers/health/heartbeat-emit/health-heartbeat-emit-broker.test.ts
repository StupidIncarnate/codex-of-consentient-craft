import { WsClientStub } from '../../../contracts/ws-client/ws-client.stub';

import { healthHeartbeatEmitBroker } from './health-heartbeat-emit-broker';
import { healthHeartbeatEmitBrokerProxy } from './health-heartbeat-emit-broker.proxy';

describe('healthHeartbeatEmitBroker', () => {
  describe('single client', () => {
    it('VALID: {one client} => sends one health-status frame with exactly status, uptimeSeconds, version', () => {
      const proxy = healthHeartbeatEmitBrokerProxy();
      proxy.stagesHealth({ uptime: 42.9, version: '0.1.0' });
      const clients = new Set([proxy.captureClient]);

      healthHeartbeatEmitBroker({ clients });

      expect(proxy.getCapturedMessages()).toStrictEqual([
        {
          type: 'health-status',
          payload: { status: 'ok', uptimeSeconds: 42, version: '0.1.0' },
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ]);
    });

    it('VALID: {one client} => return value is an empty dead-client set', () => {
      const proxy = healthHeartbeatEmitBrokerProxy();
      proxy.stagesHealth({ uptime: 5, version: '0.1.0' });
      const clients = new Set([proxy.captureClient]);

      const result = healthHeartbeatEmitBroker({ clients });

      expect(result.size).toBe(0);
    });
  });

  describe('uptime advances between calls', () => {
    it('VALID: {uptime staged 100 then 110} => uptimeSeconds advances per call, in order', () => {
      const proxy = healthHeartbeatEmitBrokerProxy();
      const clients = new Set([proxy.captureClient]);

      proxy.stagesHealth({ uptime: 100, version: '0.1.0' });
      healthHeartbeatEmitBroker({ clients });

      proxy.stagesHealth({ uptime: 110, version: '0.1.0' });
      healthHeartbeatEmitBroker({ clients });

      expect(proxy.getCapturedMessages()).toStrictEqual([
        {
          type: 'health-status',
          payload: { status: 'ok', uptimeSeconds: 100, version: '0.1.0' },
          timestamp: '2024-01-01T00:00:00.000Z',
        },
        {
          type: 'health-status',
          payload: { status: 'ok', uptimeSeconds: 110, version: '0.1.0' },
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('dead client cleanup', () => {
    it('ERROR: {first client throws} => first client removed from the set and returned dead, second client still receives the frame', () => {
      const proxy = healthHeartbeatEmitBrokerProxy();
      proxy.stagesHealth({ uptime: 100, version: '0.1.0' });
      const deadSend = jest.fn(() => {
        throw new Error('Connection closed');
      });
      const deadClient = WsClientStub({ send: deadSend });
      const clients = new Set([deadClient, proxy.captureClient]);

      const deadClients = healthHeartbeatEmitBroker({ clients });

      expect(clients.has(deadClient)).toBe(false);
      expect(deadClients.has(deadClient)).toBe(true);
      expect(proxy.getCapturedMessages()).toStrictEqual([
        {
          type: 'health-status',
          payload: { status: 'ok', uptimeSeconds: 100, version: '0.1.0' },
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('fan-out to every client', () => {
    it('VALID: {three clients} => each receives exactly one serialised health-status frame per emit', () => {
      const proxy = healthHeartbeatEmitBrokerProxy();
      proxy.stagesHealth({ uptime: 200, version: '0.1.0' });
      const send1 = jest.fn();
      const send2 = jest.fn();
      const send3 = jest.fn();
      const client1 = WsClientStub({ send: send1 });
      const client2 = WsClientStub({ send: send2 });
      const client3 = WsClientStub({ send: send3 });
      const clients = new Set([client1, client2, client3]);

      healthHeartbeatEmitBroker({ clients });

      const expectedMessage = JSON.stringify({
        type: 'health-status',
        payload: { status: 'ok', uptimeSeconds: 200, version: '0.1.0' },
        timestamp: '2024-01-01T00:00:00.000Z',
      });

      expect(send1.mock.calls).toStrictEqual([[expectedMessage]]);
      expect(send2.mock.calls).toStrictEqual([[expectedMessage]]);
      expect(send3.mock.calls).toStrictEqual([[expectedMessage]]);
    });
  });
});
