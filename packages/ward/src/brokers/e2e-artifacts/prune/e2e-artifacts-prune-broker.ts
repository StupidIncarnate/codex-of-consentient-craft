/**
 * PURPOSE: Reclaims per-run e2e artifacts that outlived the run that made them. Reach for this at
 * the START of a ward invocation; the sibling remove broker handles the ordinary end-of-run case,
 * and this one is the backstop for every run that never reached it — a SIGKILL, a Ctrl-C, a CI job
 * cancelled mid-suite. Measured on this repo before it existed: 3,048 leaked directories, about
 * 50 GB, oldest five months old.
 *
 * TWO THINGS STOP IT TAKING SOMETHING IT SHOULD NOT, and neither is optional.
 *
 * A bound port is proof a run owns the artifact. Ports RECUR, so the OS can hand a fresh run a port
 * whose stale directory is still on disk, and for the seconds before that run's server writes to it
 * the directory still reads as abandoned. Deleting it there kills a run already under way, and the
 * symptom names nothing that leads back here.
 *
 * Each entry is deleted inside its OWN catch. Four browser walks sweep one directory at once, so
 * two processes racing for the same path is the common case rather than the edge one — and a single
 * try around the whole loop would abandon every remaining deletion on the first collision, which
 * looks like it is working while the disk still fills.
 *
 * USAGE:
 * await e2eArtifactsPruneBroker({ packageRoot });
 * // Removes stale port-named artifacts under that package; a package with none is a no-op
 */

import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';
import { networkPortContract } from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { fsRmAdapter } from '../../../adapters/fs/rm/fs-rm-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { netPortInUseAdapter } from '../../../adapters/net/port-in-use/net-port-in-use-adapter';
import { isPortSuffixedArtifactGuard } from '../../../guards/is-port-suffixed-artifact/is-port-suffixed-artifact-guard';
import { e2eArtifactsStatics } from '../../../statics/e2e-artifacts/e2e-artifacts-statics';

export const e2eArtifactsPruneBroker = async ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  const now = Date.now();

  await Promise.all(
    e2eArtifactsStatics.artifacts.map(async (artifact) => {
      const parentPath = filePathContract.parse(`${String(packageRoot)}/${artifact.parentDir}`);

      // Per PREFIX, not per sweep. A package with no test-results/ must not stop the vite cache
      // under node_modules/ being swept.
      const entries = await fsReaddirAdapter({ dirPath: parentPath }).catch(() => []);

      const candidates = entries.filter((entry) =>
        isPortSuffixedArtifactGuard({
          name: String(entry),
          prefix: artifact.prefix,
          suffix: artifact.suffix,
        }),
      );

      await Promise.all(
        candidates.map(async (entry) => {
          const name = String(entry);
          const entryPath = filePathContract.parse(`${String(parentPath)}/${name}`);

          try {
            const stats = await fsStatAdapter({ filePath: entryPath });

            if (stats === null || now - stats.mtimeMs <= artifact.ttlMs) {
              return;
            }

            const port = networkPortContract.parse(
              Number(name.slice(artifact.prefix.length, name.length - artifact.suffix.length)),
            );

            if (await netPortInUseAdapter({ port })) {
              return;
            }

            await fsRmAdapter({ filePath: entryPath, recursive: true, force: true });
          } catch {
            // This entry is somebody else's problem now — a concurrent sweep took it, or the
            // filesystem said no. Every other candidate still gets its turn.
          }
        }),
      );
    }),
  );

  return { success: true as const };
};
