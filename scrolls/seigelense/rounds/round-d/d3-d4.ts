// D3 — the server answers 2xx with a shape `record` rejects (api route).
// D4 — the same failure through a `write` route, and whether the message still (wrongly) claims
// "answered 2xx" for a route that never answered any status. `route:` is just a label the runner
// dispatches on — the route FUNCTION decides what "answering" means, exactly like a `write` route
// already does, so this needs no real HTTP call and no server, same tier as a `write`-route test.
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
const strictRecord = z.object({
  id: z.string().brand<'ScratchThingId'>(),
  urlSlug: z.string().brand<'ScratchUrlSlug'>(),
});

const buildIngredient = () =>
  ingredientDeclareBroker({
    name: 'thing',
    description: 'a scratch row whose record requires urlSlug, which neither route returns',
    fields: looseFields,
    record: strictRecord,
    routes: {
      api: async () => ({ id: 'api-1' }),
      write: async () => ({ id: 'write-1' }),
    },
    copies: 'x',
  } as never);

const buildPlan = (ingredient: unknown) => {
  const dm = entryChainTransformer({ registry: { things: ingredient } }) as unknown as {
    things: { add: (n: number, b: (rows: unknown) => unknown[]) => unknown };
  };
  return dm.things.add(1, (rows: unknown) => {
    const r0 = (rows as readonly Record<PropertyKey, unknown>[])[0] as unknown as {
      set: (v: Record<PropertyKey, unknown>) => unknown;
    };
    return [r0.set({ label: 'x' })];
  }) as unknown[];
};

const run = async ({ withBaseUrl, label }: { withBaseUrl: boolean; label: string }) => {
  const ingredient = buildIngredient();
  const ops = buildPlan(ingredient);
  const ingredients = [ingredient] as unknown as readonly IngredientConfigData[];
  const home = mkdtempSync(join(tmpdir(), 'dm-d3d4-'));
  const target = withBaseUrl ? { home, baseUrl: 'http://example.invalid' } : { home };
  console.log(`=== ${label} ===`);
  try {
    await planRunBroker({
      plan: { recipeName: 'd3d4-scratch', ops } as unknown as HydrationPlan,
      target: target as unknown as HydrationTarget,
      ingredients,
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
  await run({ withBaseUrl: true, label: 'D3 — api route, 2xx shape record rejects' });
  await run({ withBaseUrl: false, label: 'D4 — write route, shape record rejects' });
})();
