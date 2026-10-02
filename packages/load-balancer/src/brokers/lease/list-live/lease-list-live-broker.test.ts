import { leaseListLiveBroker } from './lease-list-live-broker';
import { leaseListLiveBrokerProxy } from './lease-list-live-broker.proxy';

describe('leaseListLiveBroker', () => {
  it('VALID: {live lease} => returns lease in contract shape and keeps row in registry', async () => {
    const proxy = leaseListLiveBrokerProxy();
    const { database } = proxy.setupDatabase();
    proxy.setupProcessAlive({ pid: 1001 });

    const insertStatement = database.prepare(
      'INSERT INTO leases (lease_id, tool, label, owner_pid, state, expected_peak_mb, current_rss_mb, started_at_ms, last_beat_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
    );
    insertStatement.run(
      'lease-live-1',
      'ward',
      '@dungeonmaster/web',
      1001,
      'running',
      512,
      256,
      1_790_000_000_000,
      1_790_000_000_000,
    );

    const leases = await leaseListLiveBroker({ nowMs: 1_790_000_005_000 });

    expect(leases).toStrictEqual([
      {
        leaseId: 'lease-live-1',
        tool: 'ward',
        label: '@dungeonmaster/web',
        ownerPid: 1001,
        state: 'running',
        expectedPeakMB: 512,
        currentRssMB: 256,
        startedAtMs: 1_790_000_000_000,
        lastBeatMs: 1_790_000_000_000,
      },
    ]);

    const remainingRows = database
      .prepare('SELECT lease_id FROM leases WHERE lease_id = ?;')
      .all('lease-live-1');
    const rows = remainingRows.map((row) => ({ ...row }));

    expect(rows).toStrictEqual([{ lease_id: 'lease-live-1' }]);
  });

  it('VALID: {live lease with EPERM} => considers process alive and returns lease', async () => {
    const proxy = leaseListLiveBrokerProxy();
    const { database } = proxy.setupDatabase();
    proxy.setupProcessPermissionDenied({ pid: 1002 });

    const insertStatement = database.prepare(
      'INSERT INTO leases (lease_id, tool, label, owner_pid, state, expected_peak_mb, current_rss_mb, started_at_ms, last_beat_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
    );
    insertStatement.run(
      'lease-eperm-1',
      'siegelense',
      'lane-isolated',
      1002,
      'starting',
      1024,
      null,
      1_790_000_000_000,
      1_790_000_010_000,
    );

    const leases = await leaseListLiveBroker({ nowMs: 1_790_000_015_000 });

    expect(leases).toStrictEqual([
      {
        leaseId: 'lease-eperm-1',
        tool: 'siegelense',
        label: 'lane-isolated',
        ownerPid: 1002,
        state: 'starting',
        expectedPeakMB: 1024,
        currentRssMB: null,
        startedAtMs: 1_790_000_000_000,
        lastBeatMs: 1_790_000_010_000,
      },
    ]);
  });

  it('VALID: {dead process (ESRCH)} => deletes row and does not return lease', async () => {
    const proxy = leaseListLiveBrokerProxy();
    const { database } = proxy.setupDatabase();
    proxy.setupProcessDead({ pid: 1003 });

    const insertStatement = database.prepare(
      'INSERT INTO leases (lease_id, tool, label, owner_pid, state, expected_peak_mb, current_rss_mb, started_at_ms, last_beat_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
    );
    insertStatement.run(
      'lease-dead-1',
      'ward',
      '@dungeonmaster/shared',
      1003,
      'running',
      256,
      128,
      1_790_000_000_000,
      1_790_000_005_000,
    );

    const leases = await leaseListLiveBroker({ nowMs: 1_790_000_010_000 });

    expect(leases).toStrictEqual([]);

    const remainingRows = database
      .prepare('SELECT lease_id FROM leases WHERE lease_id = ?;')
      .all('lease-dead-1');

    expect(remainingRows).toStrictEqual([]);
  });

  it('VALID: {stale heartbeat (> 30000ms)} => deletes row and does not return lease', async () => {
    const proxy = leaseListLiveBrokerProxy();
    const { database } = proxy.setupDatabase();
    proxy.setupProcessAlive({ pid: 1004 });

    const insertStatement = database.prepare(
      'INSERT INTO leases (lease_id, tool, label, owner_pid, state, expected_peak_mb, current_rss_mb, started_at_ms, last_beat_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
    );
    insertStatement.run(
      'lease-stale-1',
      'ward',
      '@dungeonmaster/orchestrator',
      1004,
      'running',
      512,
      256,
      1_790_000_000_000,
      1_790_000_000_000,
    );

    const leases = await leaseListLiveBroker({ nowMs: 1_790_000_030_001 });

    expect(leases).toStrictEqual([]);

    const remainingRows = database
      .prepare('SELECT lease_id FROM leases WHERE lease_id = ?;')
      .all('lease-stale-1');

    expect(remainingRows).toStrictEqual([]);
  });

  it('VALID: {dead process and stale} => deletes row and does not return lease', async () => {
    const proxy = leaseListLiveBrokerProxy();
    const { database } = proxy.setupDatabase();
    proxy.setupProcessDead({ pid: 1005 });

    const insertStatement = database.prepare(
      'INSERT INTO leases (lease_id, tool, label, owner_pid, state, expected_peak_mb, current_rss_mb, started_at_ms, last_beat_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
    );
    insertStatement.run(
      'lease-both-1',
      'ward',
      '@dungeonmaster/config',
      1005,
      'running',
      null,
      null,
      1_790_000_000_000,
      1_790_000_000_000,
    );

    const leases = await leaseListLiveBroker({ nowMs: 1_790_000_050_000 });

    expect(leases).toStrictEqual([]);

    const remainingRows = database
      .prepare('SELECT lease_id FROM leases WHERE lease_id = ?;')
      .all('lease-both-1');

    expect(remainingRows).toStrictEqual([]);
  });

  it('EMPTY: {empty leases table} => returns empty array', async () => {
    const proxy = leaseListLiveBrokerProxy();
    proxy.setupDatabase();

    const leases = await leaseListLiveBroker();

    expect(leases).toStrictEqual([]);
  });

  it('ERROR: {kill throws unrecognised error} => re-throws unexpected error', async () => {
    const proxy = leaseListLiveBrokerProxy();
    const { database } = proxy.setupDatabase();
    proxy.setupProcessThrowsUnknown({ pid: 1006 });

    const insertStatement = database.prepare(
      'INSERT INTO leases (lease_id, tool, label, owner_pid, state, expected_peak_mb, current_rss_mb, started_at_ms, last_beat_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
    );
    insertStatement.run(
      'lease-err-1',
      'ward',
      '@dungeonmaster/fail',
      1006,
      'running',
      null,
      null,
      1_790_000_000_000,
      1_790_000_000_000,
    );

    await expect(leaseListLiveBroker({ nowMs: 1_790_000_005_000 })).rejects.toThrow(
      /^kill EINVAL$/u,
    );
  });
});
