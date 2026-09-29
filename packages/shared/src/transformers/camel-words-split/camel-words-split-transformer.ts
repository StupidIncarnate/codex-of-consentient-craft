/**
 * PURPOSE: Splits a camelCase or PascalCase name into lowercase words on capital boundaries, keeping
 * an acronym run together (`parseURLPath` gives parse, url, path). Reach for this when two names must
 * be compared word by word: `requestId` ends in the letters "questId" but not in the words quest, id.
 *
 * USAGE:
 * camelWordsSplitTransformer({ text: 'parentQuestId' });
 * // Returns ['parent', 'quest', 'id']
 */
import { identifierContract } from '../../contracts/identifier/identifier-contract';
import type { Identifier } from '../../contracts/identifier/identifier-contract';

export const camelWordsSplitTransformer = ({ text }: { text: string }): Identifier[] =>
  text
    .replace(/([a-z0-9])([A-Z])/gu, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/gu, '$1 $2')
    .split(' ')
    .filter((word) => word.length > 0)
    .map((word) => identifierContract.parse(word.toLowerCase()));
