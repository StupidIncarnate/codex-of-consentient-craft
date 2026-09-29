/**
 * PURPOSE: Resolves the `file:` URL of tsx's loader entry, the value `node --import <url>` takes to
 * run a TypeScript file. It is tsx's own documented equivalent of its CLI, minus the extra process the
 * CLI launches to install the same loader. Resolved from this package's own location, so it finds the
 * copy this gateway declares as a dependency in a monorepo and in a consumer alike.
 *
 * USAGE:
 * const loader = tsxLoaderUrl();
 * // Returns a URL such as file:///repo/node_modules/tsx/dist/loader.mjs; throws when tsx is not installed
 * // spawn: node --conditions=source --import <loader> script.ts
 */
import { pathToFileURL } from 'url';

export const tsxLoaderUrl = (): string => pathToFileURL(require.resolve('tsx')).href;
