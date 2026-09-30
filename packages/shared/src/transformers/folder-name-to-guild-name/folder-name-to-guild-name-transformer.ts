/**
 * PURPOSE: Converts a folder basename (e.g. 'codex-of-consentient-craft') into a Title Case guild display name (e.g. 'Codex of Consentient Craft')
 *
 * USAGE:
 * folderNameToGuildNameTransformer({ folderName: 'codex-of-consentient-craft' });
 * // Returns: GuildName('Codex of Consentient Craft')
 *
 * WHEN-TO-USE: Auto-deriving a guild name from a repo root folder when registering a new guild
 */

import { guildNameSmallWordsStatics } from '../../statics/guild-name-small-words/guild-name-small-words-statics';

const CAMEL_CASE_BOUNDARY_PATTERN = /([a-z0-9])([A-Z])/gu;
const WORD_SEPARATOR_PATTERN = /[-_. ]+/u;

export const folderNameToGuildNameTransformer = ({
  folderName,
}: {
  folderName: string;
}): string => {
  const words = folderName
    .replace(CAMEL_CASE_BOUNDARY_PATTERN, '$1 $2')
    .split(WORD_SEPARATOR_PATTERN)
    .filter((word) => word.length > 0);

  const titleCased = words.map((word, index) => {
    const lower = word.toLowerCase();

    if (index > 0 && guildNameSmallWordsStatics.words.some((small) => small === lower)) {
      return lower;
    }

    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });

  return titleCased.join(' ');
};
