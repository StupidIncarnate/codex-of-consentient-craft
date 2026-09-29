/**
 * PURPOSE: Splits an identifier on its camelCase word boundaries, every word lowercase. Reach for
 * this to match a name against an owner's name by whole words: `requestId` is `request`, `id`, so it
 * does not end in `quest`, `id`, although its raw text ends in "questId".
 *
 * USAGE:
 * identifierCamelWordsTransformer({ identifier: identifierContract.parse('parentQuestId') });
 * // Returns ['parent', 'quest', 'id']
 */
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Identifier } from '@dungeonmaster/shared/contracts';

export const identifierCamelWordsTransformer = ({
  identifier,
}: {
  identifier: Identifier;
}): Identifier[] =>
  (identifier.match(/[A-Z]+(?![a-z])|[A-Z]?[a-z0-9]+/gu) ?? []).map((word) =>
    identifierContract.parse(word.toLowerCase()),
  );
