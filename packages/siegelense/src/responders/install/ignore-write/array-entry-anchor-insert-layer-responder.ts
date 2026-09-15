/**
 * PURPOSE: Finds the array entry in a config file whose value matches one of the given anchor
 * shapes, and inserts a new entry beside it carrying the anchor's own quote character,
 * trailing-comma style, AND VALUE SHAPE — never touching the rest of the file. The inserted value is
 * `entryValueCandidates[i]`, where `i` is the position the matched anchor holds in
 * `anchorValueCandidates` — the two lists are POSITIONAL PAIRS (bare / trailing-slash / `/**` for a
 * glob array, or their regex equivalents), so a bare `worktrees` anchor gets a bare sibling, never
 * the `/**` shape a `worktrees/**` anchor would have earned. Reach for this whenever an install
 * responder needs to sit a new entry next to an existing `worktrees` entry without reformatting a
 * consumer's file (a `JSON.parse`/`JSON.stringify` round-trip on `tsconfig.json` would strip its
 * comments; a full reformat of an eslint or jest config would erase a hand-chosen quote style).
 * Callers own the shape of both value lists, because a glob array (eslint `ignores`, tsconfig
 * `exclude`) and a regex array (jest `testPathIgnorePatterns`) want different characters around the
 * same directory name.
 *
 * An array spread one entry per line gets a new line of its own, copying the anchor line's indent —
 * prettier only breaks a short array across lines once it exceeds print width, so a two- or
 * three-entry `exclude`/`ignores`/`testPathIgnorePatterns` is just as often packed onto ONE line, and
 * that shape gets its sibling inserted INLINE, right after the anchor entry, copying whatever
 * separator already sits between that line's other entries (falling back to `, ` when the anchor is
 * the only entry on the line). ArrayEntryLineParseLayerResponder decides, per line, which quoted
 * substrings are real array entries — never a JSON/JS key, never a comment — and this file decides,
 * per anchor, whether its line holds that entry alone (own-line insert) or shares the line with
 * others (inline insert).
 *
 * USAGE:
 * ArrayEntryAnchorInsertLayerResponder({
 *   content: "  ignores: [\n    'worktrees/**',\n  ],",
 *   anchorValueCandidates: ['worktrees', 'worktrees/', 'worktrees/**'],
 *   entryValueCandidates: ['.siegelense', '.siegelense/', '.siegelense/**'],
 * });
 * // Returns { content: <FileContents with the new line inserted>, inserted: true,
 * //   alreadyPresent: false, matchedEntryValue: '.siegelense/**' } — entryValueCandidates[2],
 * //   because the anchor matched anchorValueCandidates[2] ('worktrees/**')
 *
 * ArrayEntryAnchorInsertLayerResponder({
 *   content: '  "exclude": ["node_modules", "worktrees"]',
 *   anchorValueCandidates: ['worktrees', 'worktrees/', 'worktrees/**'],
 *   entryValueCandidates: ['.siegelense', '.siegelense/', '.siegelense/**'],
 * });
 * // Returns { content: '  "exclude": ["node_modules", "worktrees", ".siegelense"]', inserted: true,
 * //   alreadyPresent: false, matchedEntryValue: '.siegelense' } — inserted INLINE, no new line
 */

import { fileContentsContract, type FileContents } from '@dungeonmaster/shared/contracts';
import { ArrayEntryLineParseLayerResponder } from './array-entry-line-parse-layer-responder';

const DEFAULT_INLINE_SEPARATOR = ', ';

