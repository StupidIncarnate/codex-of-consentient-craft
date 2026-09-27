/**
 * PURPOSE: The gateway workspace-package folder names `dungeonmaster init` scaffolds under
 * `packages/@gateway/`, each with the exact description text this repo's own gateway packages
 * carry — so a scaffolded consumer package.json reads the same way this repo's does, not a
 * generic placeholder. `folders` reads from `@dungeonmaster/shared`'s `gatewayLocationsStatics` —
 * the one list of gateway folder names — rather than naming them again; only `descriptions`, which
 * has no home anywhere else, is hand-written here.
 *
 * USAGE:
 * gatewayFoldersStatics.folders;
 * // Returns ['npm', 'node', 'browser', 'bin']
 */

import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';

const folders = Object.values(gatewayLocationsStatics.folders);

export const gatewayFoldersStatics = {
  folders,
  descriptions: {
    npm: 'Gateway package: one subpath per third-party npm package our code imports, named for it',
    node: 'Gateway package: everything the Node runtime provides, modules and globals alike',
    browser: 'Gateway package: everything the browser provides — globals and browser APIs',
    bin: 'Gateway package: programs installed on the machine, run through spawn',
  },
} as const;

export type GatewayFolder =
  (typeof gatewayLocationsStatics.folders)[keyof typeof gatewayLocationsStatics.folders];
