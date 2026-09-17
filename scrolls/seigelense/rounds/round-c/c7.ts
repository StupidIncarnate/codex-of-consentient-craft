// C7 — two ingredients whose `links` name the SAME parent (both `quest`), under one `add`:
// q[0].operations.add(1,...), q[0].notes.add(1,...). Three readings: (1) do both children resolve
// the SAME link value off the SAME quest record, (2) do they run in declaration order, (3) if the
// quest's OWN record in `state.records` is mutated (via a transition `set`, which never folds into
// the create and writes back to the row's REAL build-time ref) between the two children's creates,
// does the LATER child see the mutated value?
import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();
const callOrder: unknown[] = [];
let questSeq = 0;
let opSeq = 0;
let noteSeq = 0;

const quest = ingredientDeclareBroker({
  name: 'quest',
  description: 'a quest row with a transition field; reach mutates the id, visibly',
  fields: looseSchema,
  record: looseSchema,
  transitions: {
    field: 'status',
    to: ['created', 'escalated'],
    reach: ({ to, record }: { to: unknown; record: Record<PropertyKey, unknown> }) => ({ id: 'q-MUTATED', status: to, original: record.id }),
  },
  routes: {
    write: async () => {
      questSeq += 1;
      return { id: `q-${questSeq}`, status: 'created' };
    },
  },
  copies: 'x',
} as never);

const operation = ingredientDeclareBroker({
  name: 'operation',
  description: 'links to quest, same parent as notes; runs BEFORE the mutation',
  fields: looseSchema,
  record: looseSchema,
  links: [{ of: 'quest', as: 'questId' }],
  routes: {
    write: async ({ fields }: { fields: Record<PropertyKey, unknown> }) => {
      opSeq += 1;
      callOrder.push({ ingredient: 'operation', questId: fields.questId });
      return { id: `op-${opSeq}`, questId: fields.questId };
    },
  },
  copies: 'x',
} as never);

const note = ingredientDeclareBroker({
  name: 'note',
  description: 'links to quest, same parent as operations; runs AFTER the mutation',
  fields: looseSchema,
  record: looseSchema,
  links: [{ of: 'quest', as: 'questId' }],
  routes: {
    write: async ({ fields }: { fields: Record<PropertyKey, unknown> }) => {
      noteSeq += 1;
      callOrder.push({ ingredient: 'note', questId: fields.questId });
      return { id: `note-${noteSeq}`, questId: fields.questId };
    },
  },
  copies: 'x',
} as never);

const dm = registryCreateBroker({ quests: quest as never, operations: operation as never, notes: note as never });

const ops = dm.quests.add(1, (q: never) => {
  const q0 = (q as unknown as Record<PropertyKey, unknown>[])[0] as unknown as {
    set: (v: Record<PropertyKey, unknown>) => unknown;
    operations: { add: (n: number, b: () => unknown[]) => unknown };
    notes: { add: (n: number, b: () => unknown[]) => unknown };
  };
  return [
    q0.operations.add(1, () => []),
    q0.set({ status: 'escalated' }),
    q0.notes.add(1, () => []),
  ];
}) as unknown[];

(async () => {
  const home = mkdtempSync(join(tmpdir(), 'dm-c7-'));
  const flatOps = ops.flat(Infinity as never);
  await planRunBroker({
    plan: { recipeName: 'c7-scratch', ops: flatOps } as never,
    target: { home } as never,
    ingredients: [quest, operation, note] as never,
  });
  console.log('call order + resolved questId per child (note runs AFTER the transition mutated the quest\'s own record):', JSON.stringify(callOrder));
  rmSync(home, { recursive: true, force: true });
})();
