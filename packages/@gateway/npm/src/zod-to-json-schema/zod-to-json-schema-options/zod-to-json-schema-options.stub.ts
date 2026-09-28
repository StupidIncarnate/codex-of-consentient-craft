/**
 * PURPOSE: A real options object accepted by `zodToJsonSchema()`, built through the package's own
 * exported `Options` shape rather than a hand-typed literal — this gateway subpath's one required
 * stub (`@dungeonmaster/gateway-colocation`). Not a schema CONVERSION stub: the package's own
 * README, as of the zod v4 upgrade, says it only converts a v3-built schema ("so long as you
 * still provide v3-schemas") — fed a real v4 schema it silently returns an empty shell rather
 * than throwing, so nothing here demonstrates a "real conversion" the way `#gateway/npm/zod`'s
 * own `JsonSchemaResultStub` does with zod's native `toJSONSchema()`.
 *
 * USAGE:
 * const options = ZodToJsonSchemaOptionsStub();
 * // Returns { $refStrategy: 'none' }, a real Options value the package's own types accept
 */
import type { Options } from 'zod-to-json-schema';

export const ZodToJsonSchemaOptionsStub = (): Partial<Options> => ({ $refStrategy: 'none' });
