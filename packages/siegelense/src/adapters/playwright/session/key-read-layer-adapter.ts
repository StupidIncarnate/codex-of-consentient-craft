/**
 * PURPOSE: The KEY's two halves — the ONE page-side source string that walks the DOM and the Node-
 * side translation that turns its raw rows into a `KeyListing`. Reach for this over `describeMatches`
 * when the question is "what is on this screen" rather than "which of these several matched": the
 * key is the PRIMARY navigation surface, a listing rather than a selector, and it is the answer to
 * both that question and "how do I address the second of two identical controls".
 *
 * **One evaluate, never N.** The whole flag set is cheap at the scale measured — a `getComputedStyle`
 * and an `elementFromPoint` each, on a page that already had its layout computed — while a
 * per-element round trip would not be, and a per-element CDP call is the route the spec rules out by
 * name (siegelense-tooling.md lines 497, 553).
 *
 * Four rules the source string holds, each recording a measured failure:
 *
 * - **`querySelectorAll` only, never `querySelector`.** Singular silently returns match one, which
 *   is `.first()` wearing a different name, and lint cannot see inside a template literal to catch
 *   it (`packages/siegelense/CLAUDE.md`).
 * - **Own text nodes, never `textContent`.** Text is read off child nodes with `nodeType === 3` via
 *   `nodeValue`; the word `textContent` appears nowhere in the source, and a test asserts that. A
 *   recursive read once pulled an entire Mantine stylesheet into one reading (line 570).
 * - **Document order, never position order.** Sorting by y-coordinate scattered a three-item list
 *   across rows 18, 22 and 24, because the page has two side-by-side panels whose rows interleave
 *   vertically (line 567).
 * - **`opacity: 0` is FLAGGED, not excluded.** It is the one invisibility that carries a box, a rect
 *   and a hit area, so excluding it alongside `display: none` and `visibility: hidden` would delete
 *   a defect from the reading instead of reporting one (line 575).
 *
 * An element earns a row by being ADDRESSABLE — a testId, own text, a control, or an image — which
 * is the whole mechanism behind "intermediate wrapper divs collapse out on their own" (line 572).
 * Nothing prunes them; they simply never qualify. `depth` counts ancestors that are themselves rows,
 * so the indentation IS scope.
 *
 * USAGE:
 * const key = keyReadLayerAdapter();
 * const raw = await page.evaluate(key.readSource({ within: null }));
 * key.toListing({ raw, within: null });
 * // Returns a KeyListing whose `rendered` is the text tree a session reads
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { keyListingContract } from '../../../contracts/key-listing/key-listing-contract';
import type { KeyListing } from '../../../contracts/key-listing/key-listing-contract';
import { keyReadingContract } from '../../../contracts/key-reading/key-reading-contract';
import { keyRowContract } from '../../../contracts/key-row/key-row-contract';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';
import type { Selector } from '../../../contracts/selector/selector-contract';
import { keyStatics } from '../../../statics/key/key-statics';
import { refStatics } from '../../../statics/ref/ref-statics';
import { attrsBudgetTransformer } from '../../../transformers/attrs-budget/attrs-budget-transformer';
import { keyRenderTransformer } from '../../../transformers/key-render/key-render-transformer';

const DOCUMENT_ROOT_LABEL = '(document root)';
// `closest` against this answers "can a keyboard reach this, or anything it sits inside" — which is
// the question `not-tabbable` is a proxy for. Self-inclusive, because `closest` starts at the
// element itself.
const REACHABLE_SELECTOR = 'a[href],button,input,select,textarea,summary,[tabindex]';

// Every knob the walk reads is embedded as JSON into a self-invoking call. Playwright only threads
// an `arg` into a REAL function reference — its client tags a call with
// `isFunction: typeof pageFunction === 'function'`, and a source STRING fails that test — so an
// un-called function fails to serialize and comes back `undefined`. Embedding the parameters makes
// the whole expression BE the call, which is the shape `describeMatches` already uses.
const READ_SOURCE_BODY = `(params) => {
  if (window.${refStatics.registry.globalName} === undefined) { window.${refStatics.registry.globalName} = { ${refStatics.registry.arrayName}: [] }; }
  const registry = window.${refStatics.registry.globalName}.${refStatics.registry.arrayName};
  const rows = [];
  const skipped = [];

  const note = (label) => {
    const existing = skipped.filter((entry) => entry.under === label);
    if (existing.length === 0) { skipped.push({ under: label, count: 1 }); return; }
    existing[0].count += 1;
  };

  const ownText = (element) => {
    let text = '';
    element.childNodes.forEach((node) => {
      if (node.nodeType === 3) { text += node.nodeValue || ''; }
    });
    return text.split(/\\s+/u).join(' ').trim();
  };

  const channels = (colour) => {
    const open = colour.indexOf('(');
    const close = colour.indexOf(')');
    if (open === -1 || close === -1) { return null; }
    const parts = colour.slice(open + 1, close).split(',').map((part) => parseFloat(part.trim()));
    if (parts.length < 3) { return null; }
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };

  const luminance = (rgb) => {
    const channel = (raw) => {
      const scaled = raw / 255;
      return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
  };

  const backdrop = (element) => {
    let walker = element;
    while (walker !== null) {
      const rgb = channels(getComputedStyle(walker).backgroundColor);
      if (rgb !== null && rgb.a > 0) { return rgb; }
      walker = walker.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };

  const hasContentDescendant = (element) => {
    if (element.querySelectorAll(params.contentSelector).length > 0) { return true; }
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node !== null) {
      if ((node.nodeValue || '').trim() !== '') { return true; }
      node = walker.nextNode();
    }
    return false;
  };

  const labelOf = (element) => {
    const testId = element.getAttribute('data-testid');
    return testId === null ? element.tagName.toLowerCase() : testId;
  };

  const visit = (element, depth, parentRef, nearestLabel) => {
    const tag = element.tagName.toLowerCase();
    if (params.excludedTags.indexOf(tag) !== -1) { return; }

    const style = getComputedStyle(element);
    if (style.display === 'none') { return; }

    const rect = element.getBoundingClientRect();
    const sized = rect.width > 0 || rect.height > 0;
    const testId = element.getAttribute('data-testid');
    const text = ownText(element);
    const interactive = element.matches(params.interactiveSelector);
    const contentful = params.contentTags.indexOf(tag) !== -1;
    const isRow = sized && style.visibility !== 'hidden' && (testId !== null || text !== '' || interactive || contentful);

    let ownRef = parentRef;
    let ownDepth = depth;
    let ownLabel = nearestLabel;

    if (isRow) {
      if (depth > params.maxDepth || rows.length >= params.maxRows) { note(nearestLabel); return; }

      let index = registry.indexOf(element);
      if (index === -1) { registry.push(element); index = registry.length - 1; }
      const ref = index + 1;

      const flags = [];
      const flagDetail = {};
      const flag = (name, detail) => {
        flags.push(name);
        if (detail !== undefined) { flagDetail[name] = detail; }
      };

      if (element.disabled === true || element.hasAttribute('disabled')) { flag('disabled'); }
      if (element.getAttribute('aria-disabled') === 'true') { flag('aria-disabled'); }
      if (document.activeElement === element) { flag('focused'); }
      if (element.getAttribute('aria-selected') === 'true') { flag('selected'); }
      if (element.getAttribute('aria-checked') === 'true' || element.checked === true) { flag('checked'); }
      if (element.getAttribute('aria-expanded') === 'true') { flag('expanded'); }
      if (element.getAttribute('aria-busy') === 'true') { flag('busy'); }
      const failsValidity = typeof element.checkValidity === 'function' && element.checkValidity() === false;
      if (element.getAttribute('aria-invalid') === 'true' || failsValidity) { flag('invalid'); }
      if (element.hasAttribute('aria-live')) { flag('live'); }
      if (element.getAttribute('role') === 'alert') { flag('alert'); }
      if (element.getAttribute('role') === 'status') { flag('status'); }
      if (element.getAttribute('aria-hidden') === 'true') { flag('aria-hidden'); }
      if (parseFloat(style.opacity) === 0) { flag('invisible-opacity-0'); }

      const offscreen = rect.right <= 0 || rect.bottom <= 0 || rect.left >= window.innerWidth || rect.top >= window.innerHeight;
      if (offscreen) { flag('offscreen'); }

      const scrolls = style.overflowY === 'auto' || style.overflowY === 'scroll';
      const below = element.scrollHeight - element.clientHeight - element.scrollTop;
      if (scrolls && element.scrollHeight - element.clientHeight > 1) {
        flag('scrollable', String(Math.round(below)) + 'px below');
      }

      if (offscreen === false) {
        const onTop = document.elementFromPoint(Math.round(rect.left + rect.width / 2), Math.round(rect.top + rect.height / 2));
        if (onTop !== null && onTop !== element && element.contains(onTop) === false && onTop.contains(element) === false) {
          flag('covered', 'by ' + labelOf(onTop));
        }
      }

      const clipsX = style.overflowX === 'hidden' || style.overflowX === 'clip';
      const clipsY = style.overflowY === 'hidden' || style.overflowY === 'clip';
      const cutX = clipsX && element.scrollWidth > element.clientWidth + 1;
      if (cutX) { flag('clipped-x'); }
      if (clipsY && element.scrollHeight > element.clientHeight + 1) { flag('clipped-y'); }
      if (cutX && style.textOverflow !== 'ellipsis') { flag('cut-no-ellipsis'); }

      if (text !== '') {
        const foreground = channels(style.color);
        if (foreground !== null) {
          const background = backdrop(element);
          const lighter = Math.max(luminance(foreground), luminance(background));
          const darker = Math.min(luminance(foreground), luminance(background));
          const ratio = (lighter + 0.05) / (darker + 0.05);
          if (ratio < params.contrastThreshold) { flag('low-contrast', ratio.toFixed(1)); }
        }
      }

      let ancestor = element.parentElement;
      let collapsed = false;
      while (ancestor !== null && collapsed === false) {
        const ancestorRect = ancestor.getBoundingClientRect();
        if (ancestorRect.width === 0 || ancestorRect.height === 0) { collapsed = true; }
        ancestor = ancestor.parentElement;
      }
      if (collapsed) { flag('collapsed-ancestor'); }

      // An interactive element has no content-bearing descendants BY CONSTRUCTION — an input holds
      // nothing — so flagging it empty fires on a row where the word carries no message, which is
      // what turns a flag into a column.
      if (text === '' && contentful === false && interactive === false && hasContentDescendant(element) === false) { flag('empty'); }

      // Reachability is an ANCESTOR question, not an element one. cursor: pointer is inherited, so
      // every sprite and label inside a link reads as a pointer target while the keyboard reaches
      // all of them through the link itself. Measured on this app's own home screen: the
      // per-element form fired on four of twenty-one rows, every one of them inside one anchor.
      const reachable = element.closest(params.reachableSelector) !== null;
      if (style.cursor === 'pointer' && reachable === false) { flag('not-tabbable'); }

      if (tag === 'img' && element.naturalWidth === 0) { flag('broken-image'); }

      const attributes = Array.from(element.attributes).map((attribute) => ({
        name: attribute.name,
        value: attribute.value
      }));

      const named = text !== ''
        ? text
        : (element.getAttribute('aria-label') || element.getAttribute('title') || element.getAttribute('alt') || element.getAttribute('name') || '');

      rows.push({
        ref: ref,
        depth: depth,
        parentRef: parentRef,
        testId: testId,
        tag: tag,
        role: element.getAttribute('role'),
        domId: element.id === '' ? null : element.id,
        text: named === '' ? null : named.slice(0, params.textChars),
        // Only a FIELD has a value worth reading. A button carries a value property too, and it is
        // the empty string, so reading it off every control put a bare pair of quotes beside every
        // button's own label — a column spending its width on nothing.
        value: params.fieldTags.indexOf(tag) !== -1 && typeof element.value === 'string' ? element.value.slice(0, params.textChars) : null,
        placeholder: element.getAttribute('placeholder'),
        attributes: attributes,
        flags: flags,
        flagDetail: flagDetail
      });

      ownRef = ref;
      ownDepth = depth + 1;
      ownLabel = testId === null ? nearestLabel : testId;
    }

    Array.from(element.children).forEach((child) => { visit(child, ownDepth, ownRef, ownLabel); });
  };

  const roots = params.within === null
    ? [document.body === null ? document.documentElement : document.body]
    : Array.from(document.querySelectorAll(params.within));

  roots.forEach((root) => { visit(root, 0, null, params.rootLabel); });

  return { rows: rows, highestRef: registry.length, skipped: skipped };
}`;

export const keyReadLayerAdapter = (): {
  readSource: (params: { within: Selector | null }) => ContentText;
  highestRefOf: (params: { raw: unknown }) => ReadingCount;
  toListing: (params: { raw: unknown; within: Selector | null }) => KeyListing;
} => ({
  readSource: ({ within }: { within: Selector | null }): ContentText => {
    const params = JSON.stringify({
      within,
      rootLabel: within ?? 'the page',
      excludedTags: keyStatics.excluded.tags,
      interactiveSelector: keyStatics.rows.interactiveSelector,
      reachableSelector: REACHABLE_SELECTOR,
      fieldTags: keyStatics.rows.fieldTags,
      contentTags: keyStatics.rows.contentTags,
      contentSelector: [keyStatics.rows.interactiveSelector, ...keyStatics.rows.contentTags].join(
        ',',
      ),
      contrastThreshold: keyStatics.contrast.threshold,
      maxRows: keyStatics.limits.maxRows,
      maxDepth: keyStatics.limits.maxDepth,
      textChars: keyStatics.limits.textChars,
    });
    return contentTextContract.parse(`(${READ_SOURCE_BODY})(${params})`);
  },

  highestRefOf: ({ raw }: { raw: unknown }): ReadingCount =>
    keyReadingContract.parse(raw).highestRef,

  toListing: ({ raw, within }: { raw: unknown; within: Selector | null }): KeyListing => {
    const reading = keyReadingContract.parse(raw);
    // The determinism guard, on the element column this time. Measured on this app: Mantine mints
    // `mantine-gwrqe5vg6-label` per mount, so a key carrying it differs between two readings of the
    // same state — the element-delta churn the attrs guard exists to prevent, arriving through a
    // different column.
    const generatedIdPattern = new RegExp(
      keyStatics.attrs.generatedIdPattern.source,
      keyStatics.attrs.generatedIdPattern.flags,
    );

    // `[n/m]` — the naming ladder's last rung, for siblings a testId and a text cannot tell apart.
    // Keyed on the parent ROW rather than the DOM parent, because the tree's parent is the nearest
    // testId ancestor and the intermediate wrappers collapsed out before this ran. Counted by
    // filtering rather than by a tally object: the row cap bounds this at a couple of hundred, and
    // a raw-keyed tally is what `ban-primitives` exists to keep out of a signature.
    const groupKeys = reading.rows.map(
      (row) => `${String(row.parentRef)}::${row.testId ?? `(${row.tag})`}`,
    );

    const rows = reading.rows.map((row, position) => {
      const group = groupKeys[position] ?? '';
      const total = groupKeys.filter((key) => key === group).length;
      const ordinal = groupKeys.slice(0, position + 1).filter((key) => key === group).length;
      const budget = attrsBudgetTransformer({ attributes: row.attributes });

      return keyRowContract.parse({
        ref: row.ref,
        depth: row.depth,
        testId: row.testId,
        tag: row.tag,
        role: row.role,
        domId: row.domId === null || generatedIdPattern.test(row.domId) ? null : row.domId,
        sibling: total > 1 ? `${String(ordinal)}/${String(total)}` : null,
        text: row.text,
        value: row.value,
        placeholder: row.placeholder,
        attrs: budget.kept,
        attrsDropped: budget.dropped,
        flags: row.flags,
        flagDetail: row.flagDetail,
      });
    });

    // The key-level reading `[n/m]` cannot catch: a testId appearing under two DIFFERENT parents.
    // That line is the bug all three trial arms found — an inner body rendered twice, once nested
    // correctly and once orphaned at a panel's root, with no console warning
    // (siegelense-tooling.md line 524).
    const namedTestIds = Array.from(
      new Set(reading.rows.map((row) => row.testId).filter((testId) => testId !== null)),
    );
    const duplicates = namedTestIds
      .map((testId) => ({
        testId,
        parents: Array.from(
          new Set(
            reading.rows
              .filter((row) => row.testId === testId)
              .map((row) => {
                const parent = reading.rows.find((candidate) => candidate.ref === row.parentRef);
                return parent === undefined
                  ? DOCUMENT_ROOT_LABEL
                  : (parent.testId ?? `(${parent.tag})`);
              }),
          ),
        ),
      }))
      .filter((entry) => entry.parents.length > 1)
      .map((entry) =>
        contentTextContract.parse(
          `… ${entry.testId} appears ${String(entry.parents.length)}× — under ${entry.parents.join(' and under ')}`,
        ),
      );

    const truncated = reading.skipped.map((entry) =>
      contentTextContract.parse(`… ${String(entry.count)} more under ${entry.under}`),
    );

    const unrendered = keyListingContract.parse({
      within,
      rows,
      duplicates,
      truncated,
      rendered: contentTextContract.parse(''),
    });

    return keyListingContract.parse({
      ...unrendered,
      rendered: keyRenderTransformer({ listing: unrendered }),
    });
  },
});
