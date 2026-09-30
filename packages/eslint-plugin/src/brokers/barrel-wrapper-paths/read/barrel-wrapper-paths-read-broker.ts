/**
 * PURPOSE: Reads one barrel file and returns every name it re-exports from a relative sibling,
 * paired with that sibling's relative module path. A null path (a caller outside the
 * `/packages/` layout), a missing barrel and an unreadable one all yield an empty map, so every
 * name then reads as a pass-through. enforce-proxy-child-creation asks it about gateway subpath
 * barrels, package root barrels and package folder-type barrels alike.
 *
 * USAGE:
 * barrelWrapperPathsReadBroker({
 *   barrelPath: filePathContract.parse('/repo/packages/@gateway/node/src/fs__promises/fs__promises.ts'),
 * });
 * // Returns a Map of 'writeFile' -> 'write-file/write-file', or an empty Map
 */
import { readFileSyncIfExists } from '#gateway/node/fs';
import { gatewayBarrelWrapperPathsTransformer } from '../../../transformers/gateway-barrel-wrapper-paths/gateway-barrel-wrapper-paths-transformer';

export const barrelWrapperPathsReadBroker = ({
  barrelPath,
}: {
  barrelPath: string | null;
}): Map<string, string> => {
  if (barrelPath === null) {
    return new Map<string, string>();
  }

  const barrelContent = ((): string | null => {
    try {
      const rawContents = readFileSyncIfExists(barrelPath);
      return rawContents === null ? null : rawContents;
    } catch {
      return null;
    }
  })();

  return barrelContent === null
    ? new Map<string, string>()
    : gatewayBarrelWrapperPathsTransformer({ content: barrelContent });
};
