// C3 — `fromSaved` pointing into a filtered SET rather than one row. Open question per the plan:
// does the runner refuse a `saveRecordAs` inside a filter's nested ops, and if it does not, which
// row does the saved name end up holding when the filter matches MORE than one row? Run twice:
// once where the filter matches exactly one row, once where it matches two.
import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();

const runOnce = async (roles: readonly PropertyKey[]): Promise<void> => {
  const operationsStore: Record<PropertyKey, unknown>[] = [];
  let opSeq = 0;
  let questSeq = 0;

  const quest = ingredientDeclareBroker({
    name: 'quest',
    description: 'a quest row, write-only',
    fields: looseSchema,
    record: looseSchema,
    routes: {
      write: async () => {
        questSeq += 1;
        return { id: `q-${questSeq}` };
      },
    },
    copies: 'x',
  } as never);

  const operation = ingredientDeclareBroker({
    name: 'operation',
    description: 'an operation row, real write/query routes',
    fields: looseSchema,
    record: looseSchema,
    links: [{ of: 'quest', as: 'questId' }],
    routes: {
      write: async ({ fields }: { fields: Record<PropertyKey, unknown> }) => {
        opSeq += 1;
        const row = { id: `op-${opSeq}`, role: fields.role, questId: fields.questId };
        operationsStore.push(row);
        return row;
      },
      query: async ({ where }: { where: Record<PropertyKey, unknown> }) =>
        operationsStore.filter((row) => Object.entries(where).every(([k, v]) => row[k] === v)),
    },
    copies: 'x',
  } as never);

  const dm = registryCreateBroker({ quests: quest as never, operations: operation as never });

  const ops = dm.quests.add(1, (q: never) => {
    const q0 = (q as unknown as Record<PropertyKey, unknown>[])[0] as unknown as {
      operations: {
        add: (n: number, b: (o: unknown) => unknown[]) => unknown;
        filter: (a: { where: Record<PropertyKey, unknown> }) => { saveRecordAs: (a: { name: string }) => unknown };
      };
    };
    return [
      q0.operations.add(roles.length, (o: unknown) => {
        const rows = o as unknown as { set: (v: Record<PropertyKey, unknown>) => unknown }[];
        return roles.map((role, index) => rows[index].set({ role }));
      }),
      q0.operations.filter({ where: { role: 'ward' } }).saveRecordAs({ name: 'wardOp' }),
    ];
  }) as unknown[];

  const home = mkdtempSync(join(tmpdir(), 'dm-c3-'));
  const flatOps = ops.flat(Infinity as never);
  const result = await planRunBroker({
    plan: { recipeName: 'c3-scratch', ops: flatOps } as never,
    target: { home } as never,
    ingredients: [quest, operation] as never,
  });
  const savedWardOp = (result as unknown as Record<PropertyKey, unknown>).wardOp;
  console.log(`roles=${JSON.stringify(roles)} => saved.wardOp =`, JSON.stringify(savedWardOp));
  console.log('operationsStore:', JSON.stringify(operationsStore));
  rmSync(home, { recursive: true, force: true });
};

(async () => {
  console.log('--- one match ---');
  await runOnce(['riftcarver', 'ward']);
  console.log('--- two matches ---');
  await runOnce(['ward', 'riftcarver', 'ward']);
})();
