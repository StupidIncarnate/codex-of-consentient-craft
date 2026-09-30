/**
 * PURPOSE: Validates one import/export-from edge discovered walking a proxy or barrel file's AST.
 * `kind: 'import'` is the file's own internal dependency (a child proxy it composes) and is always
 * followed in full. `kind: 'reexport'` is part of the file's OWN re-export surface (an `export ... from`
 * declaration) and is followed only for the names its own importer actually asked for — that pruning is
 * what stops a barrel's fan-out from dragging in every proxy it re-exports. `names: null` means the edge
 * names nothing explicit (`export * from './x'`, `import * as ns from './x'`) and must be treated as
 * "everything this module exports".
 *
 * USAGE:
 * proxyImportEdgeContract.parse({kind: 'reexport', importPath: './x.proxy', names: ['xProxy']});
 * // Returns a validated ProxyImportEdge
 */

import { z } from '#gateway/npm/zod';

export const proxyImportEdgeContract = z.object({
  kind: z.enum(['import', 'reexport']),
  importPath: z.string().brand<'ProxyImportEdgeImportPath'>(),
  names: z.array(z.string().min(1).brand<'ProxyImportEdgeNames'>()).nullable(),
});

export type ProxyImportEdge = z.infer<typeof proxyImportEdgeContract>;
