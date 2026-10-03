import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from '#gateway/node/fs';
import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { pid } from '#gateway/node/process';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import type { DiskItemStub } from '../../../contracts/disk-item/disk-item.stub';
import { diskScanBroker } from './disk-scan-broker';

type DiskItem = ReturnType<typeof DiskItemStub>;

describe('diskScanBroker integration', () => {
  it('VALID: {testbed} => correctly inventories items, calculates sizes without following symlinks, and sets protections', async () => {
    const testbed = mkdtempSync(join(tmpdir(), 'dm-disk-scan-testbed-'));
    const fakeRepo = join(testbed, 'repo');
    const fakeTmp = join(testbed, 'tmp');
    const outsideDir = join(testbed, 'outside');

    mkdirSync(fakeRepo, { recursive: true });
    mkdirSync(fakeTmp, { recursive: true });
    mkdirSync(outsideDir, { recursive: true });

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
    utimesSync(run3, 300, 300);

    const currentPid = pid;
    const liveDir = join(fakeTmp, `dm-e2e-${currentPid}`);
    mkdirSync(liveDir, { recursive: true });
    writeFileSync(join(liveDir, 'live.txt'), 'live-data');

    const deadDir = join(fakeTmp, 'dm-e2e-999999');
    mkdirSync(deadDir, { recursive: true });
    writeFileSync(join(deadDir, 'dead.txt'), 'dead-data');

    const outsideFile = join(outsideDir, 'large.bin');
    writeFileSync(outsideFile, 'X'.repeat(50_000));
    symlinkSync({ target: outsideFile, path: join(liveDir, 'link_to_large') });

    const result = await diskScanBroker({
      repoRoots: [fakeRepo],
      tmpDir: fakeTmp,
    });

    rmSync(testbed, { recursive: true, force: true });

    const runItems = result.items.filter((item: DiskItem) => item.storeId === 'ward-run-results');
    const runPaths = runItems.map((item: DiskItem) => item.path).sort();

    expect(runPaths).toStrictEqual([run1, run2, run3].sort());

    const newestItem = runItems.find((item: DiskItem) => item.path === run3);
    const olderItems = runItems.filter((item: DiskItem) => item.path !== run3);

    expect(newestItem?.protectedReason).toBe('newest-per-repo');
    expect(olderItems.map((i: DiskItem) => i.protectedReason)).toStrictEqual([null, null]);

    const liveItem = result.items.find((item: DiskItem) => item.path === liveDir);

    expect(liveItem?.protectedReason).toBe(`pid-alive:${currentPid}`);

    const deadItem = result.items.find((item: DiskItem) => item.path === deadDir);

    expect(deadItem?.protectedReason).toBe(null);

    expect(liveItem?.bytes).toBe(9 + outsideFile.length);
    expect(deadItem?.bytes).toBe(9);
    expect(result.skipped).toBe(0);
  });
});
