/**
 * ONE compiled example per chainable. Every snippet in the doc's reference table is
 * copied from here, so no example in the doc is one nobody ran through the compiler.
 */
import { fromSaved, recipe } from './hydration';
import { dm } from './ingredients';
import type { GuildId } from './ingredients';
import { blog } from './db';
import type { UserId } from './db';

// ---- add(n, build) — creates n rows; the builder gets a TUPLE and `all`
export const addExample = recipe({ name: 'usage-add', description: 'usage add' }, () => [
  dm.guilds.add(1, (g) => [
    g[0].quests.add(3, (q, all) => [
      all.set({ userRequest: 'every one of the three' }),
      q[0].set({ title: 'only the first' }),
    ]),
  ]),
]);

// ---- set({...}) — a plain field is written; a `transitions` field is WALKED
export const setExample = recipe({ name: 'usage-set', description: 'usage set' }, () => [
  dm.guilds.add(1, (g) => [
    g[0].quests.add(1, (q) => [
      q[0].set({ title: 'plain field, written' }),
      q[0].set({ status: 'in_progress' }), // walked through the real gates
    ]),
  ]),
]);

// ---- setRaw({...}) — writes the field and walks NOTHING
export const setRawExample = recipe({ name: 'usage-set-raw', description: 'usage set raw' }, () => [
  dm.guilds.add(1, (g) => [
    g[0].quests.add(1, (q) => [
      // a row the gates would never have produced, for an attack walk
      q[0].setRaw({ status: 'complete' }),
    ]),
  ]),
]);

// ---- filter({ where, expect }) — selects rows that exist at RUN time
export const filterExample = recipe({ name: 'usage-filter', description: 'usage filter' }, () => [
  dm.guilds.add(1, (g) => [
    g[0].quests.add(1, (q) => [
      q[0].set({ status: 'in_progress' }),
      q[0].operations.filter({ where: { role: 'riftcarver' }, expect: 'one' }).remove(),
      q[0].operations.filter({ where: { role: 'ward' }, expect: 'any' }).set({ text: 'noop' }),
    ]),
  ]),
]);

// ---- remove() — on one row, or on a filtered set
export const removeExample = recipe({ name: 'usage-remove', description: 'usage remove' }, () => [
  dm.guilds.add(1, (g) => [
    g[0].quests.add(2, (q) => [
      q[1].remove(),
      q[0].operations.filter({ where: { role: 'ward' } }).remove(),
    ]),
  ]),
]);

// ---- saveRecordAs({ name }) — that row's WHOLE record joins the plan's output
export const saveRecordAsExample = recipe({ name: 'usage-save-record', description: 'usage save record' }, () => [
  dm.guilds.add(1, (g) => [
    g[0].saveRecordAs({ name: 'guild' }),
    g[0].quests.add(1, (q) => [q[0].saveRecordAs({ name: 'target' })]),
  ]),
]);

// ---- fromSaved({ name, field }) — a cross-link the tree cannot express
export const fromSavedExample = recipe({ name: 'usage-from-saved', description: 'usage from saved' }, () => [
  dm.guilds.add(1, (g) => [
    g[0].sessions.add(1, (s) => [s[0].saveRecordAs({ name: 'origin' })]),
    g[0].quests.add(1, (q) => [
      q[0].set({ userRequest: fromSaved({ name: 'origin', field: 'sessionId' }) as never }),
    ]),
  ]),
]);

// ---- an ingredient's own EXTRA
export const extraExample = recipe({ name: 'usage-extra', description: 'usage extra' }, () => [
  dm.guilds.add(1, (g) => [
    g[0].sessions.add(1, (s) => [s[0].withNestedChain({ depth: 2 })]),
  ]),
]);

// ---- under({...}) — a link from a recipe INPUT rather than an ancestor
export const underExample = recipe({ name: 'usage-under', description: 'usage under' },
  ({ guildId }: { guildId: GuildId }) => [
    dm.sessions.under({ guildId }).add(1, (s) => [s[0].saveRecordAs({ name: 'made' })]),
  ],
);

// ---- the same verbs against a DATABASE-backed repo, unchanged
export const dbExample = recipe({ name: 'usage-db', description: 'usage db' }, () => [
  blog.users.add(2, (u, all) => [
    all.set({ displayName: 'seeded' }),
    u[0].saveRecordAs({ name: 'author' }),

    u[0].posts.add(3, (p, everyPost) => [
      everyPost.set({ body: 'lorem' }),
      p[0].set({ status: 'published' }),
      p[1].setRaw({ status: 'takendown' }),

      // a comment carries TWO foreign keys, and both ancestors are in scope here
      p[0].comments.add(1, (cm) => [cm[0].set({ body: 'first' })]),
    ]),
  ]),
]);

export const dbUnder = recipe({ name: 'usage-db-under', description: 'usage db under' }, ({ authorId }: { authorId: UserId }) => [
  blog.posts.under({ authorId }).add(1, (p) => [p[0].set({ title: 'on an existing author' })]),
]);
