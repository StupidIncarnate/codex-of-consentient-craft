import { ESLint } from 'eslint';
import type { Linter } from 'eslint';

// Cache the config to avoid repeated expensive loading
let configCache: { cwd: string; config: Linter.Config } | null = null;

export const loadConfigByFile = async ({
  cwd = process.cwd(),
  filePath,
}: {
  cwd?: string;
  filePath: string;
}) => {
  // Return cached config if same cwd
  if (configCache && configCache.cwd === cwd) {
    return configCache.config;
  }

  try {
    const eslint = new ESLint({ cwd });

    // Get resolved config for the ACTUAL file from the hook
    const config: Linter.Config = (await eslint.calculateConfigForFile(filePath)) || {};

    // Cache the result
    configCache = { cwd, config };

    return config;
  } catch (error) {
    throw new Error(
      `Failed to load ESLint configuration: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
