/**
 * PURPOSE: Names the one folder a gateway package may hold directly under its own `src/` that is
 * NOT a subpath — a container for a shared, type-only proxy-addressing helper (`ArgMatcher` in
 * `bin`, `ValueMatcher` in `browser`, `PathMatcher` in `node`) with no wrapper of its own to name a
 * subpath after. `isGatewayBarrelFileGuard` reads this to refuse ever treating a same-named file
 * inside it as a subpath barrel. `gateway-browser-globals.integration.test.ts` and
 * `gateway-node-builtin-globals.integration.test.ts` each duplicate this one literal by hand — a
 * gateway file may not import `@dungeonmaster/shared` (`gateway-import-boundary`), and eslint-plugin
 * is the one non-gateway place this name can be canonical. Change all three when this value changes.
 *
 * USAGE:
 * gatewayReservedFolderNamesStatics.folders.testSupport
 * // Returns 'gateway-test-support'
 */
export const gatewayReservedFolderNamesStatics = {
  folders: {
    testSupport: 'gateway-test-support',
  },
} as const;
