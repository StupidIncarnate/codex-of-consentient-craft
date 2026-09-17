import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// WIDER: `fields` carries an extra `priority` the real entity's record never had.
const wideFieldsContract = z.object({
  title: z.string().brand<'Title'>(),
  priority: z.number().brand<'Priority'>(),
});
const narrowRecordContract = z.object({ id: z.string().brand<'Id'>(), title: wideFieldsContract.shape.title });

const wideQuest = ingredientDeclareBroker({
  name: 'quest',
  description: 'a quest ingredient whose fields declare an extra field the record never had',
  fields: wideFieldsContract,
  record: narrowRecordContract,
  routes: {
    write: async ({ fields }: { fields: Record<string, unknown> }): Promise<unknown> => {
      // A REAL write route, imitating a file-backed hydrate call that writes the whole `fields`
      // object to disk verbatim (as `questPersistBroker`-style code typically would).
      process.stdout.write(`write route received fields: ${JSON.stringify(fields)}\n`);
      return { id: 'q-1', title: fields.title };
    },
  },
  copies: 'x',
} as never);

const dm = registryCreateBroker({ quests: wideQuest as never });
const ops = dm.quests.add(1, (q) => [
  q[0].set({ title: 'Quest', priority: 99 }),
]) as unknown as unknown[];

(async () => {
  const home = mkdtempSync(join(tmpdir(), 'dm-a4-'));
  const ingredients = [wideQuest] as unknown as Parameters<typeof planRunBroker>[0]['ingredients'];
  try {
    const result = await planRunBroker({ plan: { recipeName: 'a4-scratch', ops } as never, target: { home } as never, ingredients });
    console.log('NO THROW. Result (record contract projects extra field away):', JSON.stringify(result));
  } catch (error) {
    console.log('THREW:', error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error));
  }
  rmSync(home, { recursive: true, force: true });
})();
