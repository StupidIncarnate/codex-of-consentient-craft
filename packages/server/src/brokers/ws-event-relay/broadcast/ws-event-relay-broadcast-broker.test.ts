import { WsMessageStub } from '@dungeonmaster/shared/contracts';

import { WsClientStub } from '../../../contracts/ws-client/ws-client.stub';

import { wsEventRelayBroadcastBroker } from './ws-event-relay-broadcast-broker';
import { wsEventRelayBroadcastBrokerProxy } from './ws-event-relay-broadcast-broker.proxy';

describe('wsEventRelayBroadcastBroker', () => {
  describe('event subscription (broadcast to clients)', () => {
    it('EMPTY: {no clients} => returns empty dead clients set', () => {
      wsEventRelayBroadcastBrokerProxy();
      const clients = new Set<ReturnType<typeof WsClientStub>>();
      const message = WsMessageStub();

      const result = wsEventRelayBroadcastBroker({ clients, message });

      expect(result.size).toBe(0);
    });

    it('VALID: {one healthy client} => sends serialized message to client', () => {
      wsEventRelayBroadcastBrokerProxy();
      const sendMock = jest.fn();
      const client = WsClientStub({ send: sendMock });
      const clients = new Set([client]);
      const message = WsMessageStub({
        type: 'phase-change',
        payload: { processId: 'proc-123', phase: 'codeweaver' },
        timestamp: '2025-01-01T00:00:00.000Z',
      });

      const result = wsEventRelayBroadcastBroker({ clients, message });

      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'phase-change',
          payload: { processId: 'proc-123', phase: 'codeweaver' },
          timestamp: '2025-01-01T00:00:00.000Z',
        }),
      );
      expect(result.size).toBe(0);
    });

    it('VALID: {three healthy clients} => all receive the same message', () => {
      wsEventRelayBroadcastBrokerProxy();
      const send1 = jest.fn();
      const send2 = jest.fn();
      const send3 = jest.fn();
      const client1 = WsClientStub({ send: send1 });
      const client2 = WsClientStub({ send: send2 });
      const client3 = WsClientStub({ send: send3 });
      const clients = new Set([client1, client2, client3]);
      const message = WsMessageStub({ type: 'slot-update' });

      const result = wsEventRelayBroadcastBroker({ clients, message });

      expect(send1).toHaveBeenCalledTimes(1);
      expect(send2).toHaveBeenCalledTimes(1);
      expect(send3).toHaveBeenCalledTimes(1);
      expect(result.size).toBe(0);
      expect(clients.size).toBe(3);
    });
  });

  describe('dead client cleanup', () => {
    it('ERROR: {one dead client} => removes from clients set and returns in dead set', () => {
      wsEventRelayBroadcastBrokerProxy();
      const deadSend = jest.fn(() => {
        throw new Error('Connection closed');
      });
      const deadClient = WsClientStub({ send: deadSend });
      const clients = new Set([deadClient]);
      const message = WsMessageStub();

      const result = wsEventRelayBroadcastBroker({ clients, message });

      expect(result.size).toBe(1);
      expect(result.has(deadClient)).toBe(true);
      expect(clients.size).toBe(0);
    });

    it('VALID: {mix of healthy and dead} => healthy client still receives message', () => {
      wsEventRelayBroadcastBrokerProxy();
      const healthySend = jest.fn();
      const deadSend = jest.fn(() => {
        throw new Error('Connection closed');
      });
      const healthyClient = WsClientStub({ send: healthySend });
      const deadClient = WsClientStub({ send: deadSend });
      const clients = new Set([healthyClient, deadClient]);
      const message = WsMessageStub({ type: 'progress-update' });

      const result = wsEventRelayBroadcastBroker({ clients, message });

      expect(healthySend).toHaveBeenCalledTimes(1);
      expect(result.has(healthyClient)).toBe(false);
      expect(clients.has(healthyClient)).toBe(true);
    });

    it('VALID: {mix of healthy and dead} => dead client removed from set and returned', () => {
      wsEventRelayBroadcastBrokerProxy();
      const healthySend = jest.fn();
      const deadSend = jest.fn(() => {
        throw new Error('Connection closed');
      });
      const healthyClient = WsClientStub({ send: healthySend });
      const deadClient = WsClientStub({ send: deadSend });
      const clients = new Set([healthyClient, deadClient]);
      const message = WsMessageStub({ type: 'progress-update' });

      const result = wsEventRelayBroadcastBroker({ clients, message });

      expect(result.size).toBe(1);
      expect(result.has(deadClient)).toBe(true);
      expect(clients.has(deadClient)).toBe(false);
      expect(clients.size).toBe(1);
    });

    it('EDGE: {all clients dead} => all removed from clients, all returned in dead set', () => {
      wsEventRelayBroadcastBrokerProxy();
      const dead1 = jest.fn(() => {
        throw new Error('Connection closed');
      });
      const dead2 = jest.fn(() => {
        throw new Error('Connection closed');
      });
      const client1 = WsClientStub({ send: dead1 });
      const client2 = WsClientStub({ send: dead2 });
      const clients = new Set([client1, client2]);
      const message = WsMessageStub();

      const result = wsEventRelayBroadcastBroker({ clients, message });

      expect(result.size).toBe(2);
      expect(clients.size).toBe(0);
    });
  });
});
