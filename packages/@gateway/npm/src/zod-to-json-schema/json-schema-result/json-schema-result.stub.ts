/**
 * PURPOSE: A real JSON Schema, built by actually calling `zodToJsonSchema()` against a real Zod
 * schema (`.brand()`ed, per this repo's own `ban-primitives` rule) — never a hand-typed JSON
 * Schema object standing in for what the real conversion would produce. Branding is a
 * TypeScript-only marker with no runtime effect, confirmed against the installed
 * `zod-to-json-schema` build: the produced schema is identical branded or not.
 *
 * USAGE:
 * const schema = JsonSchemaResultStub();
 * // Returns the real JSON Schema zodToJsonSchema() produces for { name: z.string() }
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const JsonSchemaResultStub = (): ReturnType<typeof zodToJsonSchema> =>
  zodToJsonSchema(z.object({ name: z.string().brand<'GatewayStubName'>() }));
