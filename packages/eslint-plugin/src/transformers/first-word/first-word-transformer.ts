/**
 * PURPOSE: Reduces a resolved command string down to its first whitespace-separated token — the
 * exact-match unit `bin-program-spawn-ban` compares against a known program name, so a program that
 * merely STARTS WITH a known name ('gitk') is never read as that name ('git').
 *
 * USAGE:
 * firstWordTransformer({ text: contentTextContract.parse('git status') });
 * // Returns 'git' as ContentText
 */
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

const FIRST_WORD_PATTERN = /^\S+/u;

export const firstWordTransformer = ({ text }: { text: ContentText }): ContentText | undefined => {
  const match = FIRST_WORD_PATTERN.exec(text.trim());
  return match === null ? undefined : contentTextContract.parse(match[0]);
};
