/**
 * PURPOSE: Defines immutable quests folder configuration values
 *
 * USAGE:
 * questsFolderStatics.paths.root;
 * // Returns '.dungeonmaster-quests' folder name
 */

export const questsFolderStatics = {
  paths: {
    root: '.dungeonmaster-quests',
    closed: 'closed',
  },
  files: {
    extension: '.json',
    packageJson: 'package.json',
  },
} as const;
