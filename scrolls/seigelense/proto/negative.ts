/**
 * Every line here MUST fail to typecheck. `@ts-expect-error` inverts each one, so a
 * CLEAN compile proves the error exists — and an unused directive is itself an error,
 * so a rule that silently stopped working fails this file rather than passing it.
 */
import { recipe } from './hydration';
import { dmRun as run } from './ingredients';
import type { GuildId } from './ingredients';
import { dm } from './ingredients';
import { sessionWithNestedChain } from './recipes';
import { blog } from './db';

const { guilds: guild, sessions: session } = dm;

export const outOfBounds = recipe({ name: 'neg-out-of-bounds', description: 'neg out of bounds' }, () => [
  guild.add(1, (g) => [
    g[0].quests.add(3, (q) => [
      // @ts-expect-error index 3 of a 3-tuple
      q[3].set({ title: 'x' }),
    ]),
  ]),
]);

export const unknownField = recipe({ name: 'neg-unknown-field', description: 'neg unknown field' }, () => [
  guild.add(1, (g) => [
    // @ts-expect-error `nope` is not a guild field
    g[0].set({ nope: 1 }),
  ]),
]);

export const unreachableTransition = recipe({ name: 'neg-unreachable', description: 'neg unreachable' }, () => [
  guild.add(1, (g) => [
    g[0].quests.add(1, (q) => [
      // @ts-expect-error `blocked` is a real status but is NOT in the ingredient's `to` list
      q[0].set({ status: 'blocked' }),
    ]),
  ]),
]);

export const notAStatus = recipe({ name: 'neg-not-a-status', description: 'neg not a status' }, () => [
  guild.add(1, (g) => [
    g[0].quests.add(1, (q) => [
      // @ts-expect-error not a status at all
      q[0].set({ status: 'nonsense' }),
    ]),
  ]),
]);

export const extraNotDeclared = recipe({ name: 'neg-extra', description: 'neg extra' }, () => [
  guild.add(1, (g) => [
    g[0].quests.add(1, (q) => [
      // @ts-expect-error quest declares no `withNestedChain` extra; session does
      q[0].withNestedChain({ depth: 2 }),
    ]),
  ]),
]);

export const childNotDeclared = recipe({ name: 'neg-child', description: 'neg child' }, () => [
  guild.add(1, (g) => [
    g[0].quests.add(1, (q) => [
      // @ts-expect-error quest has no `sessions` child
      q[0].sessions.add(1, () => []),
    ]),
  ]),
]);

export const filterHasNoIndex = recipe({ name: 'neg-filter-index', description: 'neg filter index' }, () => [
  guild.add(1, (g) => [
    g[0].quests.add(1, (q) => [
      // @ts-expect-error a filtered set has no known length, so no index access
      q[0].operations.filter({ where: { role: 'ward' } })[0].remove(),
    ]),
  ]),
]);

export const filterHasNoAdd = recipe({ name: 'neg-filter-add', description: 'neg filter add' }, () => [
  guild.add(1, (g) => [
    g[0].quests.add(1, (q) => [
      // @ts-expect-error you cannot `add` to a filtered set
      q[0].operations.filter({ where: { role: 'ward' } }).add(1, () => []),
    ]),
  ]),
]);

export const badExpect = recipe({ name: 'neg-bad-expect', description: 'neg bad expect' }, () => [
  guild.add(1, (g) => [
    g[0].quests.add(1, (q) => [
      // @ts-expect-error `expect` takes one | some | any
      q[0].operations.filter({ where: { role: 'ward' }, expect: 'exactly-two' }).remove(),
    ]),
  ]),
]);

export const badFilterField = recipe({ name: 'neg-bad-filter-field', description: 'neg bad filter field' }, () => [
  guild.add(1, (g) => [
    g[0].quests.add(1, (q) => [
      // @ts-expect-error `nope` is not an operation field
      q[0].operations.filter({ where: { nope: 1 } }).remove(),
    ]),
  ]),
]);

export const sessionExtraIsTyped = recipe({ name: 'neg-extra-args', description: 'neg extra args' }, () => [
  session.under({ guildId: 'g' as GuildId }).add(1, (s) => [
    // @ts-expect-error depth is a number
    s[0].withNestedChain({ depth: 'two' }),
  ]),
]);

export const recipeInputWrongType = async (): Promise<void> => {
  // @ts-expect-error guildId is a branded GuildId, not a bare string
  await run(sessionWithNestedChain({ guildId: 'g1' }), { home: '/tmp/h' });
};

export const recipeInputMissing = async (): Promise<void> => {
  // @ts-expect-error this recipe requires an input
  await run(sessionWithNestedChain(), { home: '/tmp/h' });
};

// ------------------------------------------------- the same rules on a DB-backed repo

export const dbUnreachableStatus = recipe({ name: 'neg-db-status', description: 'neg db status' }, () => [
  blog.users.add(1, (u) => [
    u[0].posts.add(1, (p) => [
      // @ts-expect-error `takendown` is a real status but is not in the ingredient's `to` list
      p[0].set({ status: 'takendown' }),
    ]),
  ]),
]);

export const dbCommentNeedsAPost = recipe({ name: 'neg-db-comment', description: 'neg db comment' }, () => [
  blog.users.add(1, (u) => [
    // @ts-expect-error a comment links to BOTH post and user; a user alone cannot supply postId
    u[0].comments.add(1, () => []),
  ]),
]);

export const dbUnknownColumn = recipe({ name: 'neg-db-column', description: 'neg db column' }, () => [
  blog.users.add(1, (u) => [
    // @ts-expect-error `nickname` is not a user column
    u[0].set({ nickname: 'x' }),
  ]),
]);
