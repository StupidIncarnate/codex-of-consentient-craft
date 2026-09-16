/**
 * Real-shaped ingredients for this repo, one per ROUTE kind, to prove the two differ.
 */
import type { Contract } from './hydration';
import { createHydration } from './hydration';

/** Dungeonmaster's own state is JSON on disk, so its target is a HOME DIRECTORY. */
export type DmTarget = {
  home: string;
  /** Absent for a caller with no server. Only `write` routes can run then. */
  baseUrl?: string;
};

const { ingredient, registry, run: dmRun } = createHydration<DmTarget>();
export { dmRun };

declare const httpPost: (a: { target: DmTarget; path: string; fields: Record<string, unknown> }) => Promise<unknown>;
declare const hydrate: (a: { target: DmTarget; fields: Record<string, unknown> }) => Promise<unknown>;

// ------------------------------------------------- branded ids

export type GuildId = string & { readonly _brand: 'GuildId' };
export type QuestId = string & { readonly _brand: 'QuestId' };
export type UrlSlug = string & { readonly _brand: 'UrlSlug' };

declare const c: <T>() => Contract<T>;

// ------------------------------------------------- guild — an API-route ingredient

export type GuildFields = { name: string; path: string };
export type GuildRecord = { id: GuildId; name: string; urlSlug: UrlSlug };

export const guildIngredient = ingredient({
  name: 'guild',
  description: 'a guild the server has registered, with its id and url slug minted',
  fields: c<GuildFields>(),
  record: c<GuildRecord>(),
  // The server mints the id and the slug, so there is no honest way to write this to
  // disk: `api` is the ONLY route, and a caller with no baseUrl cannot seed a guild.
  routes: { api: ({ target, fields }) => httpPost({ target, path: '/api/guilds', fields }) },
});

// ------------------------------------------------- quest — a WRITE-route ingredient

export type QuestStatus =
  | 'created'
  | 'explore_flows'
  | 'approved'
  | 'in_progress'
  | 'blocked'
  | 'complete';

export type QuestFields = {
  title: string;
  userRequest: string;
  status: QuestStatus;
  guildId: GuildId;
};

export type QuestRecord = {
  id: QuestId;
  title: string;
  status: QuestStatus;
  guildId: GuildId;
};

export const questIngredient = ingredient({
  name: 'quest',
  description: 'one quest under a guild, at whatever status you set it to',
  fields: c<QuestFields>(),
  record: c<QuestRecord>(),
  links: [{ of: 'guild', as: 'guildId' }],
  // Both routes. `api` posts and lets the server do what it really does; `write` drives
  // questHydrateBroker against the home directory, for a caller with no server.
  routes: {
    api: ({ target, fields }) => httpPost({ target, path: '/api/quests', fields }),
    write: ({ target, fields }) => hydrate({ target, fields }),
  },
  copies: 'questPersistBroker',
  // `blocked` is deliberately absent: nothing reaches it by asking.
  transitions: { field: 'status', to: ['created', 'approved', 'in_progress', 'complete'] },
});

// ------------------------------------------------- operation — a grandchild

export type OperationFields = {
  role: 'riftcarver' | 'codeweaver' | 'ward' | 'flowrider' | 'siegemaster';
  text: string;
  questId: QuestId;
  guildId: GuildId;
};
export type OperationRecord = { id: string; role: OperationFields['role'] };

export const operationIngredient = ingredient({
  name: 'operation',
  description: 'one operation item on a quest ledger, for a named role',
  fields: c<OperationFields>(),
  record: c<OperationRecord>(),
  // TWO links: the parent AND the grandparent.
  links: [
    { of: 'quest', as: 'questId' },
    { of: 'guild', as: 'guildId' },
  ],
  routes: { write: ({ target, fields }) => hydrate({ target, fields }) },
  copies: 'questOperationsUpdateBroker',
});

// ------------------------------------------------- session — extras, no lifecycle

export type SessionFields = { guildId: GuildId; transcript: string };
export type SessionRecord = { sessionId: string; url: UrlSlug };

export const sessionIngredient = ingredient({
  name: 'session',
  description: 'a claude session transcript on disk, addressable by url',
  fields: c<SessionFields>(),
  record: c<SessionRecord>(),
  links: [{ of: 'guild', as: 'guildId' }],
  routes: { write: ({ target, fields }) => hydrate({ target, fields }) },
  copies: 'chatSubagentTailBroker',
  extras: { withNestedChain: c<{ depth: number }>() },
});

// ------------------------------------------------- the registry
// The registry KEY is the accessor name a chain uses: `g[0].quests`.

export const dm = registry({
  guilds: guildIngredient,
  quests: questIngredient,
  operations: operationIngredient,
  sessions: sessionIngredient,
});
