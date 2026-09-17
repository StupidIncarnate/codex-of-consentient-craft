// D5 — the write fails, EACCES, from the START (fileTargetHarness.denyWrites before the run).
// D15 — the home goes read-only MID-PLAN: op A's own write route calls denyWrites on op B's
// directory right after A lands, so B's write hits a real EACCES that appeared DURING the run, not
// before it. Both use the real `fsEnsureWriteAdapter` and the real `fileTargetHarness`.
import { z } from 'zod';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { entryChainTransformer } from '../../packages/hydration/src/transformers/entry-chain/entry-chain-transformer';
import { planRunBroker } from '../../packages/hydration/src/brokers/plan/run/plan-run-broker';
import { fsEnsureWriteAdapter } from '../../packages/hydration/src/adapters/fs/ensure-write/fs-ensure-write-adapter';
import { fileTargetHarness } from '../../packages/hydration/test/harnesses/file-target/file-target.harness';
import type { IngredientConfigData } from '../../packages/hydration/src/contracts/ingredient-config/ingredient-config-contract';
import type { HydrationPlan } from '../../packages/hydration/src/contracts/hydration-plan/hydration-plan-contract';
import type { HydrationTarget } from '../../packages/hydration/src/contracts/hydration-target/hydration-target-contract';
import { existsSync } from 'fs';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();

const buildLockedIngredient = () =>
  ingredientDeclareBroker({
    name: 'locked',
    description: 'a scratch write-route row, real fsEnsureWriteAdapter, writes under home/locked',
    fields: looseSchema,
    record: looseSchema,
    routes: {
      write: async ({ target, fields }: Record<PropertyKey, never>) => {
        await fsEnsureWriteAdapter({
          filePath: join(target.home, 'locked', 'row.json') as never,
          content: JSON.stringify(fields) as never,
        });
        return { id: 'locked-1', ...fields };
      },
    },
    copies: 'x',
  } as never);

const buildPlan = (ingredient: unknown) => {
  const dm = entryChainTransformer({ registry: { rows: ingredient } }) as unknown as {
    rows: { add: (n: number, b: (rows: unknown) => unknown[]) => unknown };
  };
  return dm.rows.add(1, (rows: unknown) => {
    const r0 = (rows as readonly Record<PropertyKey, unknown>[])[0] as unknown as {
      set: (v: Record<PropertyKey, unknown>) => unknown;
    };
    return [r0.set({ label: 'x' })];
  }) as unknown[];
};

(async () => {
  // --- D5: denied from the start ---
  console.log('=== D5 — denyWrites BEFORE the run ===');
  const harness5 = fileTargetHarness();
  harness5.beforeEach();
  harness5.denyWrites({ relativePath: 'locked' });
  const ingredient5 = buildLockedIngredient();
  const ops5 = buildPlan(ingredient5);
  try {
    await planRunBroker({
      plan: { recipeName: 'd5-scratch', ops: ops5 } as unknown as HydrationPlan,
      target: harness5.target() as unknown as HydrationTarget,
      ingredients: [ingredient5] as unknown as readonly IngredientConfigData[],
    });
    console.log('NO THROW (unexpected)');
  } catch (error) {
    console.log(
      'THREW:',
      error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error),
    );
  }
  console.log('locked/row.json exists after D5:', existsSync(join(harness5.target().home, 'locked', 'row.json')));
  harness5.afterEach();

  // --- D15: denied MID-plan, by the first op's own side effect ---
  console.log('=== D15 — denyWrites called mid-plan, after op A landed ===');
  const harness15 = fileTargetHarness();
  harness15.beforeEach();
  const targetHome = harness15.target().home;

  const ingredientA = ingredientDeclareBroker({
    name: 'first',
    description: 'writes fine, then denies writes to "locked" as a side effect, simulating disk going read-only mid-plan',
    fields: looseSchema,
    record: looseSchema,
    routes: {
      write: async ({ fields }: Record<PropertyKey, never>) => {
        await fsEnsureWriteAdapter({
          filePath: join(targetHome, 'first', 'row.json') as never,
          content: JSON.stringify(fields) as never,
        });
        harness15.denyWrites({ relativePath: 'locked' });
        return { id: 'first-1', ...fields };
      },
    },
    copies: 'x',
  } as never);
  const ingredientB = buildLockedIngredient();

  const dm15 = entryChainTransformer({
    registry: { firsts: ingredientA, rows: ingredientB },
  }) as unknown as {
    firsts: { add: (n: number, b: (rows: unknown) => unknown[]) => unknown };
    rows: { add: (n: number, b: (rows: unknown) => unknown[]) => unknown };
  };
  const ops15 = [
    ...(dm15.firsts.add(1, (rows: unknown) => {
      const r0 = (rows as readonly Record<PropertyKey, unknown>[])[0] as unknown as {
        set: (v: Record<PropertyKey, unknown>) => unknown;
      };
      return [r0.set({ label: 'a' })];
    }) as unknown[]),
    ...(dm15.rows.add(1, (rows: unknown) => {
      const r0 = (rows as readonly Record<PropertyKey, unknown>[])[0] as unknown as {
        set: (v: Record<PropertyKey, unknown>) => unknown;
      };
      return [r0.set({ label: 'b' })];
    }) as unknown[]),
  ];

  try {
    await planRunBroker({
      plan: { recipeName: 'd15-scratch', ops: ops15 } as unknown as HydrationPlan,
      target: { home: targetHome } as unknown as HydrationTarget,
      ingredients: [ingredientA, ingredientB] as unknown as readonly IngredientConfigData[],
    });
    console.log('NO THROW (unexpected)');
  } catch (error) {
    console.log(
      'THREW:',
      error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error),
    );
  }
  console.log('first/row.json exists after D15 (should be true — landed before the deny):', existsSync(join(targetHome, 'first', 'row.json')));
  console.log('locked/row.json exists after D15 (should be false — denied):', existsSync(join(targetHome, 'locked', 'row.json')));
  harness15.afterEach();
})();
