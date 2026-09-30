/**
 * PURPOSE: Builds the per-file proxy specifier for a name a workspace package's folder-type barrel
 * (`@scope/pkg/brokers`, `@scope/pkg/startup`, ...) re-exports from a relative sibling: the barrel's
 * own import path joined to that sibling's relative module path, with `.proxy` appended. A proxy is
 * imported from its own file, never through a barrel, so the specifier a caller's proxy should write
 * is this one.
 *
 * USAGE:
 * workspaceFolderBarrelProxyPathTransformer({
 *   importPath: modulePathContract.parse('@dungeonmaster/shared/brokers'),
 *   relativeWrapperPath: modulePathContract.parse('project-root/find/project-root-find-broker'),
 * });
 * // Returns '@dungeonmaster/shared/brokers/project-root/find/project-root-find-broker.proxy' as branded ModulePath
 */

export const workspaceFolderBarrelProxyPathTransformer = ({
  importPath,
  relativeWrapperPath,
}: {
  importPath: string;
  relativeWrapperPath: string;
}): string => `${importPath}/${relativeWrapperPath}.proxy`;
