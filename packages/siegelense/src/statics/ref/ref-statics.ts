/**
 * PURPOSE: The two names a dying ref can be given, and the shape of the page-side registry that
 * holds one. Reach for this over `keyStatics`: keyStatics shapes a READING of a page, while
 * everything here is about the HANDLE that reading mints — which outlives the reading and dies on a
 * boundary the reading knows nothing about.
 *
 * A ref that stops resolving is one of two things and never a third, because only two are
 * distinguishable from the driver's side: the element left the DOM while the realm stayed
 * (`detached`), or the realm itself was replaced (`navigation`). A navigation, a `reset` and an
 * instance restart are one case here for a physical reason — each replaces the page's JS realm, so
 * the registry comes back empty and nothing has to remember to invalidate anything.
 *
 * USAGE:
 * refStatics.boundaries.navigation;
 * // Returns 'navigation' — the boundary a RefStaleError names when the page's realm was replaced
 */

export const refStatics = {
  boundaries: {
    // The element is still in the registry and `isConnected` is false: it left the DOM under a live
    // page. The registry is what proves this rather than inferring it — `refs[n]` still holds the
    // element, so the answer is `stale` and never a different element.
    detached: 'detached',
    // The registry itself came back shorter than the highest ref this instance ever minted, which
    // can only happen when the init script re-ran against a new document.
    navigation: 'navigation',
  },
  registry: {
    // The page-side global the init script installs. Held here rather than inlined in the source
    // string so the reader, the resolver and the mint-or-reuse walk all name the same array.
    globalName: '__siege',
    arrayName: 'refs',
    // Driving by ref goes through a LOCATOR, not an ElementHandle: this package's tsconfig carries
    // no `dom` lib, so `JSHandle.asElement()` resolves to `null` at the type level and the handle
    // route would need a cast for information the compiler genuinely lacks. So the element is
    // stamped with this attribute, driven through `page.locator`, and unstamped in a `finally` —
    // which keeps Playwright's strict mode doing the no-pick work for a ref exactly as it does for
    // a selector. **Not `data-` prefixed**, so a `look` racing the stamp could never report it in
    // the attrs column.
    targetAttribute: 'siege-target',
  },
} as const;
