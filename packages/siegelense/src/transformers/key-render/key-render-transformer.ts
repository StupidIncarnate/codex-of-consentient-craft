/**
 * PURPOSE: Turns a `KeyListing` into the text tree a session actually reads — the ref column, the
 * indentation that IS scope, the element column, text/value, attrs and flags, with the duplicate and
 * truncation lines underneath. Reach for this over reading `listing.rows` directly: **the key is the
 * PRIMARY navigation surface, not a companion to the picture** (siegelense-tooling.md line 361) — the
 * one trial arm that had both rendered three maps and opened none, reporting that testIds were
 * legible straight from the key — so the rendering is the deliverable rather than a convenience, and
 * one renderer is what stops two callers disagreeing about what a row looks like.
 *
 * Separate from the adapter that gathers the rows precisely so the rendering is testable without a
 * browser.
 *
 * Three rendering decisions, each carrying a reason:
 *
 * - **The tag prints even when a testId does.** `PIXEL_BTN` does not say whether it is a `<button>` a
 *   keyboard can reach or a `<div>` with a click handler that a keyboard cannot (line 395). An
 *   element with no testId prints as its tag alone — `(p)` — and `role` sits inside the brackets with
 *   the tag, because it is part of what the element IS rather than something it carries (line 537).
 * - **A zero-row key SAYS it is empty.** A reading that comes back blank is the `count: 0` problem —
 *   indistinguishable from a page that failed to paint — which is the whole failure this design
 *   exists to remove (line 352).
 * - **`href` prints as its arrow alone**, with no `href=` prefix, because the column already spent
 *   its width on the path and `→ /queue` is the compact form the element column set (line 411).
 *
 * USAGE:
 * keyRenderTransformer({ listing: KeyListingStub({ rows: [KeyRowStub()] }) });
 * // Returns the rendered key as ContentText, ready to be a step's own reading
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { KeyListing } from '../../contracts/key-listing/key-listing-contract';

const COLUMN_GAP = '  ';
const INDENT_UNIT = '  ';
const HEADINGS = {
  ref: 'ref',
  element: 'element',
  text: 'text / value',
  attrs: 'attrs',
  flags: 'flags',
} as const;

export const keyRenderTransformer = ({ listing }: { listing: KeyListing }): ContentText => {
  const scope = listing.within === null ? '' : ` within ${listing.within}`;
  const summary = `key: ${String(listing.rows.length)} rows${scope}`;

  if (listing.rows.length === 0) {
    return contentTextContract.parse(
      [
        summary,
        'Nothing here is addressable — no element carries a data-testid, its own text, a control or an image. If the page should have painted by now, that IS the finding.',
        ...listing.truncated,
      ].join('\n'),
    );
  }

  const cells = listing.rows.map((row) => {
    const roleSuffix = row.role === null ? '' : ` role=${row.role}`;
    const named =
      row.testId === null ? `(${row.tag}${roleSuffix})` : `${row.testId} <${row.tag}${roleSuffix}>`;
    const domIdSuffix = row.domId === null ? '' : ` #${row.domId}`;
    const siblingSuffix = row.sibling === null ? '' : ` [${row.sibling}]`;

    const attrParts = row.attrs.map((attr) => {
      const asPair = attr.name === 'href' ? attr.value : `${attr.name}=${attr.value}`;
      return attr.value === '' ? attr.name : asPair;
    });
    const withOverflow =
      row.attrsDropped === 0 ? attrParts : [...attrParts, `+${String(row.attrsDropped)} more`];

    return {
      ref: String(row.ref),
      element: `${INDENT_UNIT.repeat(row.depth)}${named}${domIdSuffix}${siblingSuffix}`,
      text: [
        row.text === null ? null : `"${row.text}"`,
        row.value === null ? null : `"${row.value}"`,
        row.placeholder === null ? null : `ph:"${row.placeholder}"`,
      ]
        .filter((part) => part !== null)
        .join(' '),
      attrs: withOverflow.join(' '),
      flags: row.flags
        .map((flag) => {
          const detail = Object.entries(row.flagDetail).find(([name]) => name === flag)?.[1];
          return detail === undefined ? String(flag) : `${String(flag)} ${detail}`;
        })
        .join(' '),
    };
  });

  const widths = {
    ref: Math.max(HEADINGS.ref.length, ...cells.map((cell) => cell.ref.length)),
    element: Math.max(HEADINGS.element.length, ...cells.map((cell) => cell.element.length)),
    text: Math.max(HEADINGS.text.length, ...cells.map((cell) => cell.text.length)),
    attrs: Math.max(HEADINGS.attrs.length, ...cells.map((cell) => cell.attrs.length)),
    flags: Math.max(HEADINGS.flags.length, ...cells.map((cell) => cell.flags.length)),
  };

  const header = [
    HEADINGS.ref.padStart(widths.ref),
    HEADINGS.element.padEnd(widths.element),
    HEADINGS.text.padEnd(widths.text),
    HEADINGS.attrs.padEnd(widths.attrs),
    HEADINGS.flags,
  ].join(COLUMN_GAP);

  const rule = [
    '-'.repeat(widths.ref),
    '-'.repeat(widths.element),
    '-'.repeat(widths.text),
    '-'.repeat(widths.attrs),
    '-'.repeat(widths.flags),
  ].join(COLUMN_GAP);

  const rows = cells.map((cell) =>
    [
      cell.ref.padStart(widths.ref),
      cell.element.padEnd(widths.element),
      cell.text.padEnd(widths.text),
      cell.attrs.padEnd(widths.attrs),
      cell.flags,
    ]
      .join(COLUMN_GAP)
      .trimEnd(),
  );

  return contentTextContract.parse(
    [summary, header, rule, ...rows, ...listing.duplicates, ...listing.truncated].join('\n'),
  );
};
