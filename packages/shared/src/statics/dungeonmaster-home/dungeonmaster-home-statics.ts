/**
 * PURPOSE: Path constants for the dungeonmaster home directory structure
 *
 * USAGE:
 * dungeonmasterHomeStatics.paths.projectConfigFile;
 * // Returns '.dungeonmaster.json'
 */

export const dungeonmasterHomeStatics = {
  paths: {
    projectConfigFile: '.dungeonmaster.json',
    configDir: '.dungeonmaster',
    configFile: 'config.json',
    guildsDir: 'guilds',
    questsDir: 'quests',
    questFile: 'quest.json',
  },
} as const;
