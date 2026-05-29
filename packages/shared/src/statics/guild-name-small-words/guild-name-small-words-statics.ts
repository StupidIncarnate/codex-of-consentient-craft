/**
 * PURPOSE: The locked list of small words that folderNameToGuildNameTransformer lowercases when they are not the first word of a guild name
 *
 * USAGE:
 * guildNameSmallWordsStatics.words; // ['of', 'the', 'and', 'a', 'an', 'in', 'on', 'for', 'to', 'at', 'by']
 *
 * WHEN-TO-USE: folderNameToGuildNameTransformer Title Casing a folder basename into a display guild name
 */

export const guildNameSmallWordsStatics = {
  words: ['of', 'the', 'and', 'a', 'an', 'in', 'on', 'for', 'to', 'at', 'by'],
} as const;
