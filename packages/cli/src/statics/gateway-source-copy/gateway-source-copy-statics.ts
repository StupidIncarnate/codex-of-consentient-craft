/**
 * PURPOSE: Which gateway packages `dungeonmaster init` fills with dungeonmaster's OWN source rather
 * than leaving empty, and how to find that source. node and browser wrap what every Node runtime
 * and every browser provide, so the same wrappers fit any consumer; npm and bin depend on the
 * consumer's own dependencies and installed programs, so they start empty. The two keys read from
 * `@dungeonmaster/shared`'s `gatewayLocationsStatics.folders` — the one list of gateway folder
 * names — so "which two copy" stays a filter over that list rather than a second independent list
 * that could grow the other two names by accident; only the per-entry `specifier`/`directories`
 * data is hand-written. `specifier` is one exported subpath of the installed package, resolved to
 * locate its root; `directories` are copied from that root. The browser copy's tests run under
 * jsdom with the polyfill in `__mocks__`, which needs `browserDevDependencies`.
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
      directories: ['src', '__mocks__'],
    },
  },
  browserDevDependencies: {
    'jest-environment-jsdom': '^30.0.0',
    undici: '^7.21.0',
  },
} as const;

export type GatewayCopiedFolder = keyof typeof gatewaySourceCopyStatics.sources;