export const ArrayEntryAnchorInsertLayerResponder = ({
  content,
  anchorValueCandidates,
  entryValueCandidates,
}: {
  content: string;
  anchorValueCandidates: readonly string[];
  entryValueCandidates: readonly string[];
}): {
  content: FileContents;
  inserted: boolean;
  alreadyPresent: boolean;
  matchedEntryValue: FileContents | undefined;
} => {
  const lines = content.split('\n');
  const perLineEntries = lines.map((line) => ArrayEntryLineParseLayerResponder({ line }).entries);

  // One flattened, file-order list of every array entry on every line, so "first match" means the
  // same thing it did when this file only ever saw one entry per line.
  const flattenedEntries = perLineEntries.flatMap((entries, lineIndex) =>
    entries.map((entry) => ({ lineIndex, entry })),
  );

  const anchorMatch = flattenedEntries.find(({ entry }) =>
    anchorValueCandidates.includes(entry.value),
  );
  const presentMatch = flattenedEntries.find(({ entry }) =>
    entryValueCandidates.includes(entry.value),
  );
  const alreadyPresent = presentMatch !== undefined;

  if (anchorMatch === undefined || alreadyPresent) {
    return {
      content: fileContentsContract.parse(content),
      inserted: false,
      alreadyPresent,
      matchedEntryValue:
        presentMatch === undefined
          ? undefined
          : fileContentsContract.parse(presentMatch.entry.value),
    };
  }

  // entryValueCandidates and anchorValueCandidates are positional pairs — the shape at this index
  // in the anchor list is the shape the new entry takes too.
  const shapeIndex = anchorValueCandidates.indexOf(anchorMatch.entry.value);
  const newEntryValue = entryValueCandidates[shapeIndex];
  if (newEntryValue === undefined) {
    throw new Error(
      `entryValueCandidates has no entry at index ${shapeIndex} to match anchor shape "${anchorMatch.entry.value}" — anchorValueCandidates and entryValueCandidates must be the same length, in the same shape order.`,
    );
  }

  const anchorLine = lines[anchorMatch.lineIndex] ?? '';
  const { entry } = anchorMatch;
  const { quoteChar } = entry;

  // Whole-line means removing the entry (and one adjoining comma) leaves nothing else on the line —
  // the shape every entry takes when the array is spread one per line. Anything left over after that
  // removal means other entries share the line, so the insert has to happen INLINE instead.
  const before = anchorLine.slice(0, entry.start);
  const afterEntry = anchorLine.slice(entry.end).trimStart();
  const afterEntryWithoutOneComma = afterEntry.startsWith(',') ? afterEntry.slice(1) : afterEntry;
  const isWholeLineEntry = before.trim() === '' && afterEntryWithoutOneComma.trim() === '';

  if (isWholeLineEntry) {
    const indent = anchorLine.slice(0, anchorLine.length - anchorLine.trimStart().length);
    const anchorHasTrailingComma = anchorLine.trimEnd().endsWith(',');
    // The anchor may be the LAST entry in its array — the only legal shape in strict JSON, which
    // tsconfig.json's `exclude` array is. Inserting a sibling after it with no separator would leave
    // two array entries with nothing between them, so a comma-less anchor is rewritten to carry the
    // comma the new entry now needs, and the new entry — now last — carries none.
    const rewrittenAnchorLine = anchorHasTrailingComma ? anchorLine : `${anchorLine.trimEnd()},`;
    const newEntryLine = `${indent}${quoteChar}${newEntryValue}${quoteChar}${anchorHasTrailingComma ? ',' : ''}`;

    const newLines = [
      ...lines.slice(0, anchorMatch.lineIndex),
      rewrittenAnchorLine,
      newEntryLine,
      ...lines.slice(anchorMatch.lineIndex + 1),
    ];

    return {
      content: fileContentsContract.parse(newLines.join('\n')),
      inserted: true,
      alreadyPresent: false,
      matchedEntryValue: fileContentsContract.parse(newEntryValue),
    };
  }

  // The array is packed onto one line alongside the anchor. Copy whatever separator already sits
  // between that line's entries — a following one when the anchor has a next entry, else a
  // preceding one — so the sibling reads as though it was always part of the same list. An anchor
  // with no other entry on its line (a single-entry inline array) has no separator to copy, so ", "
  // is the fallback.
  const lineEntries = perLineEntries[anchorMatch.lineIndex] ?? [];
  const localIndex = lineEntries.indexOf(entry);
  const nextEntry = lineEntries[localIndex + 1];
  const previousEntry = lineEntries[localIndex - 1];
  const separator =
    nextEntry === undefined
      ? previousEntry === undefined
        ? DEFAULT_INLINE_SEPARATOR
        : anchorLine.slice(previousEntry.end, entry.start)
      : anchorLine.slice(entry.end, nextEntry.start);

  const newAnchorLine = `${anchorLine.slice(0, entry.end)}${separator}${quoteChar}${newEntryValue}${quoteChar}${anchorLine.slice(entry.end)}`;
  const newLines = [
    ...lines.slice(0, anchorMatch.lineIndex),
    newAnchorLine,
    ...lines.slice(anchorMatch.lineIndex + 1),
  ];

  return {
    content: fileContentsContract.parse(newLines.join('\n')),
    inserted: true,
    alreadyPresent: false,
    matchedEntryValue: fileContentsContract.parse(newEntryValue),
  };
};
