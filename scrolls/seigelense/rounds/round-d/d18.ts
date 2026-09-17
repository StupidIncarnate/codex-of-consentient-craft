// D18 — pre-flight: a `fromSaved` naming a record no op saves, or one declared LATER, or a FIELD
// its producing ingredient's record contract never declares. Three sub-cases, three separate plans
// (pre-flight throws on the first offending fromSaved it walks to).
import { z } from 'zod';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { entryChainTransformer } from '../../packages/hydration/src/transformers/entry-chain/entry-chain-transformer';
import { planRunBroker } from '../../packages/hydration/src/brokers/plan/run/plan-run-broker';
import { fromSavedRefTransformer } from '../../packages/hydration/src/transformers/from-saved-ref/from-saved-ref-transformer';
import type { IngredientConfigData } from '../../packages/hydration/src/contracts/ingredient-config/ingredient-config-contract';
import type { HydrationPlan } from '../../packages/hydration/src/contracts/hydration-plan/hydration-plan-contract';
import type { HydrationTarget } from '../../packages/hydration/src/contracts/hydration-target/hydration-target-contract';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseFields = z.object({}).passthrough();
const guildRecord = z.object({
  id: z.string().brand<'ScratchGuildId'>(),
  name: z.string().brand<'ScratchGuildName'>(),
});

const buildGuildIngredient = () =>
  ingredientDeclareBroker({
    name: 'guild2',
    description: 'a scratch guild row, record has only id + name, no urlSlug',
    fields: looseFields,
    record: guildRecord,
    routes: { write: async ({ fields }: Record<PropertyKey, never>) => ({ id: 'g-1', name: 'Guild', ...fields }) },
    copies: 'x',
  } as never);

const buildQuestIngredient = () =>
  ingredientDeclareBroker({
    name: 'quest2',
    description: 'a scratch quest row, no links, used only to carry a fromSaved value',
    fields: looseFields,
    record: looseFields,
    routes: { write: async ({ fields }: Record<PropertyKey, never>) => ({ id: 'q-1', ...fields }) },
    copies: 'x',
  } as never);

const runPlan = async ({ ops, ingredients, label }: { ops: unknown[]; ingredients: unknown[]; label: string }) => {
  const home = mkdtempSync(join(tmpdir(), 'dm-d18-'));
  console.log(`=== ${label} ===`);
  try {
    await planRunBroker({
      plan: { recipeName: 'd18-scratch', ops } as unknown as HydrationPlan,
      target: { home } as unknown as HydrationTarget,
      ingredients: ingredients as unknown as readonly IngredientConfigData[],
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
  // (a) unknown name entirely — "ghost" is never saved anywhere in the plan.
  {
    const guild = buildGuildIngredient();
    const quest = buildQuestIngredient();
    const dm = entryChainTransformer({ registry: { guilds: guild, quests: quest } }) as unknown as {
      guilds: { add: (n: number, b: (rows: unknown) => unknown[]) => unknown };
      quests: { add: (n: number, b: (rows: unknown) => unknown[]) => unknown };
    };
    const ops = [
      ...(dm.guilds.add(1, (rows: unknown) => {
        const r0 = (rows as readonly Record<PropertyKey, unknown>[])[0] as unknown as {
          set: (v: Record<PropertyKey, unknown>) => unknown;
          saveRecordAs: (a: { name: string }) => unknown;
        };
        return [r0.set({ name: 'g' }), r0.saveRecordAs({ name: 'guild' })];
      }) as unknown[]),
      ...(dm.quests.add(1, (rows: unknown) => {
        const r0 = (rows as readonly Record<PropertyKey, unknown>[])[0] as unknown as {
          set: (v: Record<PropertyKey, unknown>) => unknown;
        };
        return [r0.set({ userRequest: fromSavedRefTransformer({ name: 'ghost' as never }) })];
      }) as unknown[]),
    ];
    await runPlan({ ops, ingredients: [guild, quest], label: 'D18a — fromSaved("ghost") never saved anywhere' });
  }

  // (b) forward reference — "future" IS saved, but LATER in declaration order than the fromSaved use.
  {
    const guild = buildGuildIngredient();
    const quest = buildQuestIngredient();
    const dm = entryChainTransformer({ registry: { guilds: guild, quests: quest } }) as unknown as {
      guilds: { add: (n: number, b: (rows: unknown) => unknown[]) => unknown };
      quests: { add: (n: number, b: (rows: unknown) => unknown[]) => unknown };
    };
    const ops = [
      ...(dm.quests.add(1, (rows: unknown) => {
        const r0 = (rows as readonly Record<PropertyKey, unknown>[])[0] as unknown as {
          set: (v: Record<PropertyKey, unknown>) => unknown;
        };
        return [r0.set({ userRequest: fromSavedRefTransformer({ name: 'future' as never }) })];
      }) as unknown[]),
      ...(dm.guilds.add(1, (rows: unknown) => {
        const r0 = (rows as readonly Record<PropertyKey, unknown>[])[0] as unknown as {
          set: (v: Record<PropertyKey, unknown>) => unknown;
          saveRecordAs: (a: { name: string }) => unknown;
        };
        return [r0.set({ name: 'g' }), r0.saveRecordAs({ name: 'future' })];
      }) as unknown[]),
    ];
    await runPlan({ ops, ingredients: [guild, quest], label: 'D18b — fromSaved("future") saved LATER in the same plan' });
  }

  // (c) known name, unknown field — "guild" resolves, but its record never declares "urlSlug".
  {
    const guild = buildGuildIngredient();
    const quest = buildQuestIngredient();
    const dm = entryChainTransformer({ registry: { guilds: guild, quests: quest } }) as unknown as {
      guilds: { add: (n: number, b: (rows: unknown) => unknown[]) => unknown };
      quests: { add: (n: number, b: (rows: unknown) => unknown[]) => unknown };
    };
    const ops = [
      ...(dm.guilds.add(1, (rows: unknown) => {
        const r0 = (rows as readonly Record<PropertyKey, unknown>[])[0] as unknown as {
          set: (v: Record<PropertyKey, unknown>) => unknown;
          saveRecordAs: (a: { name: string }) => unknown;
        };
        return [r0.set({ name: 'g' }), r0.saveRecordAs({ name: 'guild' })];
      }) as unknown[]),
      ...(dm.quests.add(1, (rows: unknown) => {
        const r0 = (rows as readonly Record<PropertyKey, unknown>[])[0] as unknown as {
          set: (v: Record<PropertyKey, unknown>) => unknown;
        };
        return [
          r0.set({ userRequest: fromSavedRefTransformer({ name: 'guild' as never, field: 'urlSlug' as never }) }),
        ];
      }) as unknown[]),
    ];
    await runPlan({ ops, ingredients: [guild, quest], label: 'D18c — fromSaved("guild", "urlSlug") — guild record never declares urlSlug' });
  }
})();
