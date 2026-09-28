/**
 * PURPOSE: Resolves the ONE `packages/*` directory in `repoRoot` whose detected `packageType`
 * matches the requested kind, into the npm name a lane process needs for `--workspace=<name>` — read
 * off disk rather than hardcoded, because a repo siegelense drives names its own frontend/backend
 * packages however it likes, and two packages can answer the same role. Reach for this from
 * `laneBootBroker` wherever a lane-process template names a package by ROLE rather than by literal
 * name. Throws naming every match when the kind resolves to none or to more than one package —
 * silently taking the first match is the same hardcoded-name bug this replaces, just later and
 * harder to trace.
 *
 * USAGE:
 * await laneWorkspaceResolveBroker({
 *   repoRoot: AbsoluteFilePathStub({ value: '/repo' }),
 *   packageType: PackageTypeStub({ value: 'http-backend' }),
 * });
 * // Returns PackageName('@dungeonmaster/server') when exactly one packages/* dir detects that kind
 */

import { architecturePackageTypeDetectBroker } from '@dungeonmaster/shared/brokers';
import { readFileSync, readdirEntriesSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';
import {
  absoluteFilePathContract,
  packageJsonContract,
  packageNameContract,
} from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, PackageName, PackageType } from '@dungeonmaster/shared/contracts';

import { LaneWorkspaceNoneMatchedError } from '../../../errors/lane-workspace-none-matched/lane-workspace-none-matched-error';
import { LaneWorkspaceSeveralMatchedError } from '../../../errors/lane-workspace-several-matched/lane-workspace-several-matched-error';

export const laneWorkspaceResolveBroker = async ({
  repoRoot,
  packageType,
}: {
  repoRoot: AbsoluteFilePath;
  packageType: PackageType;
}): Promise<PackageName> => {
  const packagesDirPath = absoluteFilePathContract.parse(join(repoRoot, 'packages'));
  const packageDirs = readdirEntriesSync(packagesDirPath).filter(
    (entry) => entry.kind === 'directory',
  );

  const detections = await Promise.all(
    packageDirs.map(async (entry) => {
      const packageRoot = absoluteFilePathContract.parse(join(packagesDirPath, entry.name));
      const kinds = await architecturePackageTypeDetectBroker({ packageRoot });
      return { packageRoot, kinds };
    }),
  );

  const matches = detections
    .filter(({ kinds }) => kinds.includes(packageType))
    .map(({ packageRoot }) => {
      const packageJsonPath = absoluteFilePathContract.parse(join(packageRoot, 'package.json'));
      const packageJson = packageJsonContract.parse(
        JSON.parse(readFileSync(packageJsonPath)) as unknown,
      );
      return packageNameContract.parse(String(packageJson.name));
    });

  if (matches.length === 0) {
    throw new LaneWorkspaceNoneMatchedError({ repoRoot, packageType });
  }
  if (matches.length > 1) {
    throw new LaneWorkspaceSeveralMatchedError({ repoRoot, packageType, matches });
  }

  const [match] = matches;
  if (match === undefined) {
    throw new Error(`laneWorkspaceResolveBroker: impossible empty match set for "${packageType}"`);
  }
  return match;
};
