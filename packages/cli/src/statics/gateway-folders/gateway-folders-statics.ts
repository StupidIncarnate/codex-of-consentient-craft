/**
 * PURPOSE: The four gateway workspace-package folder names `dungeonmaster init` scaffolds under
 * `packages/@gateway/`, each with the exact description text this repo's own gateway packages
 * carry — so a scaffolded consumer package.json reads the same way this repo's does, not a
 * generic placeholder.
 *
 * USAGE:
 * gatewayFoldersStatics.folders;
 * // Returns ['npm', 'node', 'browser', 'bin'] as const
 */

export const gatewayFoldersStatics = {
  folders: ['npm', 'node', 'browser', 'bin'] as const,
  descriptions: {
    npm: 'Gateway package: one subpath per third-party npm package our code imports, named for it',
    node: 'Gateway package: everything the Node runtime provides, modules and globals alike',
    browser: 'Gateway package: everything the browser provides — globals and browser APIs',
    bin: 'Gateway package: programs installed on the machine, run through spawn',
  },
} as const;

export type GatewayFolder = 'npm' | 'node' | 'browser' | 'bin';
