/**
 * Configuration interfaces for Questmaestro
 */

/**
 * Main configuration structure for .questmaestro file
 */
export interface QuestmaestroConfig {
  /**
   * Root folder for all quest-related files
   * @default "questmaestro"
   */
  questFolder?: string;

  /**
   * Whether project discovery has been completed by Voidpoker
   * @default false
   */
  discoveryComplete?: boolean;

  /**
   * Ward commands for validation
   * Can be a single command or separate lint/typecheck commands
   */
  wardCommands?: WardCommands;

  /**
   * Optional project-specific settings
   */
  project?: ProjectConfig;
}

/**
 * Ward command configuration
 */
export interface WardCommands {
  /**
   * Combined command that runs all validations
   * Example: "npm run ward:all"
   */
  all?: string;

  /**
   * Individual lint command
   * Example: "npm run lint"
   */
  lint?: string;

  /**
   * Individual typecheck command
   * Example: "npm run typecheck"
   */
  typecheck?: string;

  /**
   * Individual test command
   * Example: "npm test"
   */
  test?: string;

  /**
   * Individual build command
   * Example: "npm run build"
   */
  build?: string;
}

/**
 * Project-specific configuration
 */
export interface ProjectConfig {
  /**
   * Project name (extracted from package.json if not provided)
   */
  name?: string;

  /**
   * Project type hints for agents
   */
  type?: 'node' | 'web' | 'monorepo' | 'library' | 'cli';

  /**
   * Technology stack hints
   */
  technologies?: string[];

  /**
   * Custom patterns or conventions
   */
  conventions?: {
    /**
     * Test file naming pattern
     * @example "*.test.ts"
     */
    testPattern?: string;

    /**
     * Source directory paths
     */
    sourcePaths?: string[];
  };
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Required<
  Pick<QuestmaestroConfig, 'questFolder' | 'discoveryComplete'>
> = {
  questFolder: 'questmaestro',
  discoveryComplete: false,
};

/**
 * Validates a configuration object
 */
export function isValidConfig(config: unknown): boolean {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return false;
  }

  const c = config as QuestmaestroConfig;

  // Validate questFolder if present
  if (c.questFolder !== undefined && typeof c.questFolder !== 'string') {
    return false;
  }

  // Validate discoveryComplete if present
  if (c.discoveryComplete !== undefined && typeof c.discoveryComplete !== 'boolean') {
    return false;
  }

  // Validate wardCommands if present
  if (c.wardCommands !== undefined) {
    if (typeof c.wardCommands !== 'object' || c.wardCommands === null) {
      return false;
    }

    const w = c.wardCommands;
    const wardFields = ['all', 'lint', 'typecheck', 'test', 'build'] as const;

    for (const field of wardFields) {
      if (w[field] !== undefined && typeof w[field] !== 'string') {
        return false;
      }
    }
  }

  return true;
}
