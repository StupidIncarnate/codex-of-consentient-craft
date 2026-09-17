// C18 — a verb on a handle whose row a previous op removed: q[1].remove(), q[1].set(...),
// q[1].saveRecordAs({name:'ghost'}). Nothing in the chain or the pre-flight tracks which refs a
// `remove` retired (confirmed by reading plan-preflight-broker.ts directly — none of its five
// checks mention remove at all).
//
// Two sub-cases, because `planFoldWritesTransformer` treats them completely differently:
// (A) a TRANSITION set (`set({status})`) never folds into the create — it always reaches
//     opSetApplyLayerBroker as its own op, so it runs AFTER the remove exactly as declared, with
//     `state.records.get(ref)` already deleted.
// (B) a PLAIN-FIELD set (`set({title})`, no transitions) folds into the CREATE op whenever its ref
//     matches one and every SavedRef it carries is available — regardless of a `remove()` declared
//     between the create and the set — so the declared "remove, then set" ordering never reaches
//     the runner as two ops at all for a plain field.
import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();
const ROW_COUNT = 2;
const SECOND_ROW_INDEX = 1;

// ---------- (A) transition set after remove ----------
(async () => {
  const questStore: Record<PropertyKey, unknown>[] = [];
  const reachCalls: unknown[] = [];
  let seq = 0;

  const quest = ingredientDeclareBroker({
    name: 'quest',
    description: 'a quest with a transition field; reach records every {from,to,record} it sees',
    fields: looseSchema,
    record: looseSchema,
    transitions: {
      field: 'status',
      to: ['created', 'after-the-fact'],
      reach: ({ from, to, record }: { from: unknown; to: unknown; record: Record<PropertyKey, unknown> }) => {
        reachCalls.push({ from, to, record });
        return { ...record, status: to };
      },
    },
    routes: {
      write: async () => {
        seq += 1;
        const row = { id: `q-${seq}` };
        questStore.push(row);
        return row;
      },
      remove: async ({ record }: { record: Record<PropertyKey, unknown> }) => {
        const index = questStore.findIndex((row) => row.id === record.id);
        if (index >= 0) {
          questStore.splice(index, 1);
        }
        return undefined;
      },
    },
    copies: 'x',
  } as never);

  const dm = registryCreateBroker({ quests: quest as never });
  const ops = dm.quests.add(ROW_COUNT, (rows: unknown) => {
    const r = rows as unknown as {
      remove: () => unknown;
      set: (v: Record<PropertyKey, unknown>) => unknown;
      saveRecordAs: (a: { name: string }) => unknown;
    }[];
    return [
      r[SECOND_ROW_INDEX].remove(),
      r[SECOND_ROW_INDEX].set({ status: 'after-the-fact' }),
      r[SECOND_ROW_INDEX].saveRecordAs({ name: 'ghost' }),
    ];
  }).flat(Infinity as never);

  const home = mkdtempSync(join(tmpdir(), 'dm-c18a-'));
  const result = await planRunBroker({
    plan: { recipeName: 'c18a-scratch', ops } as never,
    target: { home } as never,
    ingredients: [quest] as never,
  });
  console.log('(A) transition-set after remove — NO THROW. run result (saved.ghost):', JSON.stringify(result));
  console.log('(A) reach calls (from/record after the row was removed):', JSON.stringify(reachCalls));
  console.log('(A) questStore AFTER run:', JSON.stringify(questStore));
  rmSync(home, { recursive: true, force: true });
})();

// ---------- (B) plain-field set after remove — does the fold preempt the ordering? ----------
(async () => {
  const questStore: Record<PropertyKey, unknown>[] = [];
  let seq = 0;

  const quest = ingredientDeclareBroker({
    name: 'quest',
    description: 'a quest with no transitions; plain field set only',
    fields: looseSchema,
    record: looseSchema,
    routes: {
      write: async ({ fields }: { fields: Record<PropertyKey, unknown> }) => {
        seq += 1;
        const row = { id: `q-${seq}`, title: fields.title };
        questStore.push(row);
        return row;
      },
      remove: async ({ record }: { record: Record<PropertyKey, unknown> }) => {
        const index = questStore.findIndex((row) => row.id === record.id);
        if (index >= 0) {
          questStore.splice(index, 1);
        }
        return undefined;
      },
    },
    copies: 'x',
  } as never);

  const dm = registryCreateBroker({ quests: quest as never });
  const ops = dm.quests.add(ROW_COUNT, (rows: unknown) => {
    const r = rows as unknown as { remove: () => unknown; set: (v: Record<PropertyKey, unknown>) => unknown }[];
    return [r[SECOND_ROW_INDEX].remove(), r[SECOND_ROW_INDEX].set({ title: 'after the fact' })];
  }).flat(Infinity as never);

  console.log('(B) folded op tree (is the plain set still its own op, or merged into create?):', JSON.stringify(ops));

  const home = mkdtempSync(join(tmpdir(), 'dm-c18b-'));
  await planRunBroker({
    plan: { recipeName: 'c18b-scratch', ops } as never,
    target: { home } as never,
    ingredients: [quest] as never,
  });
  console.log('(B) questStore AFTER run:', JSON.stringify(questStore));
  rmSync(home, { recursive: true, force: true });
})();
