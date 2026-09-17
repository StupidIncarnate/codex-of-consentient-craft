// C6 — `remove` on a parent whose children exist. The plan predicts three possible outcomes
// (cascade, orphan, throw) and says "whatever happens is whatever the remove ROUTE does" — the
// runner itself does nothing about children. This scratch `quest`'s remove route deletes only the
// quest's own row from its store and does nothing to `operation` rows referencing it — the naive,
// most-likely-real-world implementation — to see whether the runner catches the orphan on its own.
import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();
const questStore: Record<PropertyKey, unknown>[] = [];
const operationsStore: Record<PropertyKey, unknown>[] = [];
let questSeq = 0;
let opSeq = 0;

const quest = ingredientDeclareBroker({
  name: 'quest',
  description: 'a quest row whose remove route only deletes its OWN row, nothing about children',
  fields: looseSchema,
  record: looseSchema,
  routes: {
    write: async () => {
      questSeq += 1;
      const row = { id: `q-${questSeq}`, title: 'target' };
      questStore.push(row);
      return row;
    },
    query: async ({ where }: { where: Record<PropertyKey, unknown> }) =>
      questStore.filter((row) => Object.entries(where).every(([k, v]) => row[k] === v)),
    remove: async ({ record }: { record: Record<PropertyKey, unknown> }) => {
      const index = questStore.findIndex((row) => row.id === record.id);
      if (index >= 0) {
        questStore.splice(index, 1);
      }
      return undefined;
    },
  },
  copies: 'x',
} as never);

const operation = ingredientDeclareBroker({
  name: 'operation',
  description: 'an operation row linked to a quest',
  fields: looseSchema,
  record: looseSchema,
  links: [{ of: 'quest', as: 'questId' }],
  routes: {
    write: async ({ fields }: { fields: Record<PropertyKey, unknown> }) => {
      opSeq += 1;
      const row = { id: `op-${opSeq}`, questId: fields.questId };
      operationsStore.push(row);
      return row;
    },
  },
  copies: 'x',
} as never);

const dm = registryCreateBroker({ quests: quest as never, operations: operation as never });

const ops = dm.quests.add(1, (q: never) => {
  const q0 = (q as unknown as Record<PropertyKey, unknown>[])[0] as unknown as {
    operations: { add: (n: number, b: () => unknown[]) => unknown };
  };
  return [q0.operations.add(1, () => [])];
}) as unknown[];

const removeOps = dm.quests.filter({ where: { title: 'target' }, expect: 'one' } as never).remove();

(async () => {
  const home = mkdtempSync(join(tmpdir(), 'dm-c6-'));
  const flatOps = [...ops, removeOps].flat(Infinity as never);
  console.log('BEFORE: questStore', JSON.stringify(questStore), 'operationsStore', JSON.stringify(operationsStore));
  const result = await planRunBroker({
    plan: { recipeName: 'c6-scratch', ops: flatOps } as never,
    target: { home } as never,
    ingredients: [quest, operation] as never,
  });
  console.log('run result:', JSON.stringify(result));
  console.log('AFTER: questStore', JSON.stringify(questStore), 'operationsStore', JSON.stringify(operationsStore));
  rmSync(home, { recursive: true, force: true });
})();
