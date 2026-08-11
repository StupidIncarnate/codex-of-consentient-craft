/**
 * PURPOSE: Derives the POST-quest dependency layering of the packages a quest declares, at the one
 * moment it can be pinned — Start, beside `baseRef` and for the same reason: the workspace keeps
 * moving, and a dispatch ordering recomputed later would disagree with the ledger already seeded
 * from it. Reach for this only from Start; every later reader takes `quest.packageGraph` as given.
 *
 * The node set is the quest's own `packagesAffected` rather than every workspace package, because a
 * graph entry must name a `changeType` and there is no honest value for a package the quest does
 * not touch. The manifests supply the EDGES; the entries supply the nodes and their kinds, already
 * resolved at write time.
 *
 * USAGE:
 * const packageGraph = await PrepareQuestPackageGraphLayerResponder({ quest });
 * // undefined when the quest already carries a graph (stamped once, never recomputed) or declares
 * // no packages; otherwise the entries to stamp
 */

import {
  filePathContract,
  packageGraphEntryContract,
  packageJsonContract,
} from '@dungeonmaster/shared/contracts';
import type { PackageName, Quest } from '@dungeonmaster/shared/contracts';
import {
  dependencyGraphAdjacencyBuildTransformer,
  dependencyGraphTopologicalOrderTransformer,
  packageJsonDependencyNamesTransformer,
} from '@dungeonmaster/shared/transformers';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';

export const PrepareQuestPackageGraphLayerResponder = async ({
  quest,
}: {
  quest: Quest;
}): Promise<Quest['packageGraph'] | undefined> => {
  if (quest.packageGraph.length > 0) {
    return undefined;
  }

  // A deleted package is gone once the quest lands, so it is no node and nothing may depend on it.
  const nodes = quest.packagesAffected.filter((entry) => entry.changeType !== 'delete');
  if (nodes.length === 0) {
    return undefined;
  }

  const manifests = await Promise.all(
    nodes.map(async (node) => {
      // A `new` package has no package.json on disk yet — its only source of edges is the reverse
      // `usedBy` direction applied below.
      if (node.changeType === 'new') {
        return { name: node.name, npmName: undefined, dependencyNames: [] };
      }

      // Concatenated rather than joined: path.join normalises a leading './' away, and
      // pathJoinAdapter re-parses its own result through filePathContract, which rejects a bare
      // relative path. The location is itself a parsed FilePath, so appending a segment keeps it
      // valid either way.
      const manifestPath = filePathContract.parse(`${String(node.location)}/package.json`);

      try {
        const contents = await fsReadFileAdapter({ filePath: manifestPath });
        const packageJson = packageJsonContract.parse(JSON.parse(String(contents)) as unknown);
        return {
          name: node.name,
          npmName: packageJson.name === undefined ? undefined : String(packageJson.name),
          dependencyNames: packageJsonDependencyNamesTransformer({ packageJson }).map((name) =>
            String(name),
          ),
        };
      } catch {
        // An unreadable or malformed manifest contributes no edges. Start must still seed a
        // ledger: a missing depth degrades the codeweaver ordering to the authored one, whereas
        // throwing here would refuse to start the quest over a package.json elsewhere.
        return { name: node.name, npmName: undefined, dependencyNames: [] };
      }
    }),
  );

  // Manifests speak npm names; every tag, entry and operation item speaks the directory name. This
  // is the only place the two meet.
  const dirNameByNpmName = new Map<unknown, PackageName>();
  for (const manifest of manifests) {
    if (manifest.npmName !== undefined) {
      dirNameByNpmName.set(manifest.npmName, manifest.name);
    }
  }

  const dependsOnByName = new Map<unknown, unknown[]>();
  for (const node of nodes) {
    dependsOnByName.set(String(node.name), []);
  }

  for (const manifest of manifests) {
    const own = dependsOnByName.get(String(manifest.name)) ?? [];
    for (const dependencyName of manifest.dependencyNames) {
      const dependencyDirName = dirNameByNpmName.get(dependencyName);
      if (dependencyDirName === undefined || dependencyDirName === manifest.name) {
        continue;
      }
      if (!own.some((existing) => String(existing) === String(dependencyDirName))) {
        own.push(String(dependencyDirName));
      }
    }
  }

  for (const node of nodes) {
    if (node.changeType !== 'new') {
      continue;
    }
    for (const consumer of node.usedBy ?? []) {
      const consumerDependsOn = dependsOnByName.get(String(consumer));
      if (consumerDependsOn === undefined) {
        continue;
      }
      if (!consumerDependsOn.some((existing) => String(existing) === String(node.name))) {
        consumerDependsOn.push(String(node.name));
      }
    }
  }

  const graphNameContract = packageJsonContract.shape.name.unwrap();
  const adjacency = dependencyGraphAdjacencyBuildTransformer({
    packages: nodes.map((node) => ({
      name: graphNameContract.parse(String(node.name)),
      dependencyNames: (dependsOnByName.get(String(node.name)) ?? []).map((dependencyName) =>
        graphNameContract.parse(String(dependencyName)),
      ),
    })),
  });

  // Kahn's order emits dependencies before dependents, so every dependency's depth is already
  // known when its dependent is reached — one pass, no re-walk. A cyclic workspace returns a null
  // order and every node keeps depth 0: the cycle is ward's finding to make, and refusing to start
  // the quest over it would help nobody.
  const { order } = dependencyGraphTopologicalOrderTransformer({ adjacency });
  const depthByName = new Map<unknown, unknown>();
  for (const name of order ?? []) {
    const dependencies = adjacency.get(name) ?? [];
    depthByName.set(
      String(name),
      dependencies.length === 0
        ? 0
        : Math.max(...dependencies.map((dependency) => Number(depthByName.get(dependency) ?? 0))) +
            1,
    );
  }

  return nodes.map((node) =>
    packageGraphEntryContract.parse({
      id: node.name,
      dependsOn: dependsOnByName.get(String(node.name)) ?? [],
      depth: Number(depthByName.get(String(node.name)) ?? 0),
      packageType: node.packageType,
      changeType: node.changeType,
    }),
  );
};
