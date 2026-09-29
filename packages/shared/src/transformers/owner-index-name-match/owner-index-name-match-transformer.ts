/**
 * PURPOSE: Answers "who owns the name `parentQuestId`": the reachable owner whose name words plus the
 * key's words end the name's words, and that key. The longest owner-plus-key wins (`workItemId`
 * resolves to WorkItem before Item), then the file's own package, then contract name and key, so the
 * result never depends on iteration order. Only a key that declares its own brand claims a name.
 *
 * USAGE:
 * ownerIndexNameMatchTransformer({ ownerIndex, packageName, name: 'parentQuestId' });
 * // Returns OwnerIndexMatch for Quest.id, or undefined when no reachable owner claims the name
 */
import { ownerIndexMatchContract } from '../../contracts/owner-index-match/owner-index-match-contract';
import type { OwnerIndexMatch } from '../../contracts/owner-index-match/owner-index-match-contract';
import type { OwnerIndex } from '../../contracts/owner-index/owner-index-contract';
import type { PackageName } from '../../contracts/package-name/package-name-contract';
import { camelWordsSplitTransformer } from '../camel-words-split/camel-words-split-transformer';
import { ownerIndexOwnersReachableTransformer } from '../owner-index-owners-reachable/owner-index-owners-reachable-transformer';

export const ownerIndexNameMatchTransformer = ({
  ownerIndex,
  packageName,
  name,
}: {
  ownerIndex: OwnerIndex;
  packageName: PackageName;
  name: string;
}): OwnerIndexMatch | undefined => {
  const nameWords = camelWordsSplitTransformer({ text: name });

  const [best] = ownerIndexOwnersReachableTransformer({ ownerIndex, packageName })
    .flatMap((owner) =>
      owner.fields
        .filter((field) => field.kind === 'own-brand')
        .map((field) => ({
          owner,
          field,
          targetWords: [
            ...camelWordsSplitTransformer({ text: owner.ownerName }),
            ...camelWordsSplitTransformer({ text: field.key }),
          ],
        })),
    )
    .filter(({ targetWords }) =>
      targetWords.every(
        (word, index) => nameWords[nameWords.length - targetWords.length + index] === word,
      ),
    )
    .sort(
      (left, right) =>
        right.targetWords.length - left.targetWords.length ||
        Number(right.owner.packageName === packageName) -
          Number(left.owner.packageName === packageName) ||
        left.owner.contractName.localeCompare(right.owner.contractName) ||
        left.field.key.localeCompare(right.field.key),
    );

  return best === undefined
    ? undefined
    : ownerIndexMatchContract.parse({ owner: best.owner, field: best.field });
};
