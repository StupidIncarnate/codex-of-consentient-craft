/**
 * PURPOSE: This repo's own target — where dungeonmaster's state goes, where Claude's transcripts
 * go, and how an `api` route reaches a server. Every route broker in this package takes exactly
 * this shape; reach for it over inventing a target inline so a caller with no `baseUrl` (a Jest
 * integration test against a temp dir) can still run every ingredient that declares a `write`
 * route. `claudeHome` exists as its own field rather than being derived from `os.homedir()`
 * because nothing sets `HOME` for a Jest run, and a route that read the real one would write a
 * transcript into the developer's own `~/.claude` during `npm run ward`.
 *
 * USAGE:
 * dmTargetContract.parse({ home: '/tmp/guild-1', claudeHome: '/tmp/guild-1' });
 * // Returns a DmTarget that can only run ingredients declaring a `write` route
 */
import { z } from 'zod';

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

/**
 * Returns `unknown`, not a `{ status, body }` shape — whatever an `api` route reads back through
 * this is a raw HTTP response, and a raw response is `unknown` until the route's own contract
 * parses it, exactly as any other boundary in this codebase. Not validated with `z.function()`
 * either — that wraps the parsed value in a schema-checked proxy, which would stop a mocked
 * `request` from matching the exact reference a test's `callsMatching` assertion expects.
 * `z.custom` checks and hands back the original value unchanged, the same choice
 * `packages/hydration`'s own `RouteFn` makes for the identical reason.
 */
export type HttpRequestFn = (args: {
  method: string;
  path: string;
  body?: unknown;
}) => Promise<unknown>;

const urlContract = z.string().url().brand<'Url'>();

const httpRequestFnContract = z.custom<HttpRequestFn>((value) => typeof value === 'function', {
  message: 'Expected a request function',
});

export const dmTargetContract = z
  .object({
    home: absoluteFilePathContract,
    claudeHome: absoluteFilePathContract,
    baseUrl: urlContract.optional(),
    request: httpRequestFnContract.optional(),
  })
  .refine((target) => target.request === undefined || target.baseUrl !== undefined, {
    message: 'a request function needs a baseUrl',
  });

export type DmTarget = z.infer<typeof dmTargetContract>;
