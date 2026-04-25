/**
 * PURPOSE: Path constants for the dungeonmaster home directory structure
 *
 * USAGE:
 * dungeonmasterHomeStatics.paths.projectConfigFile;
 * // Returns '.dungeonmaster.json'
 */

import { locationsStatics } from '../locations/locations-statics';

export const dungeonmasterHomeStatics = {
  paths: {
    projectConfigFile: locationsStatics.repoRoot.config,
    configDir: locationsStatics.dungeonmasterHome.dir,
    configFile: 'config.json',
    guildsDir: locationsStatics.dungeonmasterHome.guildsDir,
    questsDir: locationsStatics.guild.questsDir,
    questFile: locationsStatics.quest.questFile,
  },
} as const;
