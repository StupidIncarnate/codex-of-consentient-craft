/**
 * PURPOSE: Creates and removes a uniquely-named, non-hidden marker directory directly under the
 * REAL `os.homedir()` — sandboxed for the whole jest run by `jest.setup-global.js`, so this never
 * touches a developer's own home. `directoryBrowseBroker`'s default (no `path` argument) resolves
 * through `homedir()` (`#gateway/node/os`), and the one integration test that drives it with no path
 * needs something deterministic under that directory to find — the ambient home is otherwise empty
 * in a sandboxed run and unpredictable outside one. A test scenario file may not import
 * `node:fs`/`node:os` directly (`ban-node-builtins-in-test-scenarios`), so this harness is the door
 * through.
 *
 * USAGE:
 * const marker = homeDirectoryMarkerHarness();
 * const { name, path } = await marker.create();
 * // ...call the code under test...
 * marker.cleanup({ path });
 */
import { ensureDirSync, rmSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';

import { fileNameContract, type FileName } from '@dungeonmaster/shared/contracts';
import { homedir } from '#gateway/node/os';
import { pid } from '#gateway/node/process';

const MARKER_PREFIX = 'directory-flow-default-path-marker-';

export const homeDirectoryMarkerHarness = (): {
  create: () => Promise<{ name: FileName; path: string }>;
  cleanup: (params: { path: string }) => void;
} => ({
  // Async only to satisfy `ban-sync-seeding-methods`, which requires every harness seeding method
  // to return a Promise — the write itself (ensureDirSync) stays synchronous, same as
  // `orchestrationEnvironmentHarness.seedHome`.
  create: async (): Promise<{ name: FileName; path: string }> => {
    await Promise.resolve();
    const name = fileNameContract.parse(`${MARKER_PREFIX}${String(pid)}`);
    const markerPath = join(homedir(), name);
    ensureDirSync(markerPath);
    return { name, path: markerPath };
  },
  cleanup: ({ path }: { path: string }): void => {
    rmSync(path, { recursive: true, force: true });
  },
});
