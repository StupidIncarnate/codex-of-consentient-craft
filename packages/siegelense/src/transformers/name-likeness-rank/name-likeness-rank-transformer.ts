/**
 * PURPOSE: Orders a page's testIds by how closely each resembles the name a failed step was looking
 * for, most alike first, so a NO MATCH answer can show the top few rather than every name on the
 * page in document order. A misremembered testId is the common case, and on a dense page the right
 * one is lost in an unranked wall of names. The missing name is the `data-testid` value inside
 * `target` when it has one, and the whole selector otherwise. Likeness is case-insensitive: a name
 * that contains the missing one (or is contained by it) ranks ahead of one that does not, then more
 * shared `_`/`-` separated words rank first, then fewer edits. Equal scores keep document order.
 * Duplicate names collapse to their first appearance.
 *
 * USAGE:
 * nameLikenessRankTransformer({ target: '[data-testid="GUILD_ADD"]', names: ['PIXEL_BTN', 'GUILD_LIST', 'GUILD_ADD_BTN'] });
 * // Returns ['GUILD_ADD_BTN', 'GUILD_LIST', 'PIXEL_BTN']
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

const TESTID_PATTERN = /data-testid\s*=\s*["']([^"']*)["']/u;
const WORD_SEPARATOR = /[_\-\s]+/u;

export const nameLikenessRankTransformer = ({
  target,
  names,
}: {
  target: string;
  names: readonly string[];
}): readonly ContentText[] => {
  const testIdMatch = TESTID_PATTERN.exec(target);
  const wanted = (testIdMatch?.[1] ?? target).toLowerCase();
  const wantedWords = new Set(wanted.split(WORD_SEPARATOR).filter((word) => word.length > 0));

  const unique = [...new Set(names)];

  const scored = unique.map((name, position) => {
    const candidate = name.toLowerCase();
    const contains =
      wanted.length > 0 && (candidate.includes(wanted) || wanted.includes(candidate)) ? 1 : 0;
    const sharedWords = candidate
      .split(WORD_SEPARATOR)
      .filter((word) => word.length > 0 && wantedWords.has(word)).length;

    // Levenshtein distance over one rolling row; `row[j]` is the distance between the first `i`
    // characters of `wanted` and the first `j` of `candidate`.
    const row = Array.from({ length: candidate.length + 1 }, (_unused, column) => column);
    for (let i = 1; i <= wanted.length; i += 1) {
      let diagonal = row[0] ?? 0;
      row[0] = i;
      for (let j = 1; j <= candidate.length; j += 1) {
        const above = row[j] ?? 0;
        const left = row[j - 1] ?? 0;
        const substitution = diagonal + (wanted[i - 1] === candidate[j - 1] ? 0 : 1);
        row[j] = Math.min(above + 1, left + 1, substitution);
        diagonal = above;
      }
    }
    const edits = row[candidate.length] ?? 0;

    return { name, position, contains, sharedWords, edits };
  });

  const ranked = [...scored].sort(
    (a, b) =>
      b.contains - a.contains ||
      b.sharedWords - a.sharedWords ||
      a.edits - b.edits ||
      a.position - b.position,
  );

  return ranked.map((entry) => contentTextContract.parse(entry.name));
};
