/**
 * PURPOSE: Names the files the built @dungeonmaster/web bundle publishes at its dist ROOT, so
 *   single-port (published) mode reads them off disk instead of answering them with the SPA's
 *   index.html. Vite hashes everything it bundles into /assets/, but copies its publicDir to the
 *   dist root verbatim — those files match no /assets/ prefix and are not client-router routes
 *   either. A browser handed index.html for /favicon.svg shows the generic globe, because the bytes
 *   are HTML whatever Content-Type the header claims.
 *
 * Each file is NAMED rather than matched by "has an extension": that broader rule turns a mistyped
 * route into a 500 from a read that finds nothing, where today it renders the app.
 *
 * USAGE:
 * webBundleRootStaticPathsStatics.paths.includes('/favicon.svg');
 * // Returns true
 */

export const webBundleRootStaticPathsStatics = {
  paths: ['/favicon.svg'],
} as const;
