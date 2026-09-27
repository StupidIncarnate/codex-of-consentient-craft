/**
 * PURPOSE: A real, branded Zod schema, built through the real `z.string()` — chained through
 * `.brand()` because this repo's own `ban-primitives` rule refuses an un-branded `z.string()`
 * anywhere, stubs included.
 *
 * USAGE:
 * const schema = ZodStringSchemaStub();
 * schema.parse('gateway-stub'); // real, branded GatewayStubValue
 */
import { z } from 'zod';

export const ZodStringSchemaStub = (): z.ZodType<string> => z.string().brand<'GatewayStubValue'>();
