/**
 * PURPOSE: Builds every page-side source string the REF REGISTRY needs, and translates what comes
 * back — the init script that installs `window.__siege.refs`, the expression that reports one ref's
 * state, and the expression that hands an element back for driving. Reach for this over resolving a
 * ref in Node: **the registry lives in the PAGE, and that is what makes the four boundaries
 * physical** (siegelense-tooling.md line 2179). A registry held in Node has to be invalidated by
 * someone REMEMBERING to invalidate it, on four different paths; a registry held in the page's own
 * JS realm is invalidated by the browser — a navigation replaces the realm, a reload replaces it, a
 * new context replaces it — so nothing has to remember anything.
 *
 * Three of the spec's requirements fall out by construction rather than by care:
 *
 * - **A ref binds to an ELEMENT, not a row number** (line 2210). A `look` does an identity lookup
 *   per element: a hit REUSES that number, a miss pushes and mints. Recomputing a listing never
 *   renumbers what is still there.
 * - **A ref answers `stale`, never a different element** (line 2141). The array still holds the
 *   element after a detach, and `isConnected` is what says so.
 * - **Navigation invalidates every ref** (line 2211). The init script re-runs on every document, so
 *   the array comes back EMPTY.
 *
 * That last one needs a Node-side half, which is why `toResolution` takes `highestMinted`: with a
 * page-only registry, a ref used after a navigation is "past the array's end", and that is
 * indistinguishable from a ref carried in from ANOTHER INSTANCE — two failures whose recovery is
 * different. The caller keeps `highestMinted` in its own closure, which survives a navigation and
 * dies with the instance, so a ref inside that range that the page no longer holds is a NAVIGATION
 * and a ref beyond it was never minted here at all.
 *
 * `errors/` is outside what an adapter may import, so this layer reports a STATE and the broker that
 * reads it throws — the same split `describeMatches` and `stepTargetResolveBroker` already use.
 *
 * USAGE:
 * const registry = refRegistryLayerAdapter();
 * await page.addInitScript(registry.initScriptSource());
 * const raw = await page.evaluate(registry.refStateSource({ ref: 23 }));
 * registry.toResolution({ raw, ref: 23, highestMinted: 41 });
 * // Returns { state: 'stale', boundary: 'navigation', highestMinted: 41 }
 *
 * await page.evaluate(registry.stampSource({ ref: 23 }));
 * await page.locator(registry.targetSelector()).click();
 * await page.evaluate(registry.unstampSource());
 * // Drives ref 23 through the strict locator path, then removes the mark it made
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import { refResolutionContract } from '../../../contracts/ref-resolution/ref-resolution-contract';
import type { RefResolution } from '../../../contracts/ref-resolution/ref-resolution-contract';
import { refStatics } from '../../../statics/ref/ref-statics';

// The page-side reading, before it is turned into a RefResolution. `out-of-range` means the array
// does not reach that index at all, which the Node-side `highestMinted` then splits into a
// navigation and an unknown ref.
const rawRefStateContract = z.enum(['live', 'detached', 'out-of-range']);

const GLOBAL = refStatics.registry.globalName;
const ARRAY = refStatics.registry.arrayName;
const ATTRIBUTE = refStatics.registry.targetAttribute;

// Installed by `addInitScript`, so it runs before the page's own script on EVERY document. Creating
// the array here rather than lazily is what makes a navigation observable: a fresh document gets a
// fresh empty array, and every ref the previous document minted is now past its end.
const INIT_SCRIPT_SOURCE = `(() => {
  const existing = window.${GLOBAL};
  if (existing === undefined) {
    window.${GLOBAL} = { ${ARRAY}: [] };
    return;
  }
  if (Array.isArray(existing.${ARRAY}) === false) {
    existing.${ARRAY} = [];
  }
})()`;

export const refRegistryLayerAdapter = (): {
  initScriptSource: () => ContentText;
  refStateSource: (params: { ref: number }) => ContentText;
  stampSource: (params: { ref: number }) => ContentText;
  unstampSource: () => ContentText;
  targetSelector: () => ContentText;
  boxSource: (params: { ref: number }) => ContentText;
  toResolution: (params: { raw: unknown; ref: number; highestMinted: number }) => RefResolution;
} => ({
  initScriptSource: (): ContentText => contentTextContract.parse(INIT_SCRIPT_SOURCE),

  // Self-invoked for the same reason `describeMatches`'s source is: a bare arrow-function source
  // string is never CALLED by Playwright at all — its client tags a call with
  // `isFunction: typeof pageFunction === 'function'`, and a string fails that test — so an
  // un-called function fails to serialize and comes back `undefined`.
  refStateSource: ({ ref }: { ref: number }): ContentText =>
    contentTextContract.parse(`(() => {
  const registry = window.${GLOBAL} === undefined ? null : window.${GLOBAL}.${ARRAY};
  if (registry === null || registry === undefined) { return 'out-of-range'; }
  const element = registry[${String(ref - 1)}];
  if (element === undefined || element === null) { return 'out-of-range'; }
  return element.isConnected === true ? 'live' : 'detached';
})()`),

  // Driving by ref goes through a LOCATOR rather than an ElementHandle — this package's tsconfig
  // carries no `dom` lib, so `JSHandle.asElement()` resolves to `null` at the type level and the
  // handle route would need a cast. Stamping instead keeps Playwright's strict mode doing the
  // no-pick work for a ref exactly as it does for a selector: exactly one element carries the
  // attribute, so the locator resolves to one element or to none, never to "the first of several".
  // The caller unstamps in a `finally`, so the mutation never outlives the step that made it.
  stampSource: ({ ref }: { ref: number }): ContentText =>
    contentTextContract.parse(`(() => {
  document.querySelectorAll('[${ATTRIBUTE}]').forEach((stamped) => { stamped.removeAttribute('${ATTRIBUTE}'); });
  const registry = window.${GLOBAL} === undefined ? null : window.${GLOBAL}.${ARRAY};
  if (registry === null || registry === undefined) { return false; }
  const element = registry[${String(ref - 1)}];
  if (element === undefined || element === null || element.isConnected !== true) { return false; }
  element.setAttribute('${ATTRIBUTE}', '');
  return true;
})()`),

  unstampSource: (): ContentText =>
    contentTextContract.parse(`(() => {
  document.querySelectorAll('[${ATTRIBUTE}]').forEach((stamped) => { stamped.removeAttribute('${ATTRIBUTE}'); });
  return true;
})()`),

  targetSelector: (): ContentText => contentTextContract.parse(`[${ATTRIBUTE}]`),

  boxSource: ({ ref }: { ref: number }): ContentText =>
    contentTextContract.parse(`(() => {
  const registry = window.${GLOBAL} === undefined ? null : window.${GLOBAL}.${ARRAY};
  if (registry === null || registry === undefined) { return null; }
  const element = registry[${String(ref - 1)}];
  if (element === undefined || element === null || element.isConnected !== true) { return null; }
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  const visible =
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    parseFloat(style.opacity) > 0 &&
    (rect.width > 0 || rect.height > 0);
  const inViewport =
    rect.right > 0 &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.top < window.innerHeight;
  return {
    ref: ${String(ref)},
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.max(0, Math.round(rect.width)),
    height: Math.max(0, Math.round(rect.height)),
    viewport: {
      width: Math.max(0, Math.round(window.innerWidth)),
      height: Math.max(0, Math.round(window.innerHeight)),
    },
    visible,
    inViewport,
  };
})()`),

  toResolution: ({
    raw,
    ref,
    highestMinted,
  }: {
    raw: unknown;
    ref: number;
    highestMinted: number;
  }): RefResolution => {
    const state = rawRefStateContract.parse(raw);

    if (state === 'live') {
      return refResolutionContract.parse({ state: 'live', boundary: null, highestMinted });
    }
    if (state === 'detached') {
      return refResolutionContract.parse({
        state: 'stale',
        boundary: refStatics.boundaries.detached,
        highestMinted,
      });
    }
    // The page does not hold it, and the page cannot say why: its array was replaced wholesale and
    // remembers nothing about what it used to hold. The Node-side counter is the only thing that
    // can tell a ref THIS instance minted — and therefore lost to a navigation — from one that was
    // never minted here at all, which is a ref carried across an instance boundary.
    const neverMintedHere = ref > highestMinted;
    return refResolutionContract.parse({
      state: neverMintedHere ? 'unknown' : 'stale',
      boundary: neverMintedHere ? null : refStatics.boundaries.navigation,
      highestMinted,
    });
  },
});
