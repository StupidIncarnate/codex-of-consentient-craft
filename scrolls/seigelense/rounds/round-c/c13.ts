// C13 — `expect: 'one'` matching TWO rows. The plan requires it to THROW naming the candidates,
// deriving the rule from the tool's own no-pick rule ("ambiguity THROWS, and the error carries the
// candidates"). `isFilterExpectSatisfiedGuard`'s own source (`count === 1` for 'one') already
// answers this by construction; this script drives it for real and reads the THROWN MESSAGE.
import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();
const operationsStore: Record<PropertyKey, unknown>[] = [
  { id: 'op-1', role: 'ward' },
  { id: 'op-2', role: 'ward' },
];

const operation = ingredientDeclareBroker({
  name: 'operation',
  description: 'two ward operations pre-seeded in the store, real query/remove routes',
  fields: looseSchema,
  record: looseSchema,
  routes: {
    write: async () => ({ id: 'unused' }),
    query: async ({ where }: { where: Record<PropertyKey, unknown> }) =>
      operationsStore.filter((row) => Object.entries(where).every(([k, v]) => row[k] === v)),
    remove: async () => undefined,
  },
  copies: 'x',
} as never);

const dm = registryCreateBroker({ operations: operation as never });
const ops = dm.operations.filter({ where: { role: 'ward' }, expect: 'one' } as never).remove();

(async () => {
  const home = mkdtempSync(join(tmpdir(), 'dm-c13-'));
  try {
    await planRunBroker({
      plan: { recipeName: 'c13-scratch', ops: [ops].flat(Infinity as never) } as never,
      target: { home } as never,
      ingredients: [operation] as never,
    });
    console.log('NO THROW (unexpected)');
  } catch (error) {
    console.log('THREW:', error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error));
  }
  rmSync(home, { recursive: true, force: true });
})();
