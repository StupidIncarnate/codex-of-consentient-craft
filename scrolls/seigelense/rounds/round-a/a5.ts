import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const guildFieldsContract = z.object({ name: z.string().brand<'GuildName'>() });
const fullGuildRecordContract = z.object({
  id: z.string().brand<'GuildId'>(),
  name: guildFieldsContract.shape.name,
  urlSlug: z.string().brand<'UrlSlug'>(),
});
// A5: `record` OMITS `urlSlug`, a field the write route really returns.
const narrowedGuildRecordContract = fullGuildRecordContract.omit({ urlSlug: true });

const guild = ingredientDeclareBroker({
  name: 'guild',
  description: "a guild whose record contract omits urlSlug, a field the server really mints",
  fields: guildFieldsContract,
  record: narrowedGuildRecordContract,
  routes: {
    write: async ({ fields }: { fields: Record<string, unknown> }): Promise<unknown> =>
      // The real write route returns the FULL record, urlSlug included.
      fullGuildRecordContract.parse({ id: 'g-1', name: fields.name, urlSlug: 'guild-1-slug' }),
  },
  copies: 'x',
} as never);

const questFieldsContract = z.object({ title: z.string().brand<'Title'>(), origin: z.string().brand<'Origin'>() });
const questRecordContract = z.object({ id: z.string().brand<'QId'>(), title: questFieldsContract.shape.title, origin: questFieldsContract.shape.origin });
const quest = ingredientDeclareBroker({
  name: 'quest',
  description: 'a quest reading a fromSaved field the guild record no longer carries',
  fields: questFieldsContract,
  record: questRecordContract,
  routes: {
    write: async ({ fields }: { fields: Record<string, unknown> }): Promise<unknown> =>
      questRecordContract.parse({ id: 'q-1', title: fields.title, origin: fields.origin ?? 'MISSING-BUT-NOT-CAUGHT' }),
  },
  copies: 'x',
} as never);

const dm = registryCreateBroker({ guilds: guild as never, quests: quest as never });

(async () => {
  const home = mkdtempSync(join(tmpdir(), 'dm-a5-'));
  const ingredients = [guild, quest] as unknown as Parameters<typeof planRunBroker>[0]['ingredients'];

  const ops = [
    ...dm.guilds.add(1, (g) => [g[0].set({ name: 'Guild' }), g[0].saveRecordAs({ name: 'guild' })]),
    ...dm.quests.add(1, (q) => [
      // fromSaved reads a field ('urlSlug') the OMITTED record contract stripped out.
      q[0].set({ title: 'Quest', origin: { __savedRef: true, name: 'guild', field: 'urlSlug' } as never }),
      q[0].saveRecordAs({ name: 'quest' }),
    ]),
  ] as unknown[];

  try {
    const result = await planRunBroker({ plan: { recipeName: 'a5-scratch', ops } as never, target: { home } as never, ingredients });
    console.log('NO THROW. Result:', JSON.stringify(result));
  } catch (error) {
    console.log('THREW:', error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error));
  }
  rmSync(home, { recursive: true, force: true });
})();
