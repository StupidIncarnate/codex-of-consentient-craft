/**
 * PURPOSE: Says whose code an import reaches: `outside` (an npm package, a Node module), `gateway`
 * (a `#gateway/*` wrapper) or `repo` (a relative path or a workspace package). An adapter is a
 * pass-through only when its one call goes outside or to the gateway.
 *
 * USAGE:
 * importOriginContract.parse('gateway');
 * // Returns: ImportOrigin
 */
import { z } from 'zod';

export const importOriginContract = z.enum(['outside', 'gateway', 'repo']);

export type ImportOrigin = z.infer<typeof importOriginContract>;
