/**
 * PURPOSE: Creates a default InstallContext using the provided cwd seed path
 *
 * USAGE:
 * const context = createDefaultInstallContextTransformer({ cwd: processCwdAdapter() });
 * // Returns InstallContext with cwd as both paths
 */
import type { FilePath, InstallContext } from '@dungeonmaster/shared/contracts';

export const createDefaultInstallContextTransformer = ({
  cwd,
}: {
  cwd: FilePath;
}): InstallContext => ({
  targetProjectRoot: cwd,
  dungeonmasterRoot: cwd,
});
