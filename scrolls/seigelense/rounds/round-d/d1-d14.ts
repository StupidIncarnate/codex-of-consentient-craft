// D1 — the connection is refused, on an `api` route. Driven with the REAL fetchPostAdapter against
// a closed local port — no server started (a closed port IS the absence of one), so this needs no
// tier-4 infrastructure despite the plan's own §4 table filing it there.
// D14 rides along on the same run: a `note` (write route, real disk write) lands BEFORE the failing
// `remote` (api route), so the home directory afterwards proves what a half-run plan leaves behind.
import { z } from 'zod';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { entryChainTransformer } from '../../packages/hydration/src/transformers/entry-chain/entry-chain-transformer';
import { planRunBroker } from '../../packages/hydration/src/brokers/plan/run/plan-run-broker';
import { fetchPostAdapter } from '../../packages/hydration/src/adapters/fetch/post/fetch-post-adapter';
import type { IngredientConfigData } from '../../packages/hydration/src/contracts/ingredient-config/ingredient-config-contract';
import type { HydrationPlan } from '../../packages/hydration/src/contracts/hydration-plan/hydration-plan-contract';
import type { HydrationTarget } from '../../packages/hydration/src/contracts/hydration-target/hydration-target-contract';
import { mkdtempSync, readFileSync, existsSync, readdirSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();
let noteSeq = 0;

const noteIngredient = ingredientDeclareBroker({
  name: 'note',
  description: 'a scratch write-route row, real disk write, no links',
  fields: looseSchema,
  record: looseSchema,
  routes: {
    write: async ({ target, fields }: Record<PropertyKey, never>) => {
      noteSeq += 1;
      const id = `note-${noteSeq}`;
      const dir = join(target.home, 'notes');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `${id}.json`), JSON.stringify({ id, ...fields }));
      return { id, ...fields };
    },
  },
  copies: 'x',
} as never);

const remoteIngredient = ingredientDeclareBroker({
  name: 'remote',
  description: 'a scratch api-route row, real fetchPostAdapter, no links',
  fields: looseSchema,
  record: looseSchema,
  routes: {
    api: async ({ target, fields }: Record<PropertyKey, never>) =>
      fetchPostAdapter({ url: `${target.baseUrl}/api/remote`, fields }),
  },
} as never);

const dm = entryChainTransformer({
  registry: { notes: noteIngredient, remotes: remoteIngredient },
}) as unknown as {
  notes: { add: (n: number, b: (rows: unknown) => unknown[]) => unknown };
  remotes: { add: (n: number, b: (rows: unknown) => unknown[]) => unknown };
};

const ops = [
  ...(dm.notes.add(1, (rows: unknown) => {
    const r0 = (rows as readonly Record<PropertyKey, unknown>[])[0] as unknown as {
      set: (v: Record<PropertyKey, unknown>) => unknown;
    };
    return [r0.set({ text: 'landed before the failure' })];
  }) as unknown[]),
  ...(dm.remotes.add(1, (rows: unknown) => {
    const r0 = (rows as readonly Record<PropertyKey, unknown>[])[0] as unknown as {
      set: (v: Record<PropertyKey, unknown>) => unknown;
    };
    return [r0.set({ name: 'unreachable' })];
  }) as unknown[]),
];

const ingredients = [noteIngredient, remoteIngredient] as unknown as readonly IngredientConfigData[];
const home = mkdtempSync(join(tmpdir(), 'dm-d1-'));

(async () => {
  console.log('=== D1 / D14 ===');
  try {
    await planRunBroker({
      plan: { recipeName: 'd1-scratch', ops } as unknown as HydrationPlan,
      target: { home, baseUrl: 'http://127.0.0.1:39182' } as unknown as HydrationTarget,
      ingredients,
    });
    console.log('NO THROW (unexpected)');
  } catch (error) {
    console.log(
      'THREW:',
      error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error),
    );
  }
  const notesDir = join(home, 'notes');
  const noteFiles = existsSync(notesDir) ? readdirSync(notesDir) : [];
  console.log('HOME notes/ after run:', JSON.stringify(noteFiles));
  if (noteFiles.length > 0) {
    console.log('note file contents:', readFileSync(join(notesDir, noteFiles[0]), 'utf8'));
  }
  const remoteMarkerExists = existsSync(join(home, 'remotes'));
  console.log('HOME remotes/ dir exists (should be false, api route never writes disk):', remoteMarkerExists);
  rmSync(home, { recursive: true, force: true });
})();
