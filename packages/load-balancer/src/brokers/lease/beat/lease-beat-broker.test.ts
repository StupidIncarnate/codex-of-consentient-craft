import { leaseBeatBroker } from './lease-beat-broker';
import { leaseBeatBrokerProxy } from './lease-beat-broker.proxy';

describe('leaseBeatBroker', () => {
  it('VALID: {leaseId, currentRssMB: 256, state: "running", nowMs} => updates last_beat_ms, current_rss_mb, and state', async () => {
    const proxy = leaseBeatBrokerProxy();
    const { database } = proxy.setupDatabase();

    const insertStatement = database.prepare(
      'INSERT INTO leases (lease_id, tool, label, owner_pid, state, expected_peak_mb, current_rss_mb, started_at_ms, last_beat_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
    );
    insertStatement.run(
      'lease-beat-1',
      'ward',
      '@dungeonmaster/web',
      1234,
      'starting',
      512,
      null,
      1_790_000_000_000,
      1_790_000_000_000,
    );

    const beatTime = 1_790_000_005_000;
    await leaseBeatBroker({
      leaseId: 'lease-beat-1',
      currentRssMB: 256,
      state: 'running',
      nowMs: beatTime,
    });

    const rawRows = database
      .prepare('SELECT * FROM leases WHERE lease_id = ?;')
      .all('lease-beat-1');
    const rows = rawRows.map((row) => ({ ...row }));

    expect(rows).toStrictEqual([
      {
        lease_id: 'lease-beat-1',
        tool: 'ward',
        label: '@dungeonmaster/web',
        owner_pid: 1234,
        state: 'running',
        expected_peak_mb: 512,
        current_rss_mb: 256,
        started_at_ms: 1_790_000_000_000,
        last_beat_ms: beatTime,
      },
    ]);
  });

  it('VALID: {leaseId, state: "starting", nowMs} => updates last_beat_ms and state without touching current_rss_mb', async () => {
    const proxy = leaseBeatBrokerProxy();
    const { database } = proxy.setupDatabase();

    const insertStatement = database.prepare(
      'INSERT INTO leases (lease_id, tool, label, owner_pid, state, expected_peak_mb, current_rss_mb, started_at_ms, last_beat_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
    );
    insertStatement.run(
      'lease-beat-2',
      'siegelense',
      'lane-1',
      5678,
      'starting',
      1024,
      500,
      1_790_000_000_000,
      1_790_000_000_000,
    );

    const beatTime = 1_790_000_010_000;
    await leaseBeatBroker({
      leaseId: 'lease-beat-2',
      state: 'starting',
      nowMs: beatTime,
    });

    const rawRows = database
      .prepare('SELECT * FROM leases WHERE lease_id = ?;')
      .all('lease-beat-2');
    const rows = rawRows.map((row) => ({ ...row }));

    expect(rows).toStrictEqual([
      {
        lease_id: 'lease-beat-2',
        tool: 'siegelense',
        label: 'lane-1',
        owner_pid: 5678,
        state: 'starting',
        expected_peak_mb: 1024,
        current_rss_mb: 500,
        started_at_ms: 1_790_000_000_000,
        last_beat_ms: beatTime,
      },
    ]);
  });

  it('VALID: {leaseId, currentRssMB: null, nowMs} => updates current_rss_mb to null and state defaults to running', async () => {
    const proxy = leaseBeatBrokerProxy();
    const { database } = proxy.setupDatabase();

    const insertStatement = database.prepare(
      'INSERT INTO leases (lease_id, tool, label, owner_pid, state, expected_peak_mb, current_rss_mb, started_at_ms, last_beat_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
    );
    insertStatement.run(
      'lease-beat-3',
      'ward',
      '@dungeonmaster/shared',
      9012,
      'starting',
      null,
      300,
      1_790_000_000_000,
      1_790_000_000_000,
    );

    const beatTime = 1_790_000_015_000;
    await leaseBeatBroker({
      leaseId: 'lease-beat-3',
      currentRssMB: null,
      nowMs: beatTime,
    });

    const rawRows = database
      .prepare('SELECT * FROM leases WHERE lease_id = ?;')
      .all('lease-beat-3');
    const rows = rawRows.map((row) => ({ ...row }));

    expect(rows).toStrictEqual([
      {
        lease_id: 'lease-beat-3',
        tool: 'ward',
        label: '@dungeonmaster/shared',
        owner_pid: 9012,
        state: 'running',
        expected_peak_mb: null,
        current_rss_mb: null,
        started_at_ms: 1_790_000_000_000,
        last_beat_ms: beatTime,
      },
    ]);
  });

  it('EMPTY: {nowMs: undefined} => defaults timestamp to Date.now()', async () => {
    const proxy = leaseBeatBrokerProxy();
    const { database } = proxy.setupDatabase();

    const insertStatement = database.prepare(
      'INSERT INTO leases (lease_id, tool, label, owner_pid, state, expected_peak_mb, current_rss_mb, started_at_ms, last_beat_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
    );
    insertStatement.run(
      'lease-beat-4',
      'ward',
      '@dungeonmaster/test',
      4444,
      'starting',
      null,
      null,
      1_790_000_000_000,
      1_790_000_000_000,
    );

    await leaseBeatBroker({
      leaseId: 'lease-beat-4',
    });

    const rawRows = database
      .prepare('SELECT * FROM leases WHERE lease_id = ?;')
      .all('lease-beat-4');
    const rows = rawRows.map((row) => ({ ...row }));

    expect(rows).toStrictEqual([
      {
        lease_id: 'lease-beat-4',
        tool: 'ward',
        label: '@dungeonmaster/test',
        owner_pid: 4444,
        state: 'running',
        expected_peak_mb: null,
        current_rss_mb: null,
        started_at_ms: 1_790_000_000_000,
        last_beat_ms: rows[0]?.last_beat_ms,
      },
    ]);
  });

  it('EDGE: {nonExistentLeaseId} => executes without error and does not throw', async () => {
    const proxy = leaseBeatBrokerProxy();
    const { database } = proxy.setupDatabase();

    await expect(
      leaseBeatBroker({
        leaseId: 'non-existent-lease',
        currentRssMB: 128,
        state: 'running',
        nowMs: 1_790_000_020_000,
      }),
    ).resolves.toBe(undefined);

    const rawRows = database
      .prepare('SELECT * FROM leases WHERE lease_id = ?;')
      .all('non-existent-lease');

    expect(rawRows).toStrictEqual([]);
  });
});
