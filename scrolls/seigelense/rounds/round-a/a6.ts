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

// quest, operation, session all have write routes; guild is api-only. Put the api-only guild LAST,
// and give the quest an explicit guildId so no ancestor link is needed (top-level add, per A7).
const ops = [
  ...dm.quests.add(1, (q) => [q[0].set({ guildId: 'guild-x', title: 'Quest 1', userRequest: 'seeded' })]),
  ...dm.guilds.add(1, (g) => [g[0].set({ name: 'Guild', path: '/tmp/whatever' })]),
] as unknown[];

const home = mkdtempSync(join(tmpdir(), 'dm-a6-'));

const ingredients = [guildIngredient, questIngredient, operationIngredient, sessionIngredient] as unknown as Parameters<typeof planRunBroker>[0]['ingredients'];

(async () => {
  try {
    await planRunBroker({
      plan: { recipeName: 'a6-scratch', ops } as unknown as Parameters<typeof planRunBroker>[0]['plan'],
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
