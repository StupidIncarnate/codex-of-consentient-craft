/**
 * PURPOSE: Derives tsconfig project references for all eligible workspaces from their dependency graph
 *
 * USAGE:
 * projectReferencesDeriveTransformer({ workspaces: [...], rootPath: AbsoluteFilePathStub({ value: '/repo' }) });
 * // Returns: { perPackage, root, cycle }
 */

import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { PackageJson } from '../../contracts/package-json/package-json-contract';
import type { ProjectFolder } from '../../contracts/project-folder/project-folder-contract';
import { tsconfigReferenceContract } from '../../contracts/tsconfig-reference/tsconfig-reference-contract';
import type { TsconfigReference } from '../../contracts/tsconfig-reference/tsconfig-reference-contract';
import type { WorkspaceInput } from '../../contracts/workspace-input/workspace-input-contract';
import { dependencyGraphTopologicalOrderTransformer } from '../dependency-graph-topological-order/dependency-graph-topological-order-transformer';
import { relativePathComputeTransformer } from '../relative-path-compute/relative-path-compute-transformer';

type PackageJsonName = NonNullable<PackageJson['name']>;

export const projectReferencesDeriveTransformer = ({
  workspaces,
  rootPath,
}: {
  workspaces: readonly WorkspaceInput[];
  rootPath: AbsoluteFilePath;
}): {
  perPackage: Map<ProjectFolder['path'], TsconfigReference[]>;
  root: TsconfigReference[];
  cycle: PackageJsonName[] | null;
} => {
  const eligibleByName = new Map<PackageJsonName, WorkspaceInput>();
  for (const ws of workspaces) {
    if (ws.isCompositeEligible && ws.packageName !== undefined) {
      eligibleByName.set(ws.packageName, ws);
    }
  }

  const adjacency = new Map<PackageJsonName, PackageJsonName[]>();
  for (const [pkgName, ws] of eligibleByName.entries()) {
    const deps: PackageJsonName[] = [];
    for (const depName of ws.dependencyNames) {
      if (eligibleByName.has(depName) && depName !== pkgName) {
        deps.push(depName);
      }
    }
    adjacency.set(pkgName, deps);
  }

  const { order, cycle } = dependencyGraphTopologicalOrderTransformer({ adjacency });

  if (cycle !== null) {
    return { perPackage: new Map(), root: [], cycle };
  }

  const perPackage = new Map<ProjectFolder['path'], TsconfigReference[]>();
  for (const [pkgName, ws] of eligibleByName.entries()) {
    const deps = adjacency.get(pkgName) ?? [];
    const refs = deps
      .map((depName) => {
        const dep = eligibleByName.get(depName);
        if (dep === undefined) {
          return undefined;
        }
        const relPath = relativePathComputeTransformer({
          from: absoluteFilePathContract.parse(String(ws.projectPath)),
          to: absoluteFilePathContract.parse(String(dep.projectPath)),
        });
        return tsconfigReferenceContract.parse({ path: String(relPath) });
      })
      .filter((ref): ref is TsconfigReference => ref !== undefined)
      .sort((a, b) => String(a.path).localeCompare(String(b.path)));

    perPackage.set(ws.projectPath, refs);
  }

  const topologicalOrder = order ?? [];
  const root = topologicalOrder
    .map((pkgName) => {
      const ws = eligibleByName.get(pkgName);
      if (ws === undefined) {
        return undefined;
      }
      const relPath = relativePathComputeTransformer({
        from: rootPath,
        to: absoluteFilePathContract.parse(String(ws.projectPath)),
      });
      return tsconfigReferenceContract.parse({ path: String(relPath) });
    })
    .filter((ref): ref is TsconfigReference => ref !== undefined);

  return { perPackage, root, cycle: null };
};
