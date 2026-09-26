/**
 * PURPOSE: Tells whether a `.proxy.ts` file's own implementation sits directly at an I/O
 * boundary — either an `adapters/` file (the workspace convention) or a gateway wrapper (the
 * ONLY place `@dungeonmaster/node`, `@dungeonmaster/npm`, `@dungeonmaster/browser` and
 * `@dungeonmaster/bin` touch an outside thing directly). Both need the same proxy checks —
 * describing a call in the constructor, only mocking npm packages — that a plain business-logic
 * proxy does not. Reused by `enforce-proxy-patterns` and `jest-mocked-must-import` so neither
 * rule keys on the bare `/adapters/` substring alone, which silently never matched a gateway
 * proxy (the gateway has no folder literally named `adapters/`).
 *
 * USAGE:
 * isIoBoundaryProxyGuard({ filename: '/repo/packages/shared/src/adapters/fs/read/fs-read-adapter.proxy.ts' });
 * // Returns true
 * isIoBoundaryProxyGuard({ filename: '/repo/packages/@gateway/node/src/fs/read-file-sync.proxy.ts' });
 * // Returns true — inside a gateway package
 * isIoBoundaryProxyGuard({ filename: '/repo/packages/shared/src/brokers/user/user-broker.proxy.ts' });
 * // Returns false
 */
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';

export const isIoBoundaryProxyGuard = ({ filename }: { filename?: string }): boolean => {
  if (!filename) {
    return false;
  }

  if (filename.includes('/adapters/')) {
    return true;
  }

  return gatewayLocationsStatics.packageGlobs.some((glob) => {
    // Each glob is 'packages/<folder>/src/**' — the directory prefix before the '**' is what a
    // real file path (relative or absolute) must contain to be inside that gateway package.
    const directoryPrefix = glob.slice(0, glob.length - '**'.length);
    return filename.includes(`/${directoryPrefix}`) || filename.startsWith(directoryPrefix);
  });
};
