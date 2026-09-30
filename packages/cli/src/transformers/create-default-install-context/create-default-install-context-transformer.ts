/**
 * PURPOSE: Creates a default InstallContext using the provided cwd seed path
 *
 * USAGE:
 * const context = createDefaultInstallContextTransformer({ cwd: processCwdAdapter() });
 * // Returns InstallContext with cwd as both paths
 */
import { installContextContract } from '@dungeonmaster/shared/contracts';
import type { InstallContext } from '@dungeonmaster/shared/contracts';

export const createDefaultInstallContextTransformer = ({
  cwd,
}: {
  cwd: string;
}): InstallContext =>
  installContextContract.parse({
    targetProjectRoot: cwd,
    dungeonmasterRoot: cwd,
  });
