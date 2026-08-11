/**
 * PURPOSE: Judges each declared package entry against what is actually on disk — the two orthogonal
 * questions `questPackageEntryContract` cannot ask itself, because a Zod schema sees the entry and
 * not the filesystem: does the location match what `changeType` claims, and does deleting this
 * package strand a dependent nobody has accounted for. Reach for this at write time on
 * `packagesAffected`; the relational rules that read node tags against this same list live in
 * `questSaveInvariantsTransformer` and bind at the flow gates instead.
 *
 * Pure by construction: disk resolution and the dependent scan are performed by the caller and passed
 * in, the same split `questContractSourceResolutionTransformer` uses.
 *
 * USAGE:
 * questPackageEntryViolationsTransformer({entries, existingLocations, dependentsByPackage});
 * // Returns ErrorMessage[] — one sentence per offending entry, naming the orphaned dependents by name.
 */
import type { QuestPackageEntryStub } from '@dungeonmaster/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

type QuestPackageEntry = ReturnType<typeof QuestPackageEntryStub>;

export const questPackageEntryViolationsTransformer = ({
  entries,
  existingLocations,
  dependentsByPackage,
}: {
  entries: QuestPackageEntry[];
  existingLocations: Set<unknown>;
  dependentsByPackage: Map<unknown, unknown[]>;
}): ErrorMessage[] => {
  const offenders: ErrorMessage[] = [];

  // A dependent is accounted for when the same write also declares it — 'edit' because its imports
  // change, 'delete' because it goes too. A dependent declared 'new' does not count: a package this
  // quest has yet to create cannot already be importing the one being removed.
  const accountedNames = new Set<unknown>(
    entries.filter((entry) => entry.changeType !== 'new').map((entry) => String(entry.name)),
  );

  for (const entry of entries) {
    const name = String(entry.name);
    const location = String(entry.location);
    const locationResolves = existingLocations.has(location);

    if (entry.changeType === 'new') {
      if (locationResolves) {
        offenders.push(
          errorMessageContract.parse(
            `Package entry '${name}' declares changeType 'new' but its location '${location}' already resolves on disk. A 'new' package is one this quest creates — set changeType to 'edit', or point location at the path the new package will actually live at.`,
          ),
        );
      }
      if (entry.usedBy === undefined || entry.usedBy.length === 0) {
        offenders.push(
          errorMessageContract.parse(
            `Package entry '${name}' declares changeType 'new' but names no usedBy[] consumers. A package with no package.json on disk yet has no other source of reverse edges, so the post-quest dependency graph cannot place it — list every package that will depend on '${name}'.`,
          ),
        );
      }
      continue;
    }

    if (!locationResolves) {
      offenders.push(
        errorMessageContract.parse(
          `Package entry '${name}' declares changeType '${entry.changeType}' but its location '${location}' does not resolve on disk. An 'edit' or 'delete' entry names a package that already exists — correct the location, or set changeType to 'new' if this quest is what creates it.`,
        ),
      );
    }

    if (entry.changeType !== 'delete') {
      continue;
    }

    const orphaned = (dependentsByPackage.get(name) ?? [])
      .map((dependent) => String(dependent))
      .filter((dependent) => !accountedNames.has(dependent));
    if (orphaned.length === 0) {
      continue;
    }

    offenders.push(
      errorMessageContract.parse(
        `Package entry '${name}' declares changeType 'delete' but these packages still depend on it and are not declared as 'edit' or 'delete': ${orphaned.join(', ')}. Removing '${name}' would leave the post-quest dependency graph with a dangling edge — add an entry for each of them (usually 'edit', for the import removal), or keep '${name}'.`,
      ),
    );
  }

  return offenders;
};
