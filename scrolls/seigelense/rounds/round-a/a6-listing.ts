import { registryCreateBroker } from '@dungeonmaster/hydration/brokers';
import { planRunsTransformer } from '@dungeonmaster/hydration/transformers';
import { guildIngredient, questIngredient, operationIngredient, sessionIngredient } from '../../packages/hydration/test/type-fixtures/dm-target';

const dm = registryCreateBroker({
  guilds: guildIngredient,
  quests: questIngredient,
  operations: operationIngredient,
  sessions: sessionIngredient,
});

const ops = [
  ...dm.quests.add(1, (q) => [q[0].set({ guildId: 'guild-x', title: 'Quest 1', userRequest: 'seeded' })]),
  ...dm.guilds.add(1, (g) => [g[0].set({ name: 'Guild', path: '/tmp/whatever' })]),
] as unknown[];

const ingredients = [guildIngredient, questIngredient, operationIngredient, sessionIngredient] as unknown as Parameters<typeof planRunsTransformer>[0]['ingredients'];

const result = planRunsTransformer({
  plan: { recipeName: 'a6-scratch', ops } as unknown as Parameters<typeof planRunsTransformer>[0]['plan'],
  ingredients,
});
console.log('planRunsTransformer result:', JSON.stringify(result));
