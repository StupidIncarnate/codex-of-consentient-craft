/**
 * PURPOSE: Scans one line of a config file for quoted string literals that sit in ARRAY-ENTRY
 * position — preceded, ignoring whitespace, by `[` or `,` (or nothing else on the line), and
 * followed the same way by `,` or `]` (or nothing else) — so a JSON/JS object key (`"exclude":
 * […]`), a `//` line comment, and a quoted substring inside one are never returned as entries.
 * Scanning stops at the first unquoted `//`, which is what keeps a trailing or a whole-line comment
 * out of the result without needing a full parser. Reach for this from
 * ArrayEntryAnchorInsertLayerResponder, which needs the same entry list whether the array spreads
 * one entry per line or is packed onto a single line.
 *
 * USAGE:
 * ArrayEntryLineParseLayerResponder({ line: '  "exclude": ["node_modules", "worktrees"],' });
 * // Returns { entries: [
 * //   { value: 'node_modules', start: 14, end: 29, quoteChar: '"' },
 * //   { value: 'worktrees', start: 31, end: 42, quoteChar: '"' },
 * // ] } — "exclude" itself is dropped: it is followed by `:`, not `,`/`]`.
 */

import {
  arrayIndexContract,
  fileContentsContract,
  type ArrayIndex,
  type FileContents,
} from '@dungeonmaster/shared/contracts';

export const ArrayEntryLineParseLayerResponder = ({
  line,
}: {
  line: string;
}): {
  entries: readonly {
    value: FileContents;
    start: ArrayIndex;
    end: ArrayIndex;
    quoteChar: FileContents;
  }[];
} => {
  const candidates: {
    value: FileContents;
    start: ArrayIndex;
    end: ArrayIndex;
    quoteChar: FileContents;
  }[] = [];
  // One object, not three `let`s: `@typescript-eslint/init-declarations` demands a nullable `let`
  // carry an initializer and `no-undef-init` then strips an `= undefined` one straight back off,
  // an oscillation ward's --fix pass cannot resolve on its own. A property on an object literal is
  // a plain assignment, not a variable declaration, so neither rule reaches it.
  const openQuote: { char: FileContents | undefined; start: ArrayIndex; content: FileContents } = {
    char: undefined,
    start: arrayIndexContract.parse(0),
    content: fileContentsContract.parse(''),
  };

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i] ?? '';
    if (openQuote.char !== undefined) {
      if (char === openQuote.char) {
        candidates.push({
          value: openQuote.content,
          start: openQuote.start,
          end: arrayIndexContract.parse(i + 1),
          quoteChar: openQuote.char,
        });
        openQuote.char = undefined;
        openQuote.content = fileContentsContract.parse('');
      } else {
        openQuote.content = fileContentsContract.parse(openQuote.content + char);
      }
      continue;
    }
    // A `//` reached outside any quote starts a line comment — everything from here on is text,
    // never an array entry, however many quote characters it goes on to carry.
    if (char === '/' && (line[i + 1] ?? '') === '/') {
      break;
    }
    if (char === "'" || char === '"') {
      openQuote.char = fileContentsContract.parse(char);
      openQuote.start = arrayIndexContract.parse(i);
      openQuote.content = fileContentsContract.parse('');
    }
  }

  const entries = candidates.filter((candidate) => {
    const before = line.slice(0, candidate.start).trimEnd();
    const after = line.slice(candidate.end).trimStart();
    const sitsAfterAnOpenerOrSeparator =
      before === '' || before.endsWith('[') || before.endsWith(',');
    const sitsBeforeASeparatorOrCloser =
      after === '' || after.startsWith(',') || after.startsWith(']');
    return sitsAfterAnOpenerOrSeparator && sitsBeforeASeparatorOrCloser;
  });

  return { entries };
};
