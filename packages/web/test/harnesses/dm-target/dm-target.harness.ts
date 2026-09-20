/**
 * PURPOSE: Builds the two `DmTarget` shapes a web e2e harness needs to seed domain state through
 * `dmRegistryBroker` — one carrying a `baseUrl` so an ingredient's `api` route reaches the live
 * server, one without so its `write` route touches disk directly
 * (scrolls/seigelense/plans/recipes-chunk-09-10-migration.md §3 G0-d: a target with a `baseUrl`
 * always takes `api` over `write`, so one object cannot serve both). Neither
 * `@dungeonmaster/hydration-recipes` nor this package imports the other's specs or harnesses, so
 * this file is the one place the two agree on `DmTarget`'s shape, rather than every domain
 * harness (guild, quest, session) rebuilding it by hand and drifting apart.
 *
 * USAGE:
 * const dmTarget = dmTargetHarness({ baseURL, request });
 * const plan = recipe({ name: 'seed-guild' }, () => [dmRegistryBroker.guilds.add(1, ...)])();
 * await dmRegistryBroker.run(plan, dmTarget.apiTarget());
 */
import type { APIRequestContext } from '@playwright/test';

import { dmTargetContract } from '@dungeonmaster/hydration-recipes/contracts';
import type { DmTarget } from '@dungeonmaster/hydration-recipes/contracts';

type GuildRecord = Record<PropertyKey, unknown>;

export const dmTargetHarness = ({
  baseURL,
  request,
}: {
  baseURL: string | undefined;
  request: APIRequestContext;
}): {
  apiTarget: () => DmTarget;
  writeTarget: () => DmTarget;
  beforeEach: () => Promise<void>;
} => {
  // A `write` route (questWriteRouteBroker, guildWriteRouteBroker, operationWriteRouteBroker)
  // resolves its home from the GLOBAL process.env.DUNGEONMASTER_HOME, never from the `target`
  // object a caller built (packages/hydration-recipes/CLAUDE.md, "A DmTarget alone does not
  // isolate a write route from the real machine"). playwright.config.ts:32 sets this at module
  // scope, re-run in every spec worker, so it is already correct by the time any spec runs — but
  // a config refactor that drops that line breaks every `write` route with no symptom besides a
  // write landing in the real machine's ~/.dungeonmaster. Asserting it here, once, turns that
  // into a named throw instead.
  const dungeonmasterHome = process.env.DUNGEONMASTER_HOME;
  if (dungeonmasterHome === undefined) {
    throw new Error(
      'dmTargetHarness: process.env.DUNGEONMASTER_HOME is unset — playwright.config.ts:32 sets ' +
        'it at module scope for every spec worker; a target built without it is not isolated ' +
        'from the real machine',
    );
  }

  const writeTarget = (): DmTarget =>
    dmTargetContract.parse({ home: dungeonmasterHome, claudeHome: dungeonmasterHome });

  const apiTarget = (): DmTarget => {
    // Playwright's OWN resolved `baseURL` fixture — the WEB port `playwright.config.ts`'s
    // `use.baseURL` names — never the API server's own port. A real browser's fetches reach the
    // API through Vite's `/api` proxy at the web port; pointing this target at the API server
    // directly would answer the same route while skipping that proxy hop, so a route broken only
    // by the proxy (a missing rewrite, a header Vite strips) would pass here and fail in the
    // browser. Reusing the fixture value, rather than recomputing DUNGEONMASTER_WEB_PORT a second
    // time, is what keeps this target on the exact host:port a spec's own page navigated to.
    if (baseURL === undefined) {
      throw new Error('dmTargetHarness.apiTarget: Playwright supplied no baseURL');
    }
    return dmTargetContract.parse({
      home: dungeonmasterHome,
      claudeHome: dungeonmasterHome,
      baseUrl: baseURL,
    });
  };

  // Sequential deletes: concurrent DELETEs corrupt config.json (race on read-modify-write) —
  // guild.harness.ts:35-39 carries the identical rule for the sweep still running there today.
  // Cleanup is not an ingredient verb (no ingredient offers "delete every row"), so it belongs to
  // the target's own teardown rather than to the guild ingredient. Guild-scoped because a guild's
  // directory holds every quest and session an e2e spec seeds under it.
  const beforeEach = async (): Promise<void> => {
    const response = await request.get('/api/guilds');
    const data: unknown = await response.json();
    const guilds = Array.isArray(data) ? (data as GuildRecord[]) : [];
    await guilds.reduce(async (prev, guild) => {
      await prev;
      await request.delete(`/api/guilds/${String(guild.id)}`);
    }, Promise.resolve());
  };

  return { apiTarget, writeTarget, beforeEach };
};
