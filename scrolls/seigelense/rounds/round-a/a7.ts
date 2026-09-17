import { registryCreateBroker } from '@dungeonmaster/hydration/brokers';
import { planRunBroker } from '@dungeonmaster/hydration/brokers';
import { guildIngredient, questIngredient, operationIngredient, sessionIngredient } from '../../packages/hydration/test/type-fixtures/dm-target';
import { mkdtempSync, existsSync, readdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const dm = registryCreateBroker({
  guilds: guildIngredient,
  quests: questIngredient,
  operations: operationIngredient,
  sessions: sessionIngredient,
});

// A7: questIngredient's own `links: [{ of: 'guild', as: 'guildId' }]` real link, added at TOP LEVEL
// with no guild anywhere in the plan (and no explicit guildId override either).
const ops = dm.quests.add(1, (q) => [q[0].set({ title: 'orphan', userRequest: 'seeded' })]) as unknown[];

const home = mkdtempSync(join(tmpdir(), 'dm-a7-'));
const ingredients = [guildIngredient, questIngredient, operationIngredient, sessionIngredient] as unknown as Parameters<typeof planRunBroker>[0]['ingredients'];

(async () => {
  try {
    await planRunBroker({
      plan: { recipeName: 'a7-scratch', ops } as unknown as Parameters<typeof planRunBroker>[0]['plan'],
      target: { home } as unknown as Parameters<typeof planRunBroker>[0]['target'],
      ingredients,
    });
    console.log('NO THROW (unexpected)');
  } catch (error) {
    console.log('THREW:', error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error));
  }
  const entries = existsSync(home) ? readdirSync(home) : ['<home does not exist>'];
  console.log('HOME CONTENTS after run:', JSON.stringify(entries));
  rmSync(home, { recursive: true, force: true });
})();
