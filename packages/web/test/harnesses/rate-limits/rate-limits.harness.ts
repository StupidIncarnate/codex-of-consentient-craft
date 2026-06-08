/**
 * PURPOSE: Writes/deletes the rate-limits.json snapshot inside the e2e DUNGEONMASTER_HOME so the orchestrator's watcher reacts and the web cards update
 *
 * USAGE:
 * const rateLimits = rateLimitsHarness();
 * rateLimits.writeSnapshot({ snapshot });
 * rateLimits.clearSnapshot();
 */
import * as fs from 'fs';
import * as path from 'path';

import type { FilePath, RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

const SNAPSHOT_FILENAME = 'rate-limits.json';

const resolveSnapshotPath = (): FilePath => {
  const home = process.env.E2E_TEST_HOME ?? process.env.DUNGEONMASTER_HOME;
  if (typeof home !== 'string' || home === '') {
    throw new Error(
      'rate-limits harness: neither E2E_TEST_HOME nor DUNGEONMASTER_HOME is set in the e2e environment',
    );
  }
  return FilePathStub({ value: path.join(home, SNAPSHOT_FILENAME) });
};

export const rateLimitsHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  writeSnapshot: ({ snapshot }: { snapshot: RateLimitsSnapshot }) => void;
  clearSnapshot: () => void;
} => ({
  beforeEach: (): void => {
    const snapshotPath = resolveSnapshotPath();
    fs.rmSync(snapshotPath, { force: true });
  },

  afterEach: (): void => {
    const snapshotPath = resolveSnapshotPath();
    fs.rmSync(snapshotPath, { force: true });
  },

  writeSnapshot: ({ snapshot }: { snapshot: RateLimitsSnapshot }): void => {
    const snapshotPath = resolveSnapshotPath();
    fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));
  },

  clearSnapshot: (): void => {
    const snapshotPath = resolveSnapshotPath();
    fs.rmSync(snapshotPath, { force: true });
  },
});
