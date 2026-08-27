import { WsClientStub } from '../../../contracts/ws-client/ws-client.stub';
import { healthHeartbeatStartBroker } from './health-heartbeat-start-broker';
import { healthHeartbeatStartBrokerProxy } from './health-heartbeat-start-broker.proxy';

type WsClient = ReturnType<typeof WsClientStub>;

describe('healthHeartbeatStartBroker', () => {
  describe('broadcast cadence', () => {
    it('VALID: {three ticks} => produces exactly three health-status broadcasts, each with type, payload and timestamp', () => {
      const proxy = healthHeartbeatStartBrokerProxy();
      proxy.setupSnapshot({ uptimeSeconds: 120, version: '1.0.0' });
      const clients = new Set<WsClient>([proxy.captureClient]);

      healthHeartbeatStartBroker({ clients });
      proxy.triggerTick();
      proxy.triggerTick();
      proxy.triggerTick();

      expect(proxy.getCapturedMessages()).toStrictEqual([
        {
          type: 'health-status',
          payload: { status: 'ok', uptimeSeconds: 120, version: '1.0.0' },
          timestamp: '2024-01-01T00:00:00.000Z',
        },
        {
          type: 'health-status',
          payload: { status: 'ok', uptimeSeconds: 120, version: '1.0.0' },
          timestamp: '2024-01-01T00:00:00.000Z',
        },
        {
          type: 'health-status',
          payload: { status: 'ok', uptimeSeconds: 120, version: '1.0.0' },
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('payload freshness', () => {
    it('VALID: {two ticks over a rising uptime reading} => the second frame has a strictly greater uptimeSeconds than the first', () => {
      const proxy = healthHeartbeatStartBrokerProxy();
      const clients = new Set<WsClient>([proxy.captureClient]);

      healthHeartbeatStartBroker({ clients });

      proxy.setupSnapshot({ uptimeSeconds: 100, version: '1.0.0' });
      proxy.triggerTick();

      proxy.setupSnapshot({ uptimeSeconds: 200, version: '1.0.0' });
      proxy.triggerTick();

      expect(proxy.getCapturedMessages()).toStrictEqual([
        {
          type: 'health-status',
          payload: { status: 'ok', uptimeSeconds: 100, version: '1.0.0' },
          timestamp: '2024-01-01T00:00:00.000Z',
        },
        {
          type: 'health-status',
          payload: { status: 'ok', uptimeSeconds: 200, version: '1.0.0' },
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('dead client handling', () => {
    it('ERROR: {one client send throws} => that client is removed from clients and the surviving client still receives the frame', () => {
      const proxy = healthHeartbeatStartBrokerProxy();
      proxy.setupSnapshot({ uptimeSeconds: 120, version: '1.0.0' });
      const deadClient = WsClientStub({
        send: jest.fn(() => {
          throw new Error('client connection closed');
        }),
      });
      const clients = new Set<WsClient>([deadClient, proxy.captureClient]);

      healthHeartbeatStartBroker({ clients });
      proxy.triggerTick();

      expect(clients).toStrictEqual(new Set([proxy.captureClient]));
      expect(proxy.getCapturedMessages()).toStrictEqual([
        {
          type: 'health-status',
          payload: { status: 'ok', uptimeSeconds: 120, version: '1.0.0' },
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('teardown', () => {
    it('VALID: {stop} => a further tick produces no broadcast', () => {
      const proxy = healthHeartbeatStartBrokerProxy();
      proxy.setupSnapshot({ uptimeSeconds: 120, version: '1.0.0' });
      const clients = new Set<WsClient>([proxy.captureClient]);

      const { stop } = healthHeartbeatStartBroker({ clients });
      proxy.triggerTick();
      stop();
      proxy.triggerTick();

      expect(proxy.getCapturedMessages()).toStrictEqual([
        {
          type: 'health-status',
          payload: { status: 'ok', uptimeSeconds: 120, version: '1.0.0' },
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ]);
    });

    it('VALID: {stop} => clears the interval the broker registered', () => {
      const proxy = healthHeartbeatStartBrokerProxy();
      proxy.setupSnapshot({ uptimeSeconds: 120, version: '1.0.0' });
      const clients = new Set<WsClient>([proxy.captureClient]);

      const { stop } = healthHeartbeatStartBroker({ clients });
      stop();

      expect(proxy.getClearedTimerHandles()).toStrictEqual([0]);
    });
  });
});
