/**
 * PURPOSE: Tells whether a file, implementation OR test, sits inside one of the four gateway
 * packages (`packages/{npm,node,browser,bin}/src/**`). Rules whose model assumes every other
 * package's shape — a branded contract return, a stub built from `contract.parse()` — use this
 * to skip the gateway the same way the config carve-out already does for implementation files;
 * the TEST rule block is not itself carved out (it applies to every package's tests by file
 * suffix), so a rule that must not fire on a gateway `.test.ts` teaches itself directly instead.
 *
 * USAGE:
 * isGatewayFileGuard({ filename: '/repo/packages/node/src/fs/read-file-sync.test.ts' });
 * // Returns true
 * isGatewayFileGuard({ filename: '/repo/packages/shared/src/brokers/user/user-broker.test.ts' });
 * // Returns false
 */
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';

export const isGatewayFileGuard = ({ filename }: { filename?: string }): boolean => {
  if (!filename) {
    return false;
  }

  return gatewayLocationsStatics.packageGlobs.some((glob) => {
    const directoryPrefix = glob.slice(0, glob.length - '**'.length);
    return filename.includes(`/${directoryPrefix}`) || filename.startsWith(directoryPrefix);
  });
};
