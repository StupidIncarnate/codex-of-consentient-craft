/**
 * PURPOSE: Derives the one brand text B3 allows: the owner's name (its const, minus the `Contract`
 * suffix) followed by each key on the path down to the value, every segment in PascalCase. Reach for
 * this instead of composing a text by hand, so the rule's message, its fix and its comparison can
 * never disagree about what the text is.
 *
 * USAGE:
 * brandTextDeriveTransformer({ path: ['questContract', 'used_percentage'] });
 * // Returns 'QuestUsedPercentage'
 */

const CONTRACT_SUFFIX = 'Contract';

export const brandTextDeriveTransformer = ({ path }: { path: readonly string[] }): string =>
  path
    .map((segment, index) =>
      index === 0 && segment.endsWith(CONTRACT_SUFFIX) && segment !== CONTRACT_SUFFIX
        ? segment.slice(0, -CONTRACT_SUFFIX.length)
        : segment,
    )
    .flatMap((segment) => segment.split(/[_\-\s]+/u))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
