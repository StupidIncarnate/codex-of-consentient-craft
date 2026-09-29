/**
 * PURPOSE: Folder names, beyond `folderConfigStatics`, whose own `src/<name>/<name>.ts` is a package barrel. `@types` holds type-only barrels (shared's `StubArgument`) and has no folder config of its own.
 *
 * USAGE:
 * packageBarrelStatics.extraFolders;
 * // Returns ['@types']
 */
export const packageBarrelStatics = {
  extraFolders: ['@types'],
} as const;
