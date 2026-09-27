/**
 * PURPOSE: A real JSON Schema, built by actually calling zod's own native `toJSONSchema()`
 * against a real Zod schema (`.brand()`ed, per this repo's own `ban-primitives` rule) — never a
 * hand-typed JSON Schema object standing in for what the real conversion would produce. Lives
 * under `#gateway/npm/zod`, not `#gateway/npm/zod-to-json-schema`: that third-party package only
 * converts a v3-built schema (its own README, as of the v4 upgrade — "so long as you still
 * provide v3-schemas"), and fed a real v4 schema it silently returns an empty shell instead of
 * throwing, which is why zod v4 ships this conversion natively.
 *
 * USAGE:
 * const schema = JsonSchemaResultStub();
 * // Returns the real JSON Schema toJSONSchema() produces for { name: z.string() }
 */
import { z } from 'zod';

// `ReturnType<typeof z.toJSONSchema>` resolves to the LAST overload of that function (the
// registry form, `{ schemas: Record<string, ...> }>`) rather than the single-schema form this
// actually calls, so the return type is spelled out via the shared shape both overloads extend.
export const JsonSchemaResultStub = (): z.core.JSONSchema.BaseSchema =>
  z.toJSONSchema(z.object({ name: z.string().brand<'GatewayStubName'>() }));
