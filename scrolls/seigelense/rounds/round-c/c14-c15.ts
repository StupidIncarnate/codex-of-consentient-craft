// C14 — `under()` and `defaults(index)` writing the SAME field: `collection-chain-transformer.ts`
// spreads `{...(underValues ?? {}), ...(ingredientConfig.defaults?.(index) ?? {})}` — defaults is
// spread SECOND, so it should silently overwrite the caller-supplied `under()` value.
// C15 — `under()` and an ANCESTOR LINK writing the SAME field: `g[0].sessions.under({guildId:
// someOtherGuildId})`. `hydration-collection-contract.ts`'s `Collection.under` type carries no
// restriction tied to `Anc` being empty, so this should TYPE-CHECK on a child accessor too (no
// type-level refusal). `link-values-transformer.ts` skips a link entirely once its `as` key is
// already `in ownFields` — and `under()`'s values land in `ownFields` (the create op's `fields`) —
// so the explicit `under()` value should outrank the real ancestor's id.
import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();
const ROW_COUNT = 2;

const session = ingredientDeclareBroker({
  name: 'session',
  description: 'a session whose defaults ALSO set guildId, independent of under()',
  fields: looseSchema,
  record: looseSchema,
  defaults: (index: number) => ({ guildId: `seeded-${index}` }),
  routes: { write: async ({ fields }: { fields: Record<PropertyKey, unknown> }) => ({ id: 's-1', guildId: fields.guildId }) },
  copies: 'x',
} as never);

const dmC14 = registryCreateBroker({ sessions: session as never });
const opsC14 = dmC14.sessions.under({ guildId: 'caller-supplied-id' }).add(ROW_COUNT, () => []) as unknown;
const createOpsC14 = [opsC14].flat(Infinity as never).filter((op: unknown) => (op as Record<PropertyKey, unknown>).op === 'create');
console.log('C14 create ops (under + defaults BOTH set guildId):', JSON.stringify(createOpsC14));

// ---------- C15 ----------
const sessionNoDefaults = ingredientDeclareBroker({
  name: 'session2',
  description: 'a session with NO defaults, links to a real ancestor guild AND takes under()',
  fields: looseSchema,
  record: looseSchema,
  links: [{ of: 'guild2', as: 'guildId' }],
  routes: { write: async ({ fields }: { fields: Record<PropertyKey, unknown> }) => ({ id: 's-1', guildId: fields.guildId }) },
  copies: 'x',
} as never);
const guild = ingredientDeclareBroker({
  name: 'guild2',
  description: 'a real guild, distinct from the id under() will supply',
  fields: looseSchema,
  record: looseSchema,
  routes: { write: async () => ({ id: 'g-REAL' }) },
  copies: 'x',
} as never);

const dmC15 = registryCreateBroker({ guilds: guild as never, sessions: sessionNoDefaults as never });
const opsC15 = dmC15.guilds.add(1, (g: never) => {
  const g0 = (g as unknown as Record<PropertyKey, unknown>[])[0] as unknown as {
    sessions: { under: (ids: Record<PropertyKey, unknown>) => { add: (n: number, b: () => unknown[]) => unknown } };
  };
  return [g0.sessions.under({ guildId: 'g-FROM-UNDER' }).add(1, () => [])];
}) as unknown[];

(async () => {
  const home = mkdtempSync(join(tmpdir(), 'dm-c15-'));
  const flatOps = opsC15.flat(Infinity as never);
  const result = await planRunBroker({
    plan: { recipeName: 'c15-scratch', ops: flatOps } as never,
    target: { home } as never,
    ingredients: [guild, sessionNoDefaults] as never,
  });
  console.log('C15 g[0].sessions.under({guildId}) TYPE-CHECKED and RAN. run result:', JSON.stringify(result));
  const createOpsC15 = flatOps.filter((op: unknown) => (op as Record<PropertyKey, unknown>).op === 'create' && (op as Record<PropertyKey, unknown>).ingredient === 'session2');
  console.log('C15 the session2 create op (fields.guildId = under()\'s value, before the runner even resolves the ancestor):', JSON.stringify(createOpsC15));
  rmSync(home, { recursive: true, force: true });
})();
