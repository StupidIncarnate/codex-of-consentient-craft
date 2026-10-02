import { mkdtempSync, rmSync } from '#gateway/node/fs';
import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { deleteEnv, pid, setEnv } from '#gateway/node/process';
import { loadBalancerStatics } from '../../../statics/load-balancer/load-balancer-statics';
import { registryOpenBroker } from '../../registry/open/registry-open-broker';
import { leaseReleaseBroker } from '../release/lease-release-broker';
import { leaseTakeBroker } from '../take/lease-take-broker';
import { leaseListLiveBroker } from './lease-list-live-broker';

describe('leaseListLiveBroker integration', () => {
  it('VALID: {live, dead, stale leases} => returns only live lease, cleans up dead and stale, then releases', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'load-balancer-lease-integration-test-'));
    setEnv(loadBalancerStatics.registry.dirEnvVar, tempDir);

    const baseNow = 1_790_500_000_000;

    const leaseId1 = await leaseTakeBroker({
      tool: 'ward',
      label: 'pkg-live',
      ownerPid: pid,
      expectedPeakMB: 512,
      nowMs: baseNow,
    });

    const leaseId2 = await leaseTakeBroker({
      tool: 'ward',
      label: 'pkg-dead',
      ownerPid: 99_999_999,
      expectedPeakMB: 256,
      nowMs: baseNow,
    });

    const leaseId3 = await leaseTakeBroker({
      tool: 'siegelense',
      label: 'lane-stale',
      ownerPid: pid,
      expectedPeakMB: 1024,
      nowMs: baseNow - 60_000,
    });

    const liveLeases = await leaseListLiveBroker({ nowMs: baseNow });

    expect(liveLeases).toStrictEqual([
      {
        leaseId: leaseId1,
        tool: 'ward',
        label: 'pkg-live',
        ownerPid: pid,
        state: 'starting',
        expectedPeakMB: 512,
        currentRssMB: null,
        startedAtMs: baseNow,
        lastBeatMs: baseNow,
      },
    ]);

    const database = registryOpenBroker();
    const rawRows = database.prepare('SELECT lease_id FROM leases ORDER BY lease_id ASC;').all();
    const rows = rawRows.map((row) => ({ ...row }));

    expect(rows).toStrictEqual([{ lease_id: leaseId1 }]);

    const cleanedUpRows = database
      .prepare('SELECT lease_id FROM leases WHERE lease_id IN (?, ?);')
      .all(leaseId2, leaseId3);

    expect(cleanedUpRows).toStrictEqual([]);

    await leaseReleaseBroker({ leaseId: leaseId1 });

    const afterReleaseLeases = await leaseListLiveBroker({ nowMs: baseNow });

    expect(afterReleaseLeases).toStrictEqual([]);

    const rawEmptyRows = database.prepare('SELECT * FROM leases;').all();

    database.close();
    deleteEnv(loadBalancerStatics.registry.dirEnvVar);
    rmSync(tempDir, { recursive: true, force: true });

    expect(rawEmptyRows).toStrictEqual([]);
  });
});
