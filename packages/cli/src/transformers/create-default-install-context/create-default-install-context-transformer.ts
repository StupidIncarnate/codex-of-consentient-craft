/**
 * PURPOSE: Creates a default InstallContext using the current working directory
 *
 * USAGE:
 * const context = createDefaultInstallContextTransformer();
 * // Returns InstallContext with cwd as both paths
 */
import type { InstallContext } from '@dungeonmaster/shared/contracts';

export const createDefaultInstallContextTransformer = (): InstallContext =>
  ({
    targetProjectRoot: process.cwd(),
    dungeonmasterRoot: process.cwd(),
  }) as InstallContext;
