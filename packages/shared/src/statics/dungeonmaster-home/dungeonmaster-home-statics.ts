/**
 * PURPOSE: Path constants for the dungeonmaster home directory structure
 *
 * USAGE:
 * dungeonmasterHomeStatics.paths.configDir;
 * // Returns '.dungeonmaster'
 */

export const dungeonmasterHomeStatics = {
  paths: {
    configDir: '.dungeonmaster',
    configFile: 'config.json',
    projectsDir: 'projects',
    questsDir: 'quests',
    questFile: 'quest.json',
  },
} as const;
