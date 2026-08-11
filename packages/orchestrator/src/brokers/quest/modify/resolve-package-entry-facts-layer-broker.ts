/**
 * PURPOSE: Reads the facts about a workspace that `questPackageEntryViolationsTransformer` needs
 * and cannot look up itself — which declared locations exist, who currently imports a package about
 * to be deleted — and re-stamps each existing entry's `packageType` and `packageTypes` from the
 * on-disk detector, so an author's guess never outranks the filesystem and the orchestrator, which
 * holds no disk at dispatch time, can decide e2e eligibility off the entry. It is a layer of the
 * modify path rather than a general broker because every answer is anchored on ONE quest's own repo
 * and that quest's OWN
 * declared locations: the parent directory of each entry is taken as a workspace root, so a repo
 * whose packages do not live under `packages/` still resolves and no layout is assumed anywhere.
 *
 * The dependent scan runs ONLY when an entry declares `delete`. It is the sole consumer of the
 * result, deletes are rare, and the scan costs one readdir plus a manifest read per sibling.
 *
 * USAGE:
 * await resolvePackageEntryFactsLayerBroker({ entries: quest.packagesAffected, projectRoot });
 * // Returns { existingLocations, dependentsByPackage, stampedEntries } — hand `stampedEntries` to
 * // the violations transformer and persist that same list.
 */

import { pathDirnameAdapter, pathResolveAdapter } from '@dungeonmaster/shared/adapters';
import { architecturePackageTypeDetectBroker } from '@dungeonmaster/shared/brokers';
import { filePathContract, packageJsonContract } from '@dungeonmaster/shared/contracts';
import type {
  PackageType,
  QuestPackageEntryStub,
  RepoRootCwd,
} from '@dungeonmaster/shared/contracts';
import { packageJsonDependencyNamesTransformer } from '@dungeonmaster/shared/transformers';

import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';

type QuestPackageEntry = ReturnType<typeof QuestPackageEntryStub>;

