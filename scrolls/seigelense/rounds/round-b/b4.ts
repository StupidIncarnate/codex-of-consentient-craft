// B4 — a `filter` inside a nested `add`. The gap is CLOSED (immediate-host scope), and this round
// CONFIRMS the runner enforces it rather than re-opening the question. dm-target.ts's own
// `operationIngredient` has no `query`/`remove` route, so this scratch ingredient set gives a
// task-like ingredient REAL query/remove routes backed by an in-memory array, the minimum needed to
// actually run a scoped filter at tier 3 (a temp home, no server).
import { z } from 'zod';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { entryChainTransformer } from '../../packages/hydration/src/transformers/entry-chain/entry-chain-transformer';
import { planRunBroker } from '../../packages/hydration/src/brokers/plan/run/plan-run-broker';
import type { IngredientConfigData } from '../../packages/hydration/src/contracts/ingredient-config/ingredient-config-contract';
import type { HydrationPlan } from '../../packages/hydration/src/contracts/hydration-plan/hydration-plan-contract';
import type { HydrationTarget } from '../../packages/hydration/src/contracts/hydration-target/hydration-target-contract';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();
const GUILD_COUNT = 2;

const tasksStore: Record<PropertyKey, unknown>[] = [];
let taskSeq = 0;
let questSeq = 0;
let guildSeq = 0;

const guildIngredient = ingredientDeclareBroker({
  name: 'guild2',
  description: 'a scratch guild-like row, write-route only',
  fields: looseSchema,
  record: looseSchema,
  routes: {
    write: async ({ fields }: { fields: Record<PropertyKey, unknown> }) => {
      guildSeq += 1;
      return { id: `guild2-${guildSeq}`, ...fields };
    },
  },
  copies: 'x',
} as never);

const questIngredient = ingredientDeclareBroker({
  name: 'quest2',
  description: 'a scratch quest-like row, links to guild2',
  fields: looseSchema,
  record: looseSchema,
  links: [{ of: 'guild2', as: 'guildId' }],
  routes: {
    write: async ({ fields }: { fields: Record<PropertyKey, unknown> }) => {
      questSeq += 1;
      return { id: `quest2-${questSeq}`, ...fields };
    },
  },
  copies: 'x',
} as never);

const taskIngredient = ingredientDeclareBroker({
  name: 'task',
  description: 'a scratch task row, links to quest2, real query/remove routes',
  fields: looseSchema,
  record: looseSchema,
  links: [{ of: 'quest2', as: 'questId' }],
  defaults: () => ({ role: 'riftcarver' }),
  routes: {
    write: async ({ fields }: { fields: Record<PropertyKey, unknown> }) => {
      taskSeq += 1;
      const row = { id: `task-${taskSeq}`, role: fields.role, questId: fields.questId };
      tasksStore.push(row);
      return row;
    },
    query: async ({ where }: { where: Record<PropertyKey, unknown> }) =>
      tasksStore.filter((row) => Object.entries(where).every(([key, value]) => row[key] === value)),
    remove: async ({ record }: { record: Record<PropertyKey, unknown> }) => {
      const index = tasksStore.findIndex((row) => row.id === record.id);
      if (index >= 0) {
        tasksStore.splice(index, 1);
      }
      return undefined;
    },
  },
  copies: 'x',
} as never);

const dm = entryChainTransformer({
  registry: { guilds: guildIngredient, quests: questIngredient, tasks: taskIngredient },
}) as unknown as {
  guilds: {
    add: (
      count: number,
      build: (rows: readonly unknown[]) => readonly unknown[],
    ) => readonly unknown[];
  };
};

const ops = dm.guilds.add(GUILD_COUNT, (g: unknown) => {
  const rows = g as readonly Record<PropertyKey, unknown>[];
  const g0 = rows[0] as unknown as { quests: { add: (n: number, b: (q: unknown) => unknown[]) => unknown } };
  const g1 = rows[1] as unknown as { quests: { add: (n: number, b: (q: unknown) => unknown[]) => unknown } };

  return [
    g0.quests.add(1, (q: unknown) => {
      const qrows = q as readonly Record<PropertyKey, unknown>[];
      const q0 = qrows[0] as unknown as {
        tasks: {
          add: (n: number, b: () => unknown[]) => unknown;
          filter: (a: { where: Record<PropertyKey, unknown>; expect: PropertyKey }) => { remove: () => unknown };
        };
      };
      return [q0.tasks.add(1, () => []), q0.tasks.filter({ where: { role: 'riftcarver' }, expect: 'one' }).remove()];
    }),
    g1.quests.add(1, (q: unknown) => {
      const qrows = q as readonly Record<PropertyKey, unknown>[];
      const q0 = qrows[0] as unknown as { tasks: { add: (n: number, b: () => unknown[]) => unknown } };
      return [q0.tasks.add(1, () => [])];
    }),
  ];
}) as unknown as readonly unknown[];

const ingredients = [guildIngredient, questIngredient, taskIngredient] as unknown as readonly IngredientConfigData[];
const home = mkdtempSync(join(tmpdir(), 'dm-b4-'));

(async () => {
  console.log('tasksStore BEFORE run:', JSON.stringify(tasksStore));
  try {
    await planRunBroker({
      plan: { recipeName: 'b4-scratch', ops } as unknown as HydrationPlan,
      target: { home } as unknown as HydrationTarget,
      ingredients,
    });
    console.log('NO THROW');
  } catch (error) {
    console.log('THREW:', error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error));
  }
  console.log('tasksStore AFTER run:', JSON.stringify(tasksStore));
  rmSync(home, { recursive: true, force: true });
})();
