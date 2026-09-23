/**
 * PURPOSE: Computes an `ElementDelta` between two `KeyListing`s taken of the same page. Reach for this
 * over comparing `before.rows` and `after.rows` by array position or by `ref`: position is not identity
 * (two readings can list the same elements in a different order), and `ref-contract.ts` documents `ref`
 * itself as good for only ONE instance in ONE page state — an element that merely re-rendered without
 * changing content can mint a new one, which would make an unchanged page report churn.
 *
 * The identity this diffs on is the one `key-read-layer-adapter.ts:322-323` already computes for the
 * `[n/m]` sibling marker — `${row.parentRef}::${row.testId ?? '(' + row.tag + ')'}` — generalised to
 * survive being compared ACROSS two readings rather than used within one. A `KeyRow` carries no
 * `parentRef`, so this reconstructs the same "nearest row ancestor" relationship from `depth` and
 * document order (a row's parent is the nearest EARLIER row exactly one depth level up — true by
 * construction, since `rows` is a pre-order walk), then builds each row's identity as its own label
 * chained onto its PARENT'S identity STRING rather than the parent's array position — a position is
 * only ever meaningful within the one reading that produced it, while a chain of labels is exactly what
 * stays comparable across two.
 *
 * USAGE:
 * elementDeltaComputeTransformer({ before: KeyListingStub(), after: KeyListingStub() });
 * // Returns an ElementDelta reporting no difference when both listings carry the same rows
 */

import { elementDeltaContract } from '../../contracts/element-delta/element-delta-contract';
import type { ElementDelta } from '../../contracts/element-delta/element-delta-contract';
import type { KeyListing } from '../../contracts/key-listing/key-listing-contract';
import type { KeyRow } from '../../contracts/key-row/key-row-contract';

export const elementDeltaComputeTransformer = ({
  before,
  after,
}: {
  before: KeyListing;
  after: KeyListing;
}): ElementDelta => {
  const perListingEntries = [before.rows, after.rows].map((rows) => {
    const perRow = rows.map((row, index) => {
      const parentCandidates = rows
        .slice(0, index)
        .map((candidate, candidateIndex) => ({ candidate, candidateIndex }))
        .filter(({ candidate }) => candidate.depth === row.depth - 1);
      const nearestParent = parentCandidates.at(-1);
      const parentIndex = nearestParent === undefined ? null : nearestParent.candidateIndex;
      const label = row.testId ?? `(${row.tag})`;

      return {
        row,
        parentIndex,
        label,
        groupKey: `${parentIndex === null ? 'root' : String(parentIndex)}::${label}`,
      };
    });

    const withOrdinal = perRow.map((entry, index) => {
      const total = perRow.filter((candidate) => candidate.groupKey === entry.groupKey).length;
      const ordinal = perRow
        .slice(0, index + 1)
        .filter((candidate) => candidate.groupKey === entry.groupKey).length;
      const ordinalSuffix = total > 1 ? `[${String(ordinal)}/${String(total)}]` : '';

      return { ...entry, ordinalSuffix };
    });

    // A bounded `for`, not recursion: the chain walks parentIndex pointers up to the root, and no
    // chain can be longer than the listing itself, since every step strictly decreases the index.
    return withOrdinal.map((entry) => {
      const chain = Array.of(`${entry.label}${entry.ordinalSuffix}`);
      let walkIndex = entry.parentIndex;

      for (const _bound of withOrdinal) {
        if (walkIndex === null) {
          break;
        }
        const ancestor = withOrdinal.at(walkIndex);
        if (ancestor === undefined) {
          break;
        }
        chain.unshift(`${ancestor.label}${ancestor.ordinalSuffix}`);
        walkIndex = ancestor.parentIndex;
      }

      return { row: entry.row, identity: chain.join('>') };
    });
  });

  const beforeEntries = perListingEntries[0] ?? [];
  const afterEntries = perListingEntries[1] ?? [];

  const appeared = afterEntries
    .filter((entry) => !beforeEntries.some((candidate) => candidate.identity === entry.identity))
    .map((entry) => entry.row);

  const disappeared = beforeEntries
    .filter((entry) => !afterEntries.some((candidate) => candidate.identity === entry.identity))
    .map((entry) => entry.row);

  const changed = beforeEntries.flatMap<{ before: KeyRow; after: KeyRow }>((beforeEntry) => {
    const matched = afterEntries.find((candidate) => candidate.identity === beforeEntry.identity);
    if (matched === undefined) {
      return [];
    }

    const contentUnchanged =
      beforeEntry.row.depth === matched.row.depth &&
      beforeEntry.row.tag === matched.row.tag &&
      beforeEntry.row.role === matched.row.role &&
      beforeEntry.row.domId === matched.row.domId &&
      beforeEntry.row.sibling === matched.row.sibling &&
      beforeEntry.row.text === matched.row.text &&
      beforeEntry.row.value === matched.row.value &&
      beforeEntry.row.placeholder === matched.row.placeholder &&
      beforeEntry.row.attrsDropped === matched.row.attrsDropped &&
      JSON.stringify(beforeEntry.row.attrs) === JSON.stringify(matched.row.attrs) &&
      JSON.stringify(beforeEntry.row.flags) === JSON.stringify(matched.row.flags) &&
      JSON.stringify(beforeEntry.row.flagDetail) === JSON.stringify(matched.row.flagDetail);

    return contentUnchanged ? [] : [{ before: beforeEntry.row, after: matched.row }];
  });

  return elementDeltaContract.parse({ appeared, disappeared, changed });
};
