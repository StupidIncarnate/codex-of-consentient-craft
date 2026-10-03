import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from '#gateway/node/fs';
import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { deleteEnv, setEnv } from '#gateway/node/process';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { loadBalancerStatics } from '../../../statics/load-balancer/load-balancer-statics';
import { diskBudgetEnforceBroker } from './disk-budget-enforce-broker';

describe('diskBudgetEnforceBroker integration', () => {
  it('VALID: {testbed} => enforces budget, respects protections, rate limits, mode: all, and skips unsafe symlinks', async () => {
    const testbed = mkdtempSync(join(tmpdir(), 'dm-disk-enforce-testbed-'));
    const fakeLoadDir = join(testbed, 'load');
    const fakeRepo = join(testbed, 'repo');
    const fakeTmp = join(testbed, 'tmp');
    const fakeHome = join(testbed, 'home');
    const outsideDir = join(testbed, 'outside');

    mkdirSync(fakeLoadDir, { recursive: true });
    mkdirSync(fakeRepo, { recursive: true });
    mkdirSync(fakeTmp, { recursive: true });
    mkdirSync(fakeHome, { recursive: true });
    mkdirSync(outsideDir, { recursive: true });

    setEnv(loadBalancerStatics.registry.dirEnvVar, fakeLoadDir);
    setEnv('DUNGEONMASTER_TMP_DIR', fakeTmp);
    setEnv('DUNGEONMASTER_HOME', fakeHome);

    const wardDir = join(fakeRepo, locationsStatics.repoRoot.wardLocalDir);
    mkdirSync(wardDir, { recursive: true });

    const run1 = join(wardDir, 'run-1.json');
    const run2 = join(wardDir, 'run-2.json');
    const run3 = join(wardDir, 'run-3.json');

    writeFileSync(run1, '{"run": 1}');
    writeFileSync(run2, '{"run": 2}');
    writeFileSync(run3, '{"run": 3}');

    utimesSync(run1, 100, 100);
    utimesSync(run2, 200, 200);
    // Setting run3 mtime to 2 billion seconds guarantees it is newer than the symlink created at current time (~1.79B s)
    utimesSync(run3, 2_000_000_000, 2_000_000_000);

    const outsideFile = join(outsideDir, 'large.bin');
    writeFileSync(outsideFile, 'X'.repeat(50_000));
    const runSymlink = join(wardDir, 'run-4-symlink.json');
    symlinkSync({ target: outsideFile, path: runSymlink });

    // 3 billion seconds in milliseconds
    const firstRunMs = 3_000_000_000_000;
    const firstResult = await diskBudgetEnforceBroker({
      currentRepoRoot: fakeRepo,
      maxDiskMB: 0,
      mode: 'default',
      nowMs: firstRunMs,
    });

    expect(firstResult.ran).toBe(true);
    expect(existsSync(run1)).toBe(false);
    expect(existsSync(run2)).toBe(false);
    expect(existsSync(run3)).toBe(true);

    const secondRunMs = firstRunMs + 1000;
    const secondResult = await diskBudgetEnforceBroker({
      currentRepoRoot: fakeRepo,
      mode: 'default',
      nowMs: secondRunMs,
    });

    expect(secondResult).toStrictEqual({
      ran: false,
      deletedBytes: 0,
      deletedCount: 0,
      shortfallBytes: 0,
      skipped: 0,
      scannedItems: [],
      deletedItems: [],
    });

    const thirdRunMs = secondRunMs + 1000;
    const thirdResult = await diskBudgetEnforceBroker({
      currentRepoRoot: fakeRepo,
      mode: 'all',
      nowMs: thirdRunMs,
    });

    expect(thirdResult.ran).toBe(true);

    deleteEnv(loadBalancerStatics.registry.dirEnvVar);
    deleteEnv('DUNGEONMASTER_TMP_DIR');
    deleteEnv('DUNGEONMASTER_HOME');
    const outsideFileStillExists = existsSync(outsideFile);
    rmSync(testbed, { recursive: true, force: true });

    expect(outsideFileStillExists).toBe(true);
  });
});
