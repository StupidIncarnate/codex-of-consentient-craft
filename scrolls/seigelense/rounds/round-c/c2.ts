// C2 — `saveRecordAs` on a row a later `remove` deletes. CONFIRM: the ruling
// (recipes-chunk-04-06-runner.md:302-304, D12) says the saved record is STALE, not absent and not
// an error — "a stale record a caller can inspect beats a hole it cannot." Three quests are added;
// the third is saved, then removed via a `filter().remove()` (real remove route, in-memory store).
import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();
const questStore: Record<PropertyKey, unknown>[] = [];
let seq = 0;
const ROW_COUNT = 3;
const THIRD_ROW_INDEX = 2;

const quest = ingredientDeclareBroker({
  name: 'quest',
  description: 'a quest row, real write/query/remove routes over an in-memory store',
  fields: looseSchema,
  record: looseSchema,
  defaults: (index: number) => ({ title: `Quest ${index + 1}` }),
  routes: {
    write: async ({ fields }: { fields: Record<string, unknown> }) => {
      seq += 1;
      const row = { id: `q-${seq}`, title: fields.title };
      questStore.push(row);
      return row;
    },
    query: async ({ where }: { where: Record<string, unknown> }) =>
      questStore.filter((row) => Object.entries(where).every(([k, v]) => row[k] === v)),
    remove: async ({ record }: { record: Record<string, unknown> }) => {
      const index = questStore.findIndex((row) => row.id === record.id);
      if (index >= 0) {
        questStore.splice(index, 1);
      }
      return undefined;
    },
  },
  copies: 'x',
} as never);

const dm = registryCreateBroker({ quests: quest as never });

const ops = dm.quests.add(ROW_COUNT, (q: never) => {
  const rows = q as unknown as { saveRecordAs: (a: { name: string }) => unknown }[];
  return [rows[THIRD_ROW_INDEX].saveRecordAs({ name: 'third' })];
}) as unknown[];

const removeOps = dm.quests
  .filter({ where: { title: 'Quest 3' }, expect: 'one' } as never)
  .remove() as unknown;

(async () => {
  const home = mkdtempSync(join(tmpdir(), 'dm-c2-'));
  const allOps = [...ops, removeOps].flat(Infinity as never) as unknown[];
  const result = await planRunBroker({
    plan: { recipeName: 'c2-scratch', ops: allOps } as never,
    target: { home } as never,
    ingredients: [quest] as never,
  });
  console.log('run result (plan output):', JSON.stringify(result));
  console.log('questStore AFTER run (real disk-equivalent state):', JSON.stringify(questStore));
  rmSync(home, { recursive: true, force: true });
})();
