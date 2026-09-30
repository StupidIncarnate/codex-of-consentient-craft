/**
 * PURPOSE: Merges the four `#gateway/<folder>/*` entries into a package.json's existing `imports`
 * field. Every existing entry survives untouched, including an existing `#gateway/...` one — this
 * never overwrites a value someone already committed. Returns the SAME `existingImports` reference
 * when every gateway key is already present, so a caller can skip a write with `updated === existing`.
 *
 * USAGE:
 * gatewayImportsMergeTransformer({ existingImports: { '#alias/*': './src/*' }, scope: '@acme' });
 * // Returns { '#alias/*': './src/*', '#gateway/npm/*': '@acme/npm/*', ... }
 */

import { gatewayImportsMapContract, type GatewayImportsMap } from '@dungeonmaster/shared/contracts';
import { gatewayImportsFieldTransformer } from '@dungeonmaster/shared/transformers';

export const gatewayImportsMergeTransformer = ({
  existingImports,
  scope,
}: {
  existingImports: unknown;
  scope: string;
}): GatewayImportsMap => {
  const parsedExisting = gatewayImportsMapContract.safeParse(existingImports);
  const currentImports = parsedExisting.success
    ? parsedExisting.data
    : gatewayImportsMapContract.parse({});
  const desiredEntries = gatewayImportsFieldTransformer({ scope });

  const everyGatewayKeyAlreadyPresent = Object.keys(desiredEntries).every(
    (key) => key in currentImports,
  );

  // Returns the caller's OWN object, not the re-parsed `currentImports` — zod's `.safeParse()`
  // rebuilds a new object even when every value passes through unchanged, so returning
  // `currentImports` here would break a caller's `updated === existingImports` skip-the-write check.
  if (everyGatewayKeyAlreadyPresent && parsedExisting.success) {
    return existingImports as GatewayImportsMap;
  }

  return gatewayImportsMapContract.parse({ ...desiredEntries, ...currentImports });
};
