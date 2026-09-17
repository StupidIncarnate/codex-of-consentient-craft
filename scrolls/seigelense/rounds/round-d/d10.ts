// D10 — two ops racing the same file. The claim is "no error, and no race — the runner is serial."
// Each of two rows' write route logs a start/end pair around an artificial delay; if the runner
// ever ran them concurrently the two pairs would interleave (start-1, start-2, end-1, end-2 or
// similar). Recorded route call order is asserted as a plain array, verbatim.
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

const DELAY_MS = 30;
const ROW_COUNT = 2;
const looseSchema = z.object({}).passthrough();
const log = [] as unknown[];
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ingredient = ingredientDeclareBroker({
  name: 'racer',
  description: 'a scratch row whose write route logs start/end around a real delay, to expose any interleaving',
  fields: looseSchema,
  record: looseSchema,
  routes: {
    write: async ({ fields }: Record<PropertyKey, never>) => {
      const n = fields.n;
      log.push(`start-${n}`);
      await delay(DELAY_MS);
      log.push(`end-${n}`);
      return { id: `racer-${n}` };
    },
  },
  copies: 'x',
} as never);

const dm = entryChainTransformer({ registry: { racers: ingredient } }) as unknown as {
  racers: { add: (n: number, b: (rows: unknown, all: unknown) => unknown[]) => unknown };
};

const ops = dm.racers.add(ROW_COUNT, (rows: unknown) => {
  const r = rows as readonly Record<PropertyKey, unknown>[];
  const r0 = r[0] as unknown as { set: (v: Record<PropertyKey, unknown>) => unknown };
  const r1 = r[1] as unknown as { set: (v: Record<PropertyKey, unknown>) => unknown };
  return [r0.set({ n: 1 }), r1.set({ n: 2 })];
}) as unknown[];

const home = mkdtempSync(join(tmpdir(), 'dm-d10-'));

(async () => {
  console.log('=== D10 — two ops writing, one plan ===');
  await planRunBroker({
    plan: { recipeName: 'd10-scratch', ops } as unknown as HydrationPlan,
    target: { home } as unknown as HydrationTarget,
    ingredients: [ingredient] as unknown as readonly IngredientConfigData[],
  });
  console.log('recorded route call order:', JSON.stringify(log));
  rmSync(home, { recursive: true, force: true });
})();
