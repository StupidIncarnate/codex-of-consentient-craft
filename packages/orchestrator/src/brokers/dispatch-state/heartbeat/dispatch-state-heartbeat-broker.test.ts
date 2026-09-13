import { DispatchHoldStub, DispatchStateStub } from '@dungeonmaster/shared/contracts';

import { dispatchStateHeartbeatBroker } from './dispatch-state-heartbeat-broker';
import { dispatchStateHeartbeatBrokerProxy } from './dispatch-state-heartbeat-broker.proxy';

describe('dispatchStateHeartbeatBroker', () => {
  it('VALID: {current mode: paused} => writes heartbeat preserving paused mode', async () => {
    const proxy = dispatchStateHeartbeatBrokerProxy();
    proxy.setupCurrentState({ json: JSON.stringify(DispatchStateStub()) });

    const result = await dispatchStateHeartbeatBroker();

    expect(result).toStrictEqual(
      DispatchStateStub({
        mode: 'paused',
        mcpHeartbeatAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      }),
    );
  });

  it('VALID: {current mode: node-playing} => writes heartbeat preserving node-playing mode', async () => {
    const proxy = dispatchStateHeartbeatBrokerProxy();
    proxy.setupCurrentState({
      json: JSON.stringify(DispatchStateStub({ mode: 'node-playing' })),
    });

    const result = await dispatchStateHeartbeatBroker();

    expect(result).toStrictEqual(
      DispatchStateStub({
        mode: 'node-playing',
        mcpHeartbeatAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      }),
    );
  });

  it('VALID: {a live hold} => is carried through, so an MCP poll cannot lift the guardrail', async () => {
    const proxy = dispatchStateHeartbeatBrokerProxy();
    proxy.setupCurrentState({
      json: JSON.stringify(DispatchStateStub({ hold: DispatchHoldStub() })),
    });

    const result = await dispatchStateHeartbeatBroker();

    expect(result).toStrictEqual(
      DispatchStateStub({
        mode: 'paused',
        mcpHeartbeatAt: '2024-01-15T10:00:00.000Z',
        hold: DispatchHoldStub(),
        updatedAt: '2024-01-15T10:00:00.000Z',
      }),
    );
  });

  it('EMPTY: {no hold on disk} => writes none, rather than a null the reader treats as cleared', async () => {
    const proxy = dispatchStateHeartbeatBrokerProxy();
    proxy.setupCurrentState({ json: JSON.stringify(DispatchStateStub()) });

    await dispatchStateHeartbeatBroker();

    expect(JSON.parse(String(proxy.getWrittenContent()))).toStrictEqual({
      mode: 'paused',
      mcpHeartbeatAt: '2024-01-15T10:00:00.000Z',
      updatedAt: '2024-01-15T10:00:00.000Z',
    });
  });

  it('EMPTY: {state file missing} => writes heartbeat onto the paused default', async () => {
    const proxy = dispatchStateHeartbeatBrokerProxy();
    proxy.setupMissingStateFile();

    const result = await dispatchStateHeartbeatBroker();

    expect(result).toStrictEqual(
      DispatchStateStub({
        mode: 'paused',
        mcpHeartbeatAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      }),
    );
  });
});
