// D20 — pre-flight: a chain call needs `query`, `update` or `remove` and the ingredient declares no
// matching route. The typed chain does not gate `.filter()`/`.remove()`/a written `.set()` on which
// routes an ingredient declares (only `add`'s own MAKE route is gated at the target level), so all
// three compile fine against a write-only ingredient and must be refused at the pre-flight instead.
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

const looseFields = z.object({}).passthrough();

const buildIngredient = () =>
  ingredientDeclareBroker({
    name: 'writeOnly',
    description: 'declares only a write route — no query, update or remove',
    fields: looseFields,
    record: looseFields,
    routes: { write: async ({ fields }: Record<PropertyKey, never>) => ({ id: 'w-1', ...fields }) },
    copies: 'x',
  } as never);

const runPlan = async ({ build, label }: { build: (dm: unknown) => unknown[]; label: string }) => {
  const ingredient = buildIngredient();
  const dm = entryChainTransformer({ registry: { rows: ingredient } });
  const ops = build(dm);
  const home = mkdtempSync(join(tmpdir(), 'dm-d20-'));
  console.log(`=== ${label} ===`);
  try {
    await planRunBroker({
      plan: { recipeName: 'd20-scratch', ops } as unknown as HydrationPlan,
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
  await runPlan({
    label: 'D20a — filter() needs "query"',
    build: (dmUnknown) => {
      const dm = dmUnknown as {
        rows: { filter: (a: { where: Record<PropertyKey, unknown> }) => { remove: () => unknown } };
      };
      return dm.rows.filter({ where: { x: 1 } }).remove() as unknown as unknown[];
    },
  });

  await runPlan({
    label: 'D20b — a matched-row remove() needs "remove", declared on the ingredient not just used through filter (same class, different verb text)',
    build: (dmUnknown) => {
      const dm = dmUnknown as {
        rows: { add: (n: number, b: (rows: unknown) => unknown[]) => unknown };
      };
      return dm.rows.add(1, (rows: unknown) => {
        const r0 = (rows as readonly Record<PropertyKey, unknown>[])[0] as unknown as {
          set: (v: Record<PropertyKey, unknown>) => unknown;
          remove: () => unknown;
        };
        return [r0.remove()];
      }) as unknown[];
    },
  });

})();

// D20c — a WRITTEN field set through a matched row (filter().set()), never folded into any create
// in this plan, needs "update". Isolated on its own ingredient (query + remove present, so the
// filter's own VERB check passes and the refusal names "update" specifically, not "query").
const runFilterSetPlan = async () => {
  const ingredient = ingredientDeclareBroker({
    name: 'queryableNoUpdate',
    description: 'declares query + remove but no update, no write route field-set path',
    fields: looseFields,
    record: looseFields,
    routes: {
      write: async ({ fields }: Record<PropertyKey, never>) => ({ id: 'q-1', ...fields }),
      query: async () => [{ id: 'q-1' }],
      remove: async () => undefined,
    },
    copies: 'x',
  } as never);
  const dm = entryChainTransformer({ registry: { rows: ingredient } }) as unknown as {
    rows: {
      filter: (a: { where: Record<PropertyKey, unknown> }) => { set: (v: Record<PropertyKey, unknown>) => unknown };
    };
  };
  const ops = dm.rows.filter({ where: { x: 1 } }).set({ b: 2 }) as unknown as unknown[];
  const home = mkdtempSync(join(tmpdir(), 'dm-d20c-'));
  console.log('=== D20c — filter().set() on a plain field needs "update" ===');
  try {
    await planRunBroker({
      plan: { recipeName: 'd20c-scratch', ops } as unknown as HydrationPlan,
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

runFilterSetPlan();
