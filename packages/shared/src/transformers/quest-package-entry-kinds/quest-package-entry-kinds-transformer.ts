/**
 * PURPOSE: The one place an entry's `packageTypes` set is read, so no consumer has to decide for
 * itself what an entry that was never stamped means. An unstamped entry answers with its declared
 * `packageType` alone, which is exactly how eligibility behaved before the set existed — a caller
 * reading the raw field instead would see NO kinds there and silently narrow every unit that
 * package owns out of its denominator. Reach for this wherever a package name has to be ranked
 * against a track's package kinds; read `entry.packageType` directly only for display.
 *
 * USAGE:
 * questPackageEntryKindsTransformer({ entry });
 * // Returns ['http-backend', 'frontend-react'] for a package whose signals support both
 */

import type { PackageType } from '../../contracts/package-type/package-type-contract';
import type { QuestPackageEntry } from '../../contracts/quest-package-entry/quest-package-entry-contract';

export const questPackageEntryKindsTransformer = ({
  entry,
}: {
  entry: QuestPackageEntry;
}): PackageType[] =>
  entry.packageTypes.length > 0 ? [...entry.packageTypes] : [entry.packageType];
