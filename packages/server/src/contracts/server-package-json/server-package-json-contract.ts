/**
 * PURPOSE: Reach for this over the shared package's `.passthrough()` packageJsonContract when the
 * only field the caller needs out of the server's own manifest is the version — that shape types
 * name/bin/dependencies/exports but not version, and passthrough would leak the rest of the manifest
 * for no gain.
 *
 * USAGE:
 * serverPackageJsonContract.parse(JSON.parse(rawPackageJson));
 * // Returns: ServerPackageJson — { version: PackageVersion }, every other manifest key stripped
 */
import { z } from 'zod';
import { healthSnapshotContract } from '@dungeonmaster/shared/contracts';

export const serverPackageJsonContract = z.object({
  version: healthSnapshotContract.shape.version,
});

export type ServerPackageJson = z.infer<typeof serverPackageJsonContract>;