export const resolvePackageEntryFactsLayerBroker = async ({
  entries,
  projectRoot,
}: {
  entries: QuestPackageEntry[];
  projectRoot: RepoRootCwd;
}): Promise<{
  existingLocations: Set<unknown>;
  dependentsByPackage: Map<unknown, unknown[]>;
  stampedEntries: QuestPackageEntry[];
}> => {
  // A `location` is repo-relative to the QUEST's own repo, which is rarely the repo this process
  // runs in — so every probe below is anchored on `projectRoot` and the declared string is kept
  // only as the key the violations transformer looks entries up by. pathResolveAdapter rather than
  // pathJoinAdapter: join NORMALISES a leading `./` away and stays relative, which filePathContract
  // rejects, while resolve always yields an absolute path — so the existence check and the detector
  // run on one value and describe one directory.
  const locationChecks = await Promise.all(
    entries.map(async (entry) => {
      const packageRoot = pathResolveAdapter({
        paths: [String(projectRoot), String(entry.location)],
      });
      const filePath = filePathContract.parse(packageRoot);
      return {
        location: String(entry.location),
        packageRoot,
        filePath,
        exists: await fsIsAccessibleAdapter({ filePath }),
      };
    }),
  );
  const existingLocations = new Set<unknown>(
    locationChecks.filter((check) => check.exists).map((check) => check.location),
  );

  // Deduplicated by location: two entries may legitimately name one root, and each detection costs a
  // handful of reads.
  const detectableDeclarations = new Set<unknown>(
    entries.filter((entry) => entry.changeType !== 'new').map((entry) => String(entry.location)),
  );
  const detectableRoots = new Map(
    locationChecks
      .filter((check) => check.exists && detectableDeclarations.has(check.location))
      .map((check) => [check.location, check.packageRoot] as const),
  );
  const detections = await Promise.all(
    [...detectableRoots].map(async ([location, packageRoot]) => {
      try {
        return {
          location,
          packageTypes: await architecturePackageTypeDetectBroker({ packageRoot }),
        };
      } catch {
        // A root that exists but whose own package.json is unparseable yields no detection, and the
        // author's declared type stands. Failing the write instead would let one broken manifest
        // anywhere in the repo reject every quest save that mentions it — the same tolerance the
        // sibling-manifest scan below already applies.
        return undefined;
      }
    }),
  );
  const detectedByLocation = new Map<unknown, [PackageType, ...PackageType[]]>();
  for (const detection of detections) {
    if (detection === undefined) {
      continue;
    }
    detectedByLocation.set(detection.location, detection.packageTypes);
  }

  const stampedEntries = entries.map((entry) => {
    // A 'new' package has nothing on disk to read, so its declared type is the only answer there is.
    const detected =
      entry.changeType === 'new' ? undefined : detectedByLocation.get(String(entry.location));

    // BOTH axes come off the same read: `packageType` is the priority table's winner, which is what
    // the diagram colours and every prompt line renders, and `packageTypes` is every kind the same
    // signals support. They are stamped together because a decision made from the winner alone
    // cannot see the kinds the table returned before reaching — a hono adapter shadowing a
    // widgets+react folder is a package that loses its browser coverage without anything failing.
    if (detected !== undefined) {
      const [winner] = detected;
      return { ...entry, packageType: winner, packageTypes: [...detected] };
    }

    // Nothing on disk to read: a 'new' package, or a root whose manifest would not parse. The
    // declared label is then the whole set — the same answer eligibility gave before the set
    // existed — and a set already stamped by an earlier save is never narrowed back down.
    return entry.packageTypes.length > 0 ? entry : { ...entry, packageTypes: [entry.packageType] };
  });

  const dependentsByPackage = new Map<unknown, unknown[]>();
  const hasDelete = entries.some((entry) => entry.changeType === 'delete');
  if (!hasDelete) {
    return { existingLocations, dependentsByPackage, stampedEntries };
  }

  // Anchored on the RESOLVED location, not the declared one: a delete in a foreign repo would
  // otherwise scan a same-named directory under whichever repo this process happens to sit in.
  const workspaceRoots = new Set<unknown>(
    locationChecks.map((check) => String(pathDirnameAdapter({ path: check.filePath }))),
  );

  const siblingDirs: { root: unknown; dirName: unknown }[] = [];
  for (const root of workspaceRoots) {
    try {
      for (const dirName of fsReaddirAdapter({ dirPath: String(root) })) {
        siblingDirs.push({ root, dirName: String(dirName) });
      }
    } catch {
      // A declared location whose parent is not readable contributes no siblings. The location's
      // own existence is already answered above, and reporting the parent twice would bury it.
      continue;
    }
  }

  const manifests = await Promise.all(
    siblingDirs.map(async (sibling) => {
      // Concatenated rather than joined: the root is an absolute FilePath already, so appending
      // segments keeps it valid without a second adapter hop through filePathContract.
      const manifestPath = filePathContract.parse(
        `${String(sibling.root)}/${String(sibling.dirName)}/package.json`,
      );
      const readable = await fsIsAccessibleAdapter({ filePath: manifestPath });
      if (!readable) {
        return undefined;
      }
      try {
        const contents = await fsReadFileAdapter({ filePath: manifestPath });
        const packageJson = packageJsonContract.parse(JSON.parse(String(contents)) as unknown);
        return {
          dirName: String(sibling.dirName),
          npmName: packageJson.name === undefined ? undefined : String(packageJson.name),
          dependencyNames: packageJsonDependencyNamesTransformer({ packageJson }).map((name) =>
            String(name),
          ),
        };
      } catch {
        // An unreadable or malformed manifest names no dependents. It is not this path's job to
        // fail a quest write on a broken package.json elsewhere in the workspace.
        return undefined;
      }
    }),
  );

  const dirNameByNpmName = new Map<unknown, unknown>();
  for (const manifest of manifests) {
    if (manifest?.npmName === undefined) {
      continue;
    }
    dirNameByNpmName.set(manifest.npmName, manifest.dirName);
  }

  for (const manifest of manifests) {
    if (manifest === undefined) {
      continue;
    }
    for (const dependencyName of manifest.dependencyNames) {
      const dependencyDirName = dirNameByNpmName.get(dependencyName);
      if (dependencyDirName === undefined || dependencyDirName === manifest.dirName) {
        continue;
      }
      const existing = dependentsByPackage.get(dependencyDirName) ?? [];
      existing.push(manifest.dirName);
      dependentsByPackage.set(dependencyDirName, existing);
    }
  }

  return { existingLocations, dependentsByPackage, stampedEntries };
};
