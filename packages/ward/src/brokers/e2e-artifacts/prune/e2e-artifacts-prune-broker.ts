/**
 * PURPOSE: Reclaims per-run e2e artifacts that outlived the run that made them. It runs at the END of
 * EVERY ward invocation — `singlePackageLayerBroker` calls it after every requested check type has
 * finished, including a lint-only or typecheck-only run that never touches e2e at all. The sibling
 * remove broker handles the ordinary end-of-run case for the run's OWN artifacts; this one is the
 * backstop for every run that never reached that cleanup — a SIGKILL, a Ctrl-C, a CI job
 * cancelled mid-suite. Measured on this repo before it existed: 3,048 leaked directories, about
 * 50 GB, oldest five months old.
 *
 * TWO THINGS STOP IT TAKING SOMETHING IT SHOULD NOT, and neither is optional.
 *
 * A bound port is proof a run owns the artifact. Ports RECUR, so the OS can hand a fresh run a port
 * whose stale directory is still on disk, and for the seconds before that run's server writes to it
 * the directory still reads as abandoned. Deleting it there kills a run already under way, and the
 * symptom names nothing that leads back here. That check applies to the artifacts whose NAME is a
 * port (`portKeyed`); the hashed bundle is named after its inputs and has no port to ask about, so
 * age is the whole of its test.
 *
 * Each entry is deleted inside its OWN catch. Four browser walks sweep one directory at once, so
 * two processes racing for the same path is the common case rather than the edge one — and a single
 * try around the whole loop would abandon every remaining deletion on the first collision, which
 * looks like it is working while the disk still fills.
 *
 * USAGE:
 * await e2eArtifactsPruneBroker({ packageRoot });
 * // Removes stale run artifacts under that package; a package with none is a no-op
 */

import { listeningPids } from '#gateway/bin/lsof';
import { readdirIfExists, rm, statIfExists } from '#gateway/node/fs__promises';

import { isPortSuffixedArtifactGuard } from '../../../guards/is-port-suffixed-artifact/is-port-suffixed-artifact-guard';
import { e2eArtifactsStatics } from '../../../statics/e2e-artifacts/e2e-artifacts-statics';

export const e2eArtifactsPruneBroker = async ({
  packageRoot,
}: {
  packageRoot: string;
}): Promise<void> => {
  const now = Date.now();

  await Promise.all(
    e2eArtifactsStatics.artifacts.map(async (artifact) => {
      const parentPath = `${String(packageRoot)}/${artifact.parentDir}`;

      // Per PREFIX, not per sweep. A package with no test-results/ must not stop the vite cache
      // under node_modules/ being swept.
      const entries = (await readdirIfExists(String(parentPath)).catch(() => null)) ?? [];

      const candidates = entries.filter(
        (entry) =>
          !artifact.portKeyed ||
          isPortSuffixedArtifactGuard({
            name: entry,
            prefix: artifact.prefix,
            suffix: artifact.suffix,
          }),
      );

      await Promise.all(
        candidates.map(async (entry) => {
          const name = entry;
          const entryPath = `${String(parentPath)}/${name}`;

          try {
            const stats = await statIfExists(String(entryPath));

            if (stats === null || now - stats.modifiedAtMs <= artifact.ttlMs) {
              return;
            }

            if (artifact.portKeyed) {
              const port = Number(name.slice(artifact.prefix.length, name.length - artifact.suffix.length));

              if ((await listeningPids({ port })).length > 0) {
                return;
              }
            }

            await rm(String(entryPath), { recursive: true, force: true });
          } catch {
            // This entry is somebody else's problem now — a concurrent sweep took it, or the
            // filesystem said no. Every other candidate still gets its turn.
          }
        }),
      );
    }),
  );
};
