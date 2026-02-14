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
    guildsDir: 'guilds',
    questsDir: 'quests',
    questFile: 'quest.json',
  },
} as const;
