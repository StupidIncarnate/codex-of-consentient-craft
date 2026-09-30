/**
 * PURPOSE: Reduces a resolved command string down to its first whitespace-separated token — the
 * exact-match unit `bin-program-spawn-ban` compares against a known program name, so a program that
 * merely STARTS WITH a known name ('gitk') is never read as that name ('git').
 *
 * USAGE:
 * firstWordTransformer({ text: contentTextContract.parse('git status') });
 * // Returns 'git' as ContentText
 */

const FIRST_WORD_PATTERN = /^\S+/u;

export const firstWordTransformer = ({ text }: { text: string }): string | undefined => {
  const match = FIRST_WORD_PATTERN.exec(text.trim());
  return match === null ? undefined : match[0];
};
