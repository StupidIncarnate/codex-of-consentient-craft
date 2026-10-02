import { leaseTakeBroker } from './lease-take-broker';
import { leaseTakeBrokerProxy } from './lease-take-broker.proxy';

describe('leaseTakeBroker', () => {
  it('VALID: {tool: "ward", label, ownerPid} => inserts row with default starting state and null currentRssMB, returns leaseId', async () => {
    const proxy = leaseTakeBrokerProxy();
    const { database } = proxy.setupDatabase();
    proxy.setupUuid({ uuid: 'lease-test-uuid-1' });

    const fixedTime = 1_790_000_000_000;
    const leaseId = await leaseTakeBroker({
      tool: 'ward',
      label: '@dungeonmaster/web',
      ownerPid: 12345,
      nowMs: fixedTime,
    });

    const rawRows = database
      .prepare('SELECT * FROM leases WHERE lease_id = ?')
      .all('lease-test-uuid-1');
    const rows = rawRows.map((row) => ({ ...row }));

    expect(leaseId).toBe('lease-test-uuid-1');
    expect(rows).toStrictEqual([
      {
        lease_id: 'lease-test-uuid-1',
        tool: 'ward',
        label: '@dungeonmaster/web',
        owner_pid: 12345,
        state: 'starting',
        expected_peak_mb: null,
        current_rss_mb: null,
        started_at_ms: fixedTime,
        last_beat_ms: fixedTime,
      },
    ]);
  });

  it('VALID: {expectedPeakMB: 1024, nowMs} => inserts row with explicit expectedPeakMB and nowMs', async () => {
    const proxy = leaseTakeBrokerProxy();
    const { database } = proxy.setupDatabase();
    proxy.setupUuid({ uuid: 'lease-test-uuid-2' });

    const fixedTime = 1_790_100_000_000;
    const leaseId = await leaseTakeBroker({
      tool: 'siegelense',
      label: 'instance-lane-4',
      ownerPid: 67890,
      expectedPeakMB: 1024,
      nowMs: fixedTime,
    });

    const rawRows = database
      .prepare('SELECT * FROM leases WHERE lease_id = ?')
      .all('lease-test-uuid-2');
    const rows = rawRows.map((row) => ({ ...row }));

    expect(leaseId).toBe('lease-test-uuid-2');
    expect(rows).toStrictEqual([
      {
        lease_id: 'lease-test-uuid-2',
        tool: 'siegelense',
        label: 'instance-lane-4',
        owner_pid: 67890,
        state: 'starting',
        expected_peak_mb: 1024,
        current_rss_mb: null,
        started_at_ms: fixedTime,
        last_beat_ms: fixedTime,
      },
    ]);
  });

  it('VALID: {expectedPeakMB: null} => inserts row with null expectedPeakMB', async () => {
    const proxy = leaseTakeBrokerProxy();
    const { database } = proxy.setupDatabase();
    proxy.setupUuid({ uuid: 'lease-test-uuid-3' });

    const fixedTime = 1_790_200_000_000;
    const leaseId = await leaseTakeBroker({
      tool: 'ward',
      label: '@dungeonmaster/orchestrator',
      ownerPid: 54321,
      expectedPeakMB: null,
      nowMs: fixedTime,
    });

    const rawRows = database
      .prepare('SELECT * FROM leases WHERE lease_id = ?')
      .all('lease-test-uuid-3');
    const rows = rawRows.map((row) => ({ ...row }));

    expect(leaseId).toBe('lease-test-uuid-3');
    expect(rows).toStrictEqual([
      {
        lease_id: 'lease-test-uuid-3',
        tool: 'ward',
        label: '@dungeonmaster/orchestrator',
        owner_pid: 54321,
        state: 'starting',
        expected_peak_mb: null,
        current_rss_mb: null,
        started_at_ms: fixedTime,
        last_beat_ms: fixedTime,
      },
    ]);
  });

  it('EMPTY: {nowMs: undefined} => defaults timestamp to Date.now()', async () => {
    const proxy = leaseTakeBrokerProxy();
    const { database } = proxy.setupDatabase();
    proxy.setupUuid({ uuid: 'lease-test-uuid-4' });

    const leaseId = await leaseTakeBroker({
      tool: 'ward',
      label: '@dungeonmaster/core',
      ownerPid: 11111,
    });

    const rawRows = database
      .prepare('SELECT * FROM leases WHERE lease_id = ?')
      .all('lease-test-uuid-4');
    const rows = rawRows.map((row) => ({ ...row }));

    expect(leaseId).toBe('lease-test-uuid-4');
    expect(rows).toStrictEqual([
      {
        lease_id: 'lease-test-uuid-4',
        tool: 'ward',
        label: '@dungeonmaster/core',
        owner_pid: 11111,
        state: 'starting',
        expected_peak_mb: null,
        current_rss_mb: null,
        started_at_ms: rows[0]?.started_at_ms,
        last_beat_ms: rows[0]?.last_beat_ms,
      },
    ]);
    expect(rows[0]?.started_at_ms).toBe(rows[0]?.last_beat_ms);
  });
});
