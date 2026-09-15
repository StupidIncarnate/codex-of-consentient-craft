/**
 * PURPOSE: Finds the line in a config file's quoted-string array whose value matches one of the
 * given anchor shapes, and inserts a new quoted line beside it carrying the anchor's own indent,
 * quote character and trailing-comma style — never touching the rest of the file. Reach for this
 * whenever an install responder needs to sit a new entry next to an existing `worktrees` entry
 * without reformatting a consumer's file (a `JSON.parse`/`JSON.stringify` round-trip on
 * `tsconfig.json` would strip its comments; a full reformat of an eslint or jest config would erase
 * a hand-chosen quote style). Callers own the shape of both value lists AND the literal text of the
 * new entry, because a glob array (eslint `ignores`, tsconfig `exclude`) and a regex array (jest
 * `testPathIgnorePatterns`) want different characters around the same directory name.
 *
 * USAGE:
 * ArrayEntryAnchorInsertLayerResponder({
 *   content: "  ignores: [\n    'worktrees/**',\n  ],",
 *   anchorValueCandidates: ['worktrees', 'worktrees/', 'worktrees/**'],
 *   entryValueCandidates: ['.siegelense', '.siegelense/', '.siegelense/**'],
 *   newEntryValue: '.siegelense/**',
 * });
 * // Returns { content: <FileContents with the new line inserted>, inserted: true, alreadyPresent: false }
 */

import { fileContentsContract, type FileContents } from '@dungeonmaster/shared/contracts';

export const ArrayEntryAnchorInsertLayerResponder = ({
  content,
  anchorValueCandidates,
  entryValueCandidates,
  newEntryValue,
}: {
  content: string;
  anchorValueCandidates: readonly string[];
  entryValueCandidates: readonly string[];
  newEntryValue: string;
}): { content: FileContents; inserted: boolean; alreadyPresent: boolean } => {
  const lines = content.split('\n');

  // One parse per line: the quoted VALUE an array-entry line carries, or undefined when the line
  // is not a quoted array-entry line at all.
  const arrayEntryValues = lines.map((line) => {
    const trimmed = line.trim();
    const quoteChar = trimmed.startsWith("'") ? "'" : trimmed.startsWith('"') ? '"' : undefined;
    if (quoteChar === undefined) {
      return undefined;
    }
    const afterOpenQuote = trimmed.slice(1);
    const closeQuoteIndex = afterOpenQuote.indexOf(quoteChar);
    return closeQuoteIndex === -1 ? undefined : afterOpenQuote.slice(0, closeQuoteIndex);
  });

  const anchorIndex = arrayEntryValues.findIndex(
    (value) => value !== undefined && anchorValueCandidates.includes(value),
  );
  const alreadyPresent = arrayEntryValues.some(
    (value) => value !== undefined && entryValueCandidates.includes(value),
  );

  if (anchorIndex === -1 || alreadyPresent) {
    return { content: fileContentsContract.parse(content), inserted: false, alreadyPresent };
  }

  const anchorLine = lines[anchorIndex] ?? '';
  const indent = anchorLine.slice(0, anchorLine.length - anchorLine.trimStart().length);
  const quoteChar = anchorLine.trim().startsWith('"') ? '"' : "'";
  const anchorHasTrailingComma = anchorLine.trimEnd().endsWith(',');
  // The anchor may be the LAST entry in its array — the only legal shape in strict JSON, which
  // tsconfig.json's `exclude` array is. Inserting a sibling after it with no separator would leave
  // two array entries with nothing between them, so a comma-less anchor is rewritten to carry the
  // comma the new entry now needs, and the new entry — now last — carries none.
  const rewrittenAnchorLine = anchorHasTrailingComma ? anchorLine : `${anchorLine.trimEnd()},`;
  const newEntryLine = `${indent}${quoteChar}${newEntryValue}${quoteChar}${anchorHasTrailingComma ? ',' : ''}`;

  const newLines = [
    ...lines.slice(0, anchorIndex),
    rewrittenAnchorLine,
    newEntryLine,
    ...lines.slice(anchorIndex + 1),
  ];

  return {
    content: fileContentsContract.parse(newLines.join('\n')),
    inserted: true,
    alreadyPresent: false,
  };
};
