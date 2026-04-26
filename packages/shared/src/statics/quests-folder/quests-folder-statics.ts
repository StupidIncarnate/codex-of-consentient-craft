/**
 * PURPOSE: Defines immutable quests folder configuration values
 *
 * USAGE:
 * questsFolderStatics.paths.root;
 * // Returns '.dungeonmaster-quests' folder name
 */

import { locationsStatics } from '../locations/locations-statics';

export const questsFolderStatics = {
  paths: {
    root: locationsStatics.repoRoot.dungeonmasterQuests,
    closed: 'closed',
  },
  files: {
    extension: '.json',
    packageJson: 'package.json',
  },
} as const;
