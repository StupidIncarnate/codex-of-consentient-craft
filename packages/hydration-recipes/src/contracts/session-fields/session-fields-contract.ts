/**
 * PURPOSE: What a caller may supply to make a session — the transcript's own id, the directory it
 * runs under, and the JSONL lines to write. Reach for this over its sibling, `sessionRecordContract`,
 * on a route's INPUT side: unlike a guild or a quest, nothing in this repo mints a session id — the
 * caller invents `sessionId` up front, exactly as a real Claude session's caller does — so `fields`
 * and `record` differ only in what the `write` route derives afterward (the encoded on-disk
 * `filePath` and the `lineCount` it just appended), never in who assigns the identity.
 *
 * USAGE:
 * sessionFieldsContract.parse({
 *   sessionId: 'seed-session-1',
 *   cwd: '/tmp/guilds-under-test/guild-1',
 *   lines: ['{"type":"user","message":{"role":"user","content":"hello"}}'],
 * });
 * // Returns SessionFields
 *
 * The export is upcast to `z.ZodType<SessionFields>` rather than left as the concrete
 * `ZodObject` — `@dungeonmaster/hydration`'s own `ingredient()` infers `TFields` at two
 * independent sites (`IngredientConfig['fields']` and `IngredientConfigInferenceAnchor['fields']`),
 * and re-checking one concrete `ZodObject` class against both sites' `deepPartial()` fails for
 * this shape even though the schema itself is valid — `IngredientConfigInferenceAnchor`'s own
 * comment names the upcast as the fix. The concrete object schema stays private; the export
 * carries its `.shape` alongside the upcast, so a caller reads one field's own contract as
 * `sessionFieldsContract.shape.<field>`.
 */
import { z } from '#gateway/npm/zod';

import { sessionContract } from '@dungeonmaster/shared/contracts';

const sessionFieldsShape = z
  .object({
    sessionId: sessionContract.shape.id,
    cwd: z
      .string()
      .min(1)
      .refine((path) => path.startsWith('/') || /^[A-Za-z]:\\/u.test(path), {
        message: 'Path must be absolute (start with / or C:\\ on Windows)',
      })
      .brand<'SessionFieldsShapeCwd'>(),
    lines: z.array(z.string().min(1).brand<'SessionFieldsShapeLines'>()),
  })
  .brand<'SessionFieldsShape'>();

export type SessionFields = z.infer<typeof sessionFieldsShape>;

export const sessionFieldsContract: z.ZodType<SessionFields, z.input<typeof sessionFieldsShape>> &
  Pick<typeof sessionFieldsShape, 'shape'> = Object.assign(
  sessionFieldsShape.transform((fields) => fields),
  { shape: sessionFieldsShape.shape },
);
