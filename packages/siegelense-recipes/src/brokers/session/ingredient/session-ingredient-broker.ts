/**
 * PURPOSE: The `session` ingredient — one Claude transcript on disk for a guild's directory,
 * holding the JSONL lines you gave it. Reach for this over declaring a second session ingredient:
 * every subagent in this package links to THIS one by name, via `sessionId`.
 *
 * NAMED `session-ingredient-broker.ts`, NOT `session-ingredient.ts` — see
 * `guild-ingredient-broker.ts`'s own header for the naming finding this repeats.
 *
 * `links: [{ of: 'guild', as: 'cwd', from: 'path' }]` is the `from:` ruling earning its keep twice
 * over: this row's own field is `cwd`, not `guildId`, and the value it reads off the guild is
 * `path`, not `id` — the case the optional `from` exists for.
 *
 * `copies: 'external:claude-cli'` is this package's answer to Q7-2 of
 * `scrolls/seigelense/plans/recipes-chunk-07-repo-ingredients.md`. Nothing in this repo writes a
 * Claude session transcript in production — the Claude CLI does — so no in-repo broker exists for
 * this route to imitate. `copiesTargetContract` requires the `external:` prefix exactly for this
 * case — a producer outside the repo — and refuses a slash, so this no longer names a path into
 * `packages/web/test/harnesses/claude-mock/bin/claude` (the fake CLI that shape used to point at):
 * a diagnosing agent reads this ingredient's own header instead, which is where that mapping now
 * lives.
 *
 * `defaults` mints only `sessionId` — `cwd` arrives through the link, and `lines` has no honest
 * default (an empty transcript asserts nothing useful), so a caller supplies it via `set()`.
 *
 * USAGE:
 * const dm = registry({ guilds: guildIngredientBroker, sessions: sessionIngredientBroker });
 * dm.guilds.add(1, (g) => [g[0].sessions.add(1, (s) => [s[0].set({ lines: ['...'] })])]);
 */
import { sessionIdContract } from '@dungeonmaster/shared/contracts';

import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';
import { nestedChainArgsContract } from '../../../contracts/nested-chain-args/nested-chain-args-contract';
import { sessionFieldsContract } from '../../../contracts/session-fields/session-fields-contract';
import { sessionRecordContract } from '../../../contracts/session-record/session-record-contract';
import { sessionNestedChainBroker } from '../nested-chain/session-nested-chain-broker';
import { sessionQueryRouteBroker } from '../query-route/session-query-route-broker';
import { sessionRemoveRouteBroker } from '../remove-route/session-remove-route-broker';
import { sessionWriteRouteBroker } from '../write-route/session-write-route-broker';
import type { SessionFields } from '../../../contracts/session-fields/session-fields-contract';

const { ingredient } = recipesHydrationCreateBroker();

export const sessionIngredientBroker = ingredient({
  name: 'session',
  description:
    "one Claude transcript on disk for a guild's directory, holding the JSONL lines you gave it",
  fields: sessionFieldsContract,
  record: sessionRecordContract,
  links: [{ of: 'guild', as: 'cwd', from: 'path' }],
  defaults: (index: number): Partial<SessionFields> => ({
    sessionId: sessionIdContract.parse(`seed-session-${index + 1}`),
  }),
  routes: {
    write: sessionWriteRouteBroker,
    query: sessionQueryRouteBroker,
    remove: sessionRemoveRouteBroker,
  },
  copies: 'external:claude-cli',
  extras: {
    withNestedChain: {
      args: nestedChainArgsContract,
      apply: sessionNestedChainBroker,
    },
  },
});
