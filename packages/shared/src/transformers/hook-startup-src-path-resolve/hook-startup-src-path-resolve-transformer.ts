/**
 * PURPOSE: Resolves a hook bin dist path string (e.g. './dist/src/startup/start-pre-edit-hook.js')
 * to the corresponding TypeScript source path under the package root (e.g.
 * '/repo/packages/hooks/src/startup/start-pre-edit-hook.ts'). Returns undefined when the
 * bin path does not follow the './dist/...' convention.
 *
 * USAGE:
 * const srcPath = hookStartupSrcPathResolveTransformer({
 *   binPath: './dist/src/startup/start-pre-edit-hook.js',
 *   packageRoot: '/repo/packages/hooks',
 * });
 * // Returns AbsoluteFilePath('/repo/packages/hooks/src/startup/start-pre-edit-hook.ts')
 *
 * WHEN-TO-USE: hook-handlers headline renderer mapping bin entries to source startup files
 * WHEN-NOT-TO-USE: For non-dist bin paths
 */

// Matches ./dist/... or ./dist/src/... bin paths, capturing the sub-path after dist/
const DIST_BIN_PATTERN = /^\.\/dist\/(?:src\/)?(.+)\.js$/u;

export const hookStartupSrcPathResolveTransformer = ({
  binPath,
  packageRoot,
}: {
  binPath: string;
  packageRoot: string;
}): string | undefined => {
  const [, relSrc] = DIST_BIN_PATTERN.exec(binPath) ?? [];
  if (relSrc === undefined) {
    return undefined;
  }
  return `${packageRoot}/src/${relSrc}.ts`;
};
