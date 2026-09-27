/**
 * The `node_modules` package names every REPO-INTERNAL Jest config lets ts-jest transpile — msw
 * ships ESM-only `.js` with no CJS build, and `until-async` / `outvariant` / `@mswjs/*` are what
 * `start-endpoint-mock-setup.ts`'s `msw/node` import reaches transitively inside THIS repo's own
 * deduped root `node_modules`. Shared here so the same four names are not retyped, and cannot drift,
 * across every package's own `jest.config.*`.
 *
 * The PUBLISHED `packages/testing/jest-config-base.js` does NOT use this list: a real consumer
 * install reaches msw's transitive graph much deeper (`rettime`, `@open-draft/deferred-promise`,
 * the whole `@inquirer/confirm` chain, ...), and G27 found a named carve-out there is exactly the
 * kind of second list that silently drifts the day msw adds one more dependency — see that file's
 * own header for the `transformIgnorePatterns: []` + unnamed `/node_modules/.+\.[cm]?js$` pattern it
 * uses instead.
 *
 * Every anchored pattern below matches ONLY inside `node_modules` on purpose: matching `.js`
 * anywhere (the shape every one of these configs used to write inline) routes a package's own real
 * `.js` file through ts-jest's error-recovering `transpileModule` too, which silently repairs a
 * genuine syntax error instead of letting it throw — the class of bug `@gateway/node`'s
 * `dynamic-import.test.ts` caught and cdf22d643 fixed for that one package. This module makes the
 * anchored shape the shared default instead of a fix each package re-derives on its own.
 */
'use strict';

const nodeModulesEsmTransformPackageNames = ['msw', '@mswjs', 'until-async', 'outvariant'];

/**
 * Builds the `transformIgnorePatterns` and `transform` regex source strings for a package's own
 * ESM node_modules list, optionally widened with names beyond the shared four (`web` adds `undici`,
 * which nothing else in the repo reaches).
 */
const buildNodeModulesEsmTransformPatterns = ({ extraPackageNames = [] } = {}) => {
  const packageNames = [...nodeModulesEsmTransformPackageNames, ...extraPackageNames];
  const packageAlternation = packageNames.join('|');
  return {
    packageNames,
    // A path matching this is SKIPPED by ts-jest. The negative lookahead skips every
    // `node_modules` path EXCEPT these packages', so only they are eligible for transform.
    ignorePattern: `/node_modules/(?!(${packageAlternation})/)`,
    // Matches ONLY these packages' own `.js` files inside `node_modules` — never a path outside it.
    transformPattern: `/node_modules/(${packageAlternation})/.+\\.js$`,
  };
};

module.exports = {
  nodeModulesEsmTransformPackageNames,
  buildNodeModulesEsmTransformPatterns,
};
