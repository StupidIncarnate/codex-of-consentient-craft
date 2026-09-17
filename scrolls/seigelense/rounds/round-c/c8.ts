// C8 — `under()` with an id that does not exist: dm.sessions.under({guildId: 'dead-id'}).add(1,...).
// The plan predicts: `under()`'s values are folded into the CREATE op's fields at build time
// (collection-chain-transformer.ts), so pre-flight sees a satisfied link and has nothing to check —
// the id's validity is the TARGET's business. This scratch `write` route stands in for a file
// target that mkdirs a path segment named after the (possibly nonexistent) guildId, mirroring the
// D6 sad-path row ("the parent directory does not exist — create it").
import { registryCreateBroker, planRunBroker } from '@dungeonmaster/hydration/brokers';
import { ingredientDeclareBroker } from '../../packages/hydration/src/brokers/ingredient/declare/ingredient-declare-broker';
import { z } from 'zod';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const looseSchema = z.object({}).passthrough();

const session = ingredientDeclareBroker({
  name: 'session',
  description: 'a session, write route creates the guild directory if absent (file-target style)',
  fields: looseSchema,
  record: looseSchema,
  links: [{ of: 'guild', as: 'guildId' }],
  routes: {
    write: async ({ target, fields }: { target: { home: string }; fields: Record<PropertyKey, unknown> }) => {
      const guildDir = join(target.home, String(fields.guildId));
      const existedBefore = existsSync(guildDir);
      mkdirSync(guildDir, { recursive: true });
      writeFileSync(join(guildDir, 'session.json'), JSON.stringify({ guildId: fields.guildId }));
      return { id: 's-1', guildId: fields.guildId, guildDirExistedBefore: existedBefore };
    },
  },
  copies: 'x',
} as never);

const guild = ingredientDeclareBroker({
  name: 'guild',
  description: 'a guild — not part of THIS plan at all',
  fields: looseSchema,
  record: looseSchema,
  routes: { write: async () => ({ id: 'g-real' }) },
  copies: 'x',
} as never);

const dm = registryCreateBroker({ guilds: guild as never, sessions: session as never });

const ops = dm.sessions.under({ guildId: 'guild-that-was-never-created' }).add(1, () => []) as unknown;

(async () => {
  const home = mkdtempSync(join(tmpdir(), 'dm-c8-'));
  const flatOps = [ops].flat(Infinity as never);
  const result = await planRunBroker({
    plan: { recipeName: 'c8-scratch', ops: flatOps } as never,
    target: { home } as never,
    ingredients: [guild, session] as never,
  });
  console.log('run result:', JSON.stringify(result));
  console.log('guild dir now exists on disk:', existsSync(join(home, 'guild-that-was-never-created')));
  rmSync(home, { recursive: true, force: true });
})();
