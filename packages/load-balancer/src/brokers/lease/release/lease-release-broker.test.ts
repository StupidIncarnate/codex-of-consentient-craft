import { leaseReleaseBroker } from './lease-release-broker';
import { leaseReleaseBrokerProxy } from './lease-release-broker.proxy';

describe('leaseReleaseBroker', () => {
  it('VALID: {leaseId} => deletes existing lease from the registry', async () => {
    const proxy = leaseReleaseBrokerProxy();
    const { database } = proxy.setupDatabase();

    const insertStatement = database.prepare(
      'INSERT INTO leases (lease_id, tool, label, owner_pid, state, expected_peak_mb, current_rss_mb, started_at_ms, last_beat_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
    );
    insertStatement.run(
      'lease-release-1',
      'ward',
      '@dungeonmaster/web',
      1234,
      'running',
      512,
      256,
      1_790_000_000_000,
      1_790_000_000_000,
    );
    insertStatement.run(
      'lease-keep-2',
      'siegelense',
      'lane-1',
      5678,
      'running',
      1024,
      500,
      1_790_000_000_000,
      1_790_000_000_000,
    );

    await leaseReleaseBroker({ leaseId: 'lease-release-1' });

    const rawRows = database.prepare('SELECT lease_id FROM leases ORDER BY lease_id ASC;').all();
    const rows = rawRows.map((row) => ({ ...row }));

    expect(rows).toStrictEqual([{ lease_id: 'lease-keep-2' }]);
  });

  it('EDGE: {nonExistentLeaseId} => executes without error and does not throw', async () => {
    const proxy = leaseReleaseBrokerProxy();
    const { database } = proxy.setupDatabase();

    await expect(leaseReleaseBroker({ leaseId: 'non-existent-lease' })).resolves.toBe(undefined);

    const rawRows = database.prepare('SELECT * FROM leases;').all();

    expect(rawRows).toStrictEqual([]);
  });
});
