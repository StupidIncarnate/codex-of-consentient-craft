// D16 — C8, driven as a sad path: `under()` handed an id that names no real guild. `under()`'s
// values are folded into the create op's FIELDS at build time (collection-chain-transformer.ts),
// so the pre-flight's LINKS check sees a satisfied link (the field is present) and has nothing left
// to refuse. Against a file target, the write route writes exactly where it is told, manufacturing
// a directory for a guild that was never created.
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

const sessionIngredient = ingredientDeclareBroker({
  name: 'session2',
  description: 'links to guild2, write route writes under home/guilds/<guildId>/sessions/<id>.json',
  fields: looseSchema,
  record: looseSchema,
  links: [{ of: 'guild2', as: 'guildId' }],
  routes: {
    write: async ({ target, fields }: Record<PropertyKey, never>) => {
      const filePath = join(target.home, 'guilds', String(fields.guildId), 'sessions', 'row.json');
      await fsEnsureWriteAdapter({ filePath: filePath as never, content: JSON.stringify(fields) as never });
      return { sessionId: 's1', ...fields };
    },
  },
  copies: 'x',
} as never);

const dm = entryChainTransformer({ registry: { sessions: sessionIngredient } }) as unknown as {
  sessions: {
    under: (ids: Record<PropertyKey, unknown>) => {
      add: (n: number, b: (rows: unknown) => unknown[]) => unknown;
    };
  };
};

const DEAD_GUILD_ID = 'guild-that-was-never-created';
const ops = dm.sessions.under({ guildId: DEAD_GUILD_ID }).add(1, (rows: unknown) => {
  const r0 = (rows as readonly Record<PropertyKey, unknown>[])[0] as unknown as {
    set: (v: Record<PropertyKey, unknown>) => unknown;
  };
  return [r0.set({ transcript: 'ghost session' })];
}) as unknown[];

const home = mkdtempSync(join(tmpdir(), 'dm-d16-'));

(async () => {
  console.log('=== D16 / C8 — under() with a dead guild id, file target ===');
  console.log('home entries BEFORE run:', JSON.stringify(readdirSync(home)));
  try {
    await planRunBroker({
      plan: { recipeName: 'd16-scratch', ops } as unknown as HydrationPlan,
      target: { home } as unknown as HydrationTarget,
      ingredients: [sessionIngredient] as unknown as readonly IngredientConfigData[],
    });
    console.log('NO THROW — pre-flight had nothing to refuse, per collection-chain-transformer.ts');
  } catch (error) {
    console.log(
      'THREW:',
      error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error),
    );
  }
  const ghostPath = join(home, 'guilds', DEAD_GUILD_ID, 'sessions', 'row.json');
  console.log('manufactured path exists:', existsSync(ghostPath));
  console.log('contents:', existsSync(ghostPath) ? readFileSync(ghostPath, 'utf8') : '(absent)');
  rmSync(home, { recursive: true, force: true });
})();
