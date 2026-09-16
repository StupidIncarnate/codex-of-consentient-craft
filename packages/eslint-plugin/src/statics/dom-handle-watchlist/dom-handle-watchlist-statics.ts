/**
 * PURPOSE: The watchlist for `ban-dom-handles-in-ingredients` — the UI-driving package names an
 * ingredient must not import, the member names that read a selector or a screen position off a
 * handle, and the call names that mint a React ref. Deliberately narrow: it names the concrete
 * APIs this repo's own widgets, harnesses and e2e specs already reach for, not every conceivable
 * way to touch a screen — a different UI toolkit or browser driver is invisible to it.
 *
 * USAGE:
 * import { domHandleWatchlistStatics } from './statics/dom-handle-watchlist/dom-handle-watchlist-statics';
 * domHandleWatchlistStatics.bannedImportSources;
 * // Returns the readonly list of UI-driving package names banned from an ingredient's imports
 *
 * WHEN-TO-USE: Only `rule-ban-dom-handles-in-ingredients-broker` should consume this.
 */
export const domHandleWatchlistStatics = {
  // Importing any of these is itself the violation — the moment an ingredient pulls in a
  // UI-driving package it has taken on a walk's job. Not exhaustive: a consumer repo's own widget
  // toolkit or a different browser driver is not on this list; see the rule's own message.
  bannedImportSources: ['react', 'react-dom', '@playwright/test', 'playwright', 'playwright-core'],
  // Member names that read a SELECTOR off a page/element handle when called — Playwright's
  // locator API and the plain DOM query methods it wraps.
  selectorMemberNames: [
    'getByTestId',
    'getByRole',
    'getByText',
    'getByLabel',
    'getByPlaceholder',
    'getByAltText',
    'getByTitle',
    'locator',
    'querySelector',
    'querySelectorAll',
    'getElementById',
  ],
  // Member names that read a POSITION off a page/element handle when called.
  positionMemberNames: ['boundingBox', 'getBoundingClientRect'],
  // Call names that mint a REF — React's two ways of getting a mutable handle to a rendered node.
  refCallNames: ['useRef', 'createRef'],
} as const;
