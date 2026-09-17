import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const statusFieldsContract = z.object({
  status: z.enum(['created', 'approved', 'in_progress', 'blocked']),
  title: z.string().brand<'Title'>(),
});
const statusRecordContract = z.object({ id: z.string().brand<'Id'>(), status: statusFieldsContract.shape.status, title: statusFieldsContract.shape.title });

// The `to` list is WIDER than the gates actually allow: it includes 'blocked', but the real gate
// (`reach`) refuses any transition landing on 'blocked' — a quest needs at least one session first.
const wideToQuest = ingredientDeclareBroker({
  name: 'quest',
  description: 'a quest whose transitions.to lists a state the gates actually refuse',
  fields: statusFieldsContract,
  record: statusRecordContract,
  transitions: {
    field: 'status',
    to: ['created', 'approved', 'in_progress', 'blocked'],
    reach: ({ from, to }: { from: string; to: string }): unknown => {
      if (to === 'blocked') {
        throw new Error('a quest needs at least one session before it can go to blocked');
      }
      return { status: to };
    },
  },
  routes: {
    write: async ({ fields }: { fields: Record<string, unknown> }): Promise<unknown> =>
      statusRecordContract.parse({ id: 'q-1', status: fields.status, title: fields.title }),
  },
  copies: 'x',
} as never);

const dm = registryCreateBroker({ quests: wideToQuest as never });
const ops = dm.quests.add(1, (q) => [
  // Seed the initial status with setRaw (no walk) so the create's own write succeeds, then drive
  // the REAL transition this case is about with a plain `set`.
  q[0].setRaw({ title: 'Quest', status: 'created' }),
  q[0].set({ status: 'blocked' }),
]) as unknown[];

const home = mkdtempSync(join(tmpdir(), 'dm-a11-'));
const ingredients = [wideToQuest] as unknown as Parameters<typeof planRunBroker>[0]['ingredients'];

(async () => {
  try {
    await planRunBroker({ plan: { recipeName: 'a11-scratch', ops } as never, target: { home } as never, ingredients });
    console.log('NO THROW (unexpected)');
  } catch (error) {
    console.log('THREW:', error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error));
  }
  rmSync(home, { recursive: true, force: true });
})();
