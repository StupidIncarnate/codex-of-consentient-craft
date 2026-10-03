/**
 * PURPOSE: Reads machine resource limits and guild paths from ~/.dungeonmaster/config.json,
 * falling back to defaults with a warning when resources are missing or invalid.
 *
 * USAGE:
 * const limits = await limitsReadBroker();
 * // Returns { resources: { maxMemoryPercent: 80, maxDiskMB: 4096 }, guildPaths: ['...'], warning: null }
 */

import { readJsonFileIfExists } from '#gateway/node/fs__promises';
import { homedir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { homeConfigContract } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics, machineResourcesStatics } from '@dungeonmaster/shared/statics';

const DEFAULT_RESOURCES: {
  maxMemoryPercent: number;
  maxCpuPercent: number;
  maxDiskMB: number;
} = {
  maxMemoryPercent: machineResourcesStatics.maxMemoryPercent.default,
  maxCpuPercent: machineResourcesStatics.maxCpuPercent.default,
  maxDiskMB: machineResourcesStatics.maxDiskMB.default,
};

export const limitsReadBroker = async (): Promise<{
  resources: {
    maxMemoryPercent: number;
    maxCpuPercent: number;
    maxDiskMB: number;
  };
  guildPaths: readonly string[];
  warning: string | null;
}> => {
  const configFilePath = join(
    homedir(),
    dungeonmasterHomeStatics.paths.configDir,
    dungeonmasterHomeStatics.paths.configFile,
  );

  let rawConfig: unknown = null;
  let jsonParseWarning: string | null = null;

  try {
    rawConfig = await readJsonFileIfExists(configFilePath);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    jsonParseWarning = `config.json unparseable: ${message}. Using defaults.`;
  }

  if (jsonParseWarning !== null) {
    return {
      resources: { ...DEFAULT_RESOURCES },
      guildPaths: [],
      warning: jsonParseWarning,
    };
  }

  if (rawConfig === null || typeof rawConfig !== 'object' || Array.isArray(rawConfig)) {
    return {
      resources: { ...DEFAULT_RESOURCES },
      guildPaths: [],
      warning: null,
    };
  }

  const rawResources: unknown = 'resources' in rawConfig ? rawConfig.resources : undefined;
  let resources = { ...DEFAULT_RESOURCES };
  let resourcesWarning: string | null = null;

  if (rawResources !== undefined) {
    const validation = homeConfigContract.shape.resources.unwrap().safeParse(rawResources);
    if (validation.success) {
      resources = {
        maxMemoryPercent: validation.data.maxMemoryPercent,
        maxCpuPercent: validation.data.maxCpuPercent,
        maxDiskMB: validation.data.maxDiskMB,
      };
    } else {
      const issueMessage = validation.error.issues
        .map((issue) =>
          issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
        )
        .join(', ');
      resourcesWarning = `config.json resources invalid: ${issueMessage}. Using defaults.`;
    }
  }

  const guildPaths: readonly string[] =
    'guilds' in rawConfig && Array.isArray(rawConfig.guilds)
      ? rawConfig.guilds
          .map((guild: unknown) =>
            typeof guild === 'object' &&
            guild !== null &&
            'path' in guild &&
            typeof guild.path === 'string'
              ? guild.path
              : '',
          )
          .filter((path: string): path is string => path.length > 0)
      : [];

  return {
    resources,
    guildPaths,
    warning: resourcesWarning,
  };
};
