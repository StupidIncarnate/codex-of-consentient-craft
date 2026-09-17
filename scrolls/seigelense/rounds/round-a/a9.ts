import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// An ingredient with a lifecycle-shaped `status` field but NO `transitions` key at all.
const statusFieldsContract = z.object({
  status: z.enum(['queued', 'in_progress', 'done']),
  title: z.string().brand<'Title'>(),
});
const statusRecordContract = z.object({ id: z.string().brand<'Id'>(), status: statusFieldsContract.shape.status, title: statusFieldsContract.shape.title });

const noTransitionsQuest = ingredientDeclareBroker({
  name: 'quest',
  description: 'a quest-shaped row with no transitions declared at all',
  fields: statusFieldsContract,
  record: statusRecordContract,
  routes: {
    write: async ({ fields }: { fields: Record<string, unknown> }): Promise<unknown> =>
      statusRecordContract.parse({ id: 'q-1', status: fields.status, title: fields.title }),
  },
  copies: 'x',
} as never);

const dm = registryCreateBroker({ quests: noTransitionsQuest as never });
// set() on the status field, exactly as a caller would if this were a real transition field.
const ops = dm.quests.add(1, (q) => [
  q[0].set({ title: 'Quest', status: 'in_progress' }),
  q[0].saveRecordAs({ name: 'quest' }),
]) as unknown[];

console.log('op tree for set({status}) with NO transitions declared:');
console.log(JSON.stringify(ops, null, 2));

const home = mkdtempSync(join(tmpdir(), 'dm-a9-'));
const ingredients = [noTransitionsQuest] as unknown as Parameters<typeof planRunBroker>[0]['ingredients'];

(async () => {
  const result = await planRunBroker({ plan: { recipeName: 'a9', ops } as never, target: { home } as never, ingredients });
  console.log('run result:', JSON.stringify(result));
  rmSync(home, { recursive: true, force: true });
})();
