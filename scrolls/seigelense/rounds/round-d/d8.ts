// D8 — the query fails mid-plan, DISTINCTLY from zero match. Two runs, same shape, differing only
// in what the `query` route does: throws (unreachable) vs. resolves empty (the row was not there).
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

const buildIngredient = ({ queryThrows }: { queryThrows: boolean }) =>
  ingredientDeclareBroker({
    name: 'task',
    description: 'a scratch row with a query route that either throws or resolves empty on demand',
    fields: looseSchema,
    record: looseSchema,
    routes: {
      write: async ({ fields }: Record<PropertyKey, never>) => ({ id: 'task-1', ...fields }),
      query: async () => {
        if (queryThrows) {
          throw new Error('connect ECONNREFUSED 127.0.0.1:9 (scratch, unreachable app)');
        }
        return [];
      },
      remove: async () => undefined,
    },
    copies: 'x',
  } as never);

const buildPlan = (ingredient: unknown) => {
  const dm = entryChainTransformer({ registry: { tasks: ingredient } }) as unknown as {
    tasks: {
      filter: (a: { where: Record<PropertyKey, unknown>; expect?: string }) => { remove: () => unknown };
    };
  };
  return dm.tasks.filter({ where: { role: 'riftcarver' } }).remove() as unknown as unknown[];
};

const run = async ({ queryThrows, label }: { queryThrows: boolean; label: string }) => {
  const ingredient = buildIngredient({ queryThrows });
  const ops = buildPlan(ingredient);
  const home = mkdtempSync(join(tmpdir(), 'dm-d8-'));
  console.log(`=== ${label} ===`);
  try {
    await planRunBroker({
      plan: { recipeName: 'd8-scratch', ops } as unknown as HydrationPlan,
      target: { home } as unknown as HydrationTarget,
      ingredients: [ingredient] as unknown as readonly IngredientConfigData[],
    });
    console.log('NO THROW (unexpected)');
  } catch (error) {
    console.log(
      'THREW:',
      error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error),
    );
  }
  rmSync(home, { recursive: true, force: true });
};

(async () => {
  await run({ queryThrows: true, label: 'D8a — query route THROWS (app unreachable)' });
  await run({ queryThrows: false, label: 'D8b — query resolves empty (row not there)' });
})();
