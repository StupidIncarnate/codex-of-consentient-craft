// C11 — `all.saveRecordAs({name})` over an add(3, ...): does it compile (yes — `all` exposes every
// verb `collection-chain-transformer.ts`'s own `all` object carries, saveRecordAs included), what
// does the op tree look like (N saveRecord ops, same name), and which row does the flat output end
// up holding?
// C12 — two SEPARATE `saveRecordAs` calls on different rows sharing one name: does pre-flight catch
// it (the FROMSAVED check only handles `fromSaved` usage, never a duplicate `saveRecordAs` NAME —
// confirmed by reading plan-preflight-broker.ts directly), and which row wins.
import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();
const ROW_COUNT = 3;
const LAST_ROW_INDEX = 2;

const makeQuest = (): unknown => {
  let seq = 0;
  return ingredientDeclareBroker({
    name: 'quest',
    description: 'a quest row, write-only, defaults vary the title by index',
    fields: looseSchema,
    record: looseSchema,
    defaults: (index: number) => ({ title: `Quest ${index + 1}` }),
    routes: {
      write: async ({ fields }: { fields: Record<PropertyKey, unknown> }) => {
        seq += 1;
        return { id: `q-${seq}`, title: fields.title };
      },
    },
    copies: 'x',
  } as never);
};

(async () => {
  // ---------- C11: all.saveRecordAs ----------
  const questC11 = makeQuest();
  const dmC11 = registryCreateBroker({ quests: questC11 as never });
  const opsC11 = dmC11.quests.add(ROW_COUNT, (_rows: unknown, all: { saveRecordAs: (a: { name: string }) => unknown }) => [
    all.saveRecordAs({ name: 'quest' }),
  ]).flat(Infinity as never);

  const saveRecordOpsC11 = opsC11.filter((op: unknown) => (op as Record<PropertyKey, unknown>).op === 'saveRecord');
  console.log('C11 op tree saveRecord ops:', JSON.stringify(saveRecordOpsC11));

  const homeC11 = mkdtempSync(join(tmpdir(), 'dm-c11-'));
  const resultC11 = await planRunBroker({
    plan: { recipeName: 'c11-scratch', ops: opsC11 } as never,
    target: { home: homeC11 } as never,
    ingredients: [questC11] as never,
  });
  console.log('C11 run result (which row does "quest" hold):', JSON.stringify(resultC11));
  rmSync(homeC11, { recursive: true, force: true });

  // ---------- C12: two separate saveRecordAs calls, same name, different rows ----------
  const questC12 = makeQuest();
  const dmC12 = registryCreateBroker({ quests: questC12 as never });
  const opsC12 = dmC12.quests.add(ROW_COUNT, (rows: unknown) => {
    const r = rows as unknown as { saveRecordAs: (a: { name: string }) => unknown }[];
    return [r[0].saveRecordAs({ name: 'target' }), r[LAST_ROW_INDEX].saveRecordAs({ name: 'target' })];
  }).flat(Infinity as never);

  const homeC12 = mkdtempSync(join(tmpdir(), 'dm-c12-'));
  try {
    const resultC12 = await planRunBroker({
      plan: { recipeName: 'c12-scratch', ops: opsC12 } as never,
      target: { home: homeC12 } as never,
      ingredients: [questC12] as never,
    });
    console.log('C12 NO THROW at pre-flight. run result (which row does "target" hold):', JSON.stringify(resultC12));
  } catch (error) {
    console.log('C12 THREW:', error instanceof Error ? `${error.constructor.name}: ${error.message}` : String(error));
  }
  rmSync(homeC12, { recursive: true, force: true });
})();
