import { healthSnapshotBroker } from './health-snapshot-broker';
import { healthSnapshotBrokerProxy } from './health-snapshot-broker.proxy';

describe('healthSnapshotBroker', () => {
  it('VALID: {all sources healthy} => returns the exact 7-key snapshot', async () => {
    const proxy = healthSnapshotBrokerProxy();
    proxy.setupSnapshot({
      uptimeSeconds: 745,
      version: '0.1.0',
      port: 3737,
      home: '/home/user/.dungeonmaster',
      orchestrationMode: 'claude',
      timestamp: '2026-05-05T13:00:00.000Z',
    });

    const result = await healthSnapshotBroker();

    proxy.clearEnv();

    expect(result).toStrictEqual({
      status: 'ok',
      timestamp: '2026-05-05T13:00:00.000Z',
      uptimeSeconds: 745,
      version: '0.1.0',
      port: 3737,
      home: '/home/user/.dungeonmaster',
      orchestrationMode: 'claude',
    });
  });

  it('VALID: {orchestrationMode: "node", port: 4800} => those values reach the snapshot', async () => {
    const proxy = healthSnapshotBrokerProxy();
    proxy.setupSnapshot({
      uptimeSeconds: 12,
      version: '1.2.3',
      port: 4800,
      home: '/var/dungeonmaster-alt',
      orchestrationMode: 'node',
      timestamp: '2024-01-01T00:00:00.000Z',
    });

    const result = await healthSnapshotBroker();

    proxy.clearEnv();

    expect(result).toStrictEqual({
      status: 'ok',
      timestamp: '2024-01-01T00:00:00.000Z',
      uptimeSeconds: 12,
      version: '1.2.3',
      port: 4800,
      home: '/var/dungeonmaster-alt',
      orchestrationMode: 'node',
    });
  });

  it('ERROR: {version read throws} => rejects with that error', async () => {
    const proxy = healthSnapshotBrokerProxy();
    const error = new Error('version manifest corrupt');
    proxy.setupVersionFailure({ error });

    // No trailing clearEnv() — dungeonmasterHomeFindBroker() reads DUNGEONMASTER_HOME lazily when
    // the broker actually runs, so clearing beforehand would break the staged home lookup, and
    // clearing after would leave `jest/prefer-ending-with-an-expect` without its required last line.
    await expect(healthSnapshotBroker()).rejects.toThrow(/version manifest corrupt/u);
  });

  it('ERROR: {orchestration mode adapter throws} => rejects with that error', async () => {
    const proxy = healthSnapshotBrokerProxy();
    const error = new Error('orchestration mode fetch failed');
    proxy.setupModeFailure({ error });

    await expect(healthSnapshotBroker()).rejects.toThrow(/orchestration mode fetch failed/u);
  });
});
