import { registryCreateBroker } from '@dungeonmaster/hydration/brokers';
import { guildIngredient, operationIngredient, sessionIngredient } from '../../packages/hydration/test/type-fixtures/dm-target';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';

// Build three variants of a quest-shaped ingredient, all otherwise identical:
//  - noDefaults: no `defaults` key at all
//  - constDefaults: `defaults: () => ({ title: 'Quest' })`, ignoring the index
//  - realDefaults: `defaults: (index) => ({ title: `Quest ${index+1}` })` (dm-target's real shape)
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

const base = {
  name: 'quest' as const,
  description: 'one quest under a guild',
  fields: questFields,
  record: questRecordContract,
  links: [{ of: 'guild', as: 'guildId' }],
  routes: { write: async (): Promise<unknown> => undefined },
  copies: 'x',
};

const noDefaults = ingredientDeclareBroker({ ...base } as never);
const constDefaults = ingredientDeclareBroker({ ...base, defaults: () => ({ title: 'Quest' }) } as never);
const realDefaults = ingredientDeclareBroker({ ...base, defaults: (index: number) => ({ title: `Quest ${index + 1}` }) } as never);

const buildOps = (questIngredient: unknown): unknown[] => {
  const dm = registryCreateBroker({ guilds: guildIngredient, quests: questIngredient as never, operations: operationIngredient, sessions: sessionIngredient });
  return dm.guilds.add(1, (g) => [g[0].quests.add(3, () => [])]) as unknown[];
};

const noDefaultsOps = buildOps(noDefaults);
const constDefaultsOps = buildOps(constDefaults);
const realDefaultsOps = buildOps(realDefaults);

console.log('--- A12: no defaults, add(3) ---');
console.log(JSON.stringify(noDefaultsOps, null, 0));
console.log('--- A13: constant defaults, add(3) ---');
console.log(JSON.stringify(constDefaultsOps, null, 0));
console.log('--- A12 vs A13 op trees identical? ---', JSON.stringify(noDefaultsOps) === JSON.stringify(constDefaultsOps));
console.log('--- real (index-varying) defaults, add(3), for contrast ---');
console.log(JSON.stringify(realDefaultsOps, null, 0));
