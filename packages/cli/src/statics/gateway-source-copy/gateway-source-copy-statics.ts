/**
 * PURPOSE: Which gateway packages `dungeonmaster init` fills whole with dungeonmaster's OWN source,
 * and how to find that source. node and browser wrap what every Node runtime and every browser
 * provide, so the same wrappers fit any consumer; npm and bin depend on the consumer's own
 * dependencies and installed programs, so npm is filled per dependency by the npm-gateway sync and
 * bin starts empty. The two keys read from
 * `@dungeonmaster/shared`'s `gatewayLocationsStatics.folders` — the one list of gateway folder
 * names — so "which two copy" stays a filter over that list rather than a second independent list
 * that could grow the other two names by accident; only the per-entry `specifier`/`directories`
 * data is hand-written. `specifier` is one exported subpath of the installed package, resolved to
 * locate its root; `directories` are copied from that root. The browser copy's tests run under
 * jsdom, which needs `browserDevDependencies` (the jsdom polyfill itself is a `@dungeonmaster/testing`
 * import, not a copied file, so it needs no directory of its own here).
 *
 * USAGE:
 * gatewaySourceCopyStatics.sources.node.specifier;
 * // Returns '@dungeonmaster/node/fs'
 */

import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';

export const gatewaySourceCopyStatics = {
  sources: {
    [gatewayLocationsStatics.folders.node]: {
      specifier: '@dungeonmaster/node/fs',
      directories: ['src'],
    },
    [gatewayLocationsStatics.folders.browser]: {
      specifier: '@dungeonmaster/browser/fetch',
      directories: ['src'],
    },
  },
  browserDevDependencies: {
    'jest-environment-jsdom': '^30.0.0',
  },
} as const;

export type GatewayCopiedFolder = keyof typeof gatewaySourceCopyStatics.sources;
