/**
 * Every chainable, used the way a real recipe would. This file compiling clean IS the
 * positive half of the experiment.
 */
import { fromSaved, recipe } from './hydration';
import { dmRun as run } from './ingredients';
import type { GuildId, QuestRecord, SessionRecord } from './ingredients';
import { dm } from './ingredients';

const { guilds: guild, sessions: session } = dm;

// ------------------------------------------------- the worked example

export const guildMidExecution = recipe({ name: 'guild-mid-execution', description: 'one guild holding three quests, the first running with its riftcarver item dropped' }, () => [
  guild.add(1, (g) => [
    g[0].set({ name: 'Siege' }),

    g[0].quests.add(3, (q, all) => [
      all.set({ userRequest: 'seeded' }),

      // The transition and the plain field ride the SAME verb.
      q[0].set({ status: 'in_progress', title: 'The running one' }),

      // Going to in_progress seeds a relay. Drop what this walk does not want.
      q[0].operations.filter({ where: { role: 'riftcarver' }, expect: 'one' }).remove(),

      q[1].set({ title: 'The second one' }),
      q[2].saveRecordAs({ name: 'third' }),
    ]),
  ]),
]);

// ------------------------------------------------- a recipe with typed INPUTS

export const sessionWithNestedChain = recipe({ name: 'session-with-nested-chain', description: 'one session under an existing guild, holding a nested sub-agent chain' },
  ({ guildId }: { guildId: GuildId }) => [
    session.under({ guildId }).add(1, (s) => [
      s[0].withNestedChain({ depth: 2 }),
      s[0].saveRecordAs({ name: 'nested' }),
    ]),
  ],
);

// ------------------------------------------------- a cross-link

export const questFromSession = recipe({ name: 'quest-from-session', description: 'a guild whose quest records the session that opened it' }, () => [
  guild.add(1, (g) => [
    g[0].sessions.add(1, (s) => [s[0].saveRecordAs({ name: 'origin' })]),
    g[0].quests.add(1, (q) => [
      q[0].set({
        title: 'opened from a session',
        userRequest: fromSaved<SessionRecord>({ name: 'origin', field: 'sessionId' }) as never,
      }),
    ]),
  ]),
]);

// ------------------------------------------------- bulk via filter

export const manyQuests = recipe({ name: 'many-quests', description: 'one guild holding ten quests, every ward item removed' }, () => [
  guild.add(1, (g) => [
    g[0].quests.add(10, (q, all) => [
      all.set({ userRequest: 'bulk' }),
      // a run-time set over an unknown number of rows
      all.operations.filter({ where: { role: 'ward' }, expect: 'any' }).remove(),
    ]),
  ]),
]);

// ------------------------------------------------- the three callers

export const drivenByAWalk = async (): Promise<void> => {
  await run(guildMidExecution(), { home: '/tmp/h', baseUrl: 'http://localhost:3737' });
};

export const drivenByAnIntegrationTest = async (): Promise<QuestRecord> => {
  // no baseUrl — write routes only
  const out = await run(sessionWithNestedChain({ guildId: 'g1' as GuildId }), { home: '/tmp/h' });
  return out as unknown as QuestRecord;
};
