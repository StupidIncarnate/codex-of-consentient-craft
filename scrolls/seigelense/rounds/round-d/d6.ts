// D6 — the parent directory does not exist. The pass is SILENCE: the real fsEnsureWriteAdapter
// `mkdir -p`s the parent rather than refusing. Home itself is a brand-new mkdtemp dir with no
// subdirectories at all, so `guilds/g1/quest.json`'s two levels of parent are both absent.
import { z } from 'zod';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { entryChainTransformer } from '../../packages/hydration/src/transformers/entry-chain/entry-chain-transformer';
import { planRunBroker } from '../../packages/hydration/src/brokers/plan/run/plan-run-broker';
import { fsEnsureWriteAdapter } from '../../packages/hydration/src/adapters/fs/ensure-write/fs-ensure-write-adapter';
import type { IngredientConfigData } from '../../packages/hydration/src/contracts/ingredient-config/ingredient-config-contract';
import type { HydrationPlan } from '../../packages/hydration/src/contracts/hydration-plan/hydration-plan-contract';
import type { HydrationTarget } from '../../packages/hydration/src/contracts/hydration-target/hydration-target-contract';
import { mkdtempSync, existsSync, readFileSync, readdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();

const ingredient = ingredientDeclareBroker({
  name: 'quest',
  description: 'writes two absent parent levels deep — guilds/g1/quest.json',
  fields: looseSchema,
  record: looseSchema,
  routes: {
    write: async ({ target, fields }: Record<PropertyKey, never>) => {
      await fsEnsureWriteAdapter({
        filePath: join(target.home, 'guilds', 'g1', 'quest.json') as never,
        content: JSON.stringify(fields) as never,
      });
      return { id: 'q1', ...fields };
    },
  },
  copies: 'x',
} as never);

const dm = entryChainTransformer({ registry: { quests: ingredient } }) as unknown as {
  quests: { add: (n: number, b: (rows: unknown) => unknown[]) => unknown };
};
const ops = dm.quests.add(1, (rows: unknown) => {
  const r0 = (rows as readonly Record<PropertyKey, unknown>[])[0] as unknown as {
    set: (v: Record<PropertyKey, unknown>) => unknown;
  };
  return [r0.set({ title: 'x' })];
}) as unknown[];

const home = mkdtempSync(join(tmpdir(), 'dm-d6-'));

(async () => {
  console.log('=== D6 — parent directory absent, no guilds/ dir at all yet ===');
  console.log('home entries BEFORE run:', JSON.stringify(readdirSync(home)));
  try {
    await planRunBroker({
      plan: { recipeName: 'd6-scratch', ops } as unknown as HydrationPlan,
      target: { home } as unknown as HydrationTarget,
      ingredients: [ingredient] as unknown as readonly IngredientConfigData[],
    });
    console.log('NO THROW');
  } catch (error) {
    console.log(
      'THREW (unexpected):',
      error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error),
    );
  }
  const filePath = join(home, 'guilds', 'g1', 'quest.json');
  console.log('file landed:', existsSync(filePath));
  console.log('contents:', existsSync(filePath) ? readFileSync(filePath, 'utf8') : '(absent)');
  rmSync(home, { recursive: true, force: true });
})();
