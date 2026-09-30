/**
 * PURPOSE: One import or re-export edge a source file carries to another module. `kind` is what
 * the platform-crossing walk narrows on: a `named` edge lists exactly which bindings it wants, a
 * `star` edge (`export * from 'x'`) re-exports everything `x` has, and `opaque` covers a default
 * import, a namespace import, and a side-effect-only import — none of which name what they use, so
 * the walk must treat the whole target module as reached.
 *
 * USAGE:
 * moduleDependencyContract.parse({specifier: '@dungeonmaster/node/fs', kind: 'named', importedNames: ['readFileIfExists']});
 * // Returns: ModuleDependency
 */

import { z } from '#gateway/npm/zod';

export const moduleDependencyContract = z.object({
  specifier: z.string().min(1).brand<'ModuleDependencySpecifier'>(),
  kind: z.enum(['named', 'star', 'opaque']),
  importedNames: z.array(z.string().min(1).brand<'ModuleDependencyImportedNames'>()),
});

export type ModuleDependency = z.infer<typeof moduleDependencyContract>;
