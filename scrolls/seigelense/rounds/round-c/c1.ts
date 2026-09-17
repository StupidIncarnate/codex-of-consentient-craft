// C1 — `filter` over rows a `transition` in the same plan just minted. CONFIRM: the plan expects
// `filter` to read LIVE state, not the plan, so it sees rows a transition's `reach` minted as a
// side effect (never a `create` op in the tree — the relay is invisible to the op tree, per C9).
// A scratch `quest`-like ingredient's `reach` mints three `operation`-like rows into a shared
// in-memory store when walking to 'in_progress' (standing in for the real relay's out-of-band
// side effect); `operation` gets real query/remove routes over that store. The scope mechanism
// (`filterScopeWhereTransformer`) then narrows the filter's `where` to this quest's own id off
// whatever `reach` RETURNED — matching production exactly.
import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();
const operationsStore: Record<PropertyKey, unknown>[] = [];
let opSeq = 0;

const quest = ingredientDeclareBroker({
  name: 'quest',
  description: 'a quest whose in_progress transition mints operations as a side effect',
  fields: looseSchema,
  record: looseSchema,
  transitions: {
    field: 'status',
    to: ['created', 'in_progress'],
    reach: ({ from, to, record }: { from: unknown; to: unknown; record: Record<string, unknown> }) => {
      if (to === 'in_progress') {
        (['riftcarver', 'ward', 'codeweaver'] as const).forEach((role) => {
          opSeq += 1;
          operationsStore.push({ id: `op-${opSeq}`, role, questId: record.id });
        });
      }
      return { ...record, status: to };
    },
  },
  routes: {
    write: async ({ fields }: { fields: Record<string, unknown> }) => ({ id: 'q-1', title: fields.title, status: fields.status }),
  },
  copies: 'x',
} as never);

const operation = ingredientDeclareBroker({
  name: 'operation',
  description: 'an operation row minted by the quest relay, real query/remove routes',
  fields: looseSchema,
  record: looseSchema,
  links: [{ of: 'quest', as: 'questId' }],
  routes: {
    write: async ({ fields }: { fields: Record<string, unknown> }) => {
      opSeq += 1;
      const row = { id: `op-${opSeq}`, role: fields.role, questId: fields.questId };
      operationsStore.push(row);
      return row;
    },
    query: async ({ where }: { where: Record<string, unknown> }) =>
      operationsStore.filter((row) => Object.entries(where).every(([key, value]) => row[key] === value)),
    remove: async ({ record }: { record: Record<string, unknown> }) => {
      const index = operationsStore.findIndex((row) => row.id === record.id);
      if (index >= 0) {
        operationsStore.splice(index, 1);
      }
      return undefined;
    },
  },
  copies: 'x',
} as never);

const dm = registryCreateBroker({ quests: quest as never, operations: operation as never });

const ops = dm.quests.add(1, (q: never) => {
  const q0 = (q as unknown as Record<PropertyKey, unknown>[])[0] as unknown as {
    setRaw: (v: Record<string, unknown>) => unknown;
    set: (v: Record<string, unknown>) => unknown;
    operations: {
      filter: (a: { where: Record<string, unknown>; expect: string }) => { remove: () => unknown };
    };
  };
  return [
    q0.setRaw({ title: 'Quest', status: 'created' }),
    q0.set({ status: 'in_progress' }),
    q0.operations.filter({ where: { role: 'riftcarver' }, expect: 'one' }).remove(),
  ];
}) as unknown[];

(async () => {
  const home = mkdtempSync(join(tmpdir(), 'dm-c1-'));
  console.log('operationsStore BEFORE run:', JSON.stringify(operationsStore));
  try {
    await planRunBroker({
      plan: { recipeName: 'c1-scratch', ops } as never,
      target: { home } as never,
      ingredients: [quest, operation] as never,
    });
    console.log('NO THROW');
  } catch (error) {
    console.log('THREW:', error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error));
  }
  console.log('operationsStore AFTER run:', JSON.stringify(operationsStore));
  rmSync(home, { recursive: true, force: true });
})();
