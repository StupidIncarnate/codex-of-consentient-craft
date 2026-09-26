/**
 * PURPOSE: Narrows a dependency edge's own imported names down to the ones an ancestor actually
 * still wants, or keeps them all when the ancestor is fully loaded (`'all'`) — the one comparison
 * every branch of `walkGatewayCrossingsLayerBroker`'s per-dependency handling needs before deciding
 * whether an edge is even worth following.
 *
 * USAGE:
 * intersectImportedNamesTransformer({names: [ImportedNameStub()], requestedNames: 'all'});
 * // Returns: [ImportedNameStub()]
 */

import type { ImportedName } from '../../contracts/imported-name/imported-name-contract';

export const intersectImportedNamesTransformer = ({
  names,
  requestedNames,
}: {
  names: readonly ImportedName[];
  requestedNames: 'all' | readonly ImportedName[];
}): readonly ImportedName[] =>
  requestedNames === 'all' ? names : names.filter((name) => requestedNames.includes(name));
