import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { operationIngredient, sessionIngredient } from '../../packages/hydration/test/type-fixtures/dm-target';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const questTitleContract = z.string().brand<'QuestTitle'>();
const questFieldsContract = z.object({
  title: questTitleContract,
  userRequest: z.string().brand<'QuestUserRequest'>(),
  status: z.enum(['queued', 'accepted', 'underway', 'stalled', 'finished']),
  guildId: z.string().brand<'GuildId'>(),
});
const questRecordContract = z.object({
  id: z.string().brand<'QuestId'>(),
  title: questTitleContract,
  status: questFieldsContract.shape.status,
  guildId: z.string().brand<'GuildId'>(),
});
type QuestFields = z.infer<typeof questFieldsContract>;
const questFields: z.ZodType<QuestFields, z.ZodTypeDef, z.input<typeof questFieldsContract>> = questFieldsContract;

// `defaults` varies by Date.now(), not the index — a clock inside defaults, deliberately breaking
// determinism, then writes straight to a JSON file target (no server) so the bytes are inspectable.
const clockyQuest = ingredientDeclareBroker({
  name: 'quest',
  description: 'a quest whose defaults reads a clock instead of the index',
  fields: questFields,
  record: questRecordContract,
  links: [{ of: 'guild', as: 'guildId' }],
  defaults: (index: number) => ({ title: questTitleContract.parse(`Quest ${index + 1} at ${Date.now()}`) }),
  routes: {
    write: async ({ fields }: { fields: Record<string, unknown> }): Promise<unknown> =>
      questRecordContract.parse({ id: 'q-' + String(fields.title).length, title: fields.title, status: 'queued', guildId: fields.guildId }),
  },
  copies: 'x',
} as never);

const guildFieldsContract = z.object({ name: z.string().brand<'GuildName'>(), path: z.string().brand<'GuildPath'>() });
const guildRecordContract = z.object({ id: z.string().brand<'GuildId'>(), name: guildFieldsContract.shape.name, urlSlug: z.string().brand<'UrlSlug'>() });
const writeGuild = ingredientDeclareBroker({
  name: 'guild',
  description: 'a guild ingredient with a write route, for this scratch only',
  fields: guildFieldsContract,
  record: guildRecordContract,
  routes: { write: async ({ fields }: { fields: Record<string, unknown> }): Promise<unknown> => guildRecordContract.parse({ id: 'g-1', name: fields.name, urlSlug: 'slug' }) },
  copies: 'x',
} as never);

const dm = registryCreateBroker({ guilds: writeGuild as never, quests: clockyQuest as never, operations: operationIngredient, sessions: sessionIngredient });
const ops = dm.guilds.add(1, (g) => [
  g[0].set({ name: 'Guild', path: '/tmp/guild-x' }),
  g[0].quests.add(1, (q) => [q[0].saveRecordAs({ name: 'quest' })]),
]) as unknown[];
const ingredients = [writeGuild, clockyQuest, operationIngredient, sessionIngredient] as unknown as Parameters<typeof planRunBroker>[0]['ingredients'];

const SCRATCH_CLOCK_GAP_MS = 5;
const buildOps = (): unknown[] =>
  dm.guilds.add(1, (g) => [
    g[0].set({ name: 'Guild', path: '/tmp/guild-x' }),
    g[0].quests.add(1, (q) => [q[0].saveRecordAs({ name: 'quest' })]),
  ]) as unknown[];

(async () => {
  // Part 1 — the SAME pre-built op tree, run against two fresh homes (what "run the same plan
  // twice" literally means once a plan is data built once).
  const homeA = mkdtempSync(join(tmpdir(), 'dm-a14-a-'));
  const resultA = await planRunBroker({ plan: { recipeName: 'a14', ops } as never, target: { home: homeA } as never, ingredients });
  await new Promise((r) => setTimeout(r, SCRATCH_CLOCK_GAP_MS));
  const homeB = mkdtempSync(join(tmpdir(), 'dm-a14-b-'));
  const resultB = await planRunBroker({ plan: { recipeName: 'a14', ops } as never, target: { home: homeB } as never, ingredients });

  console.log('SAME pre-built ops, run A:', JSON.stringify(resultA));
  console.log('SAME pre-built ops, run B:', JSON.stringify(resultB));
  console.log('identical?', JSON.stringify(resultA) === JSON.stringify(resultB));

  rmSync(homeA, { recursive: true, force: true });
  rmSync(homeB, { recursive: true, force: true });

  // Part 2 — REBUILDING the ops (calling the chain builder a second time), the way two separate
  // callers of the same recipe function would each get their own plan.
  const opsC = buildOps();
  await new Promise((r) => setTimeout(r, SCRATCH_CLOCK_GAP_MS));
  const opsD = buildOps();
  const homeC = mkdtempSync(join(tmpdir(), 'dm-a14-c-'));
  const resultC = await planRunBroker({ plan: { recipeName: 'a14', ops: opsC } as never, target: { home: homeC } as never, ingredients });
  const homeD = mkdtempSync(join(tmpdir(), 'dm-a14-d-'));
  const resultD = await planRunBroker({ plan: { recipeName: 'a14', ops: opsD } as never, target: { home: homeD } as never, ingredients });

  console.log('REBUILT ops, call C:', JSON.stringify(resultC));
  console.log('REBUILT ops, call D:', JSON.stringify(resultD));
  console.log('identical?', JSON.stringify(resultC) === JSON.stringify(resultD));

  rmSync(homeC, { recursive: true, force: true });
  rmSync(homeD, { recursive: true, force: true });
})();
