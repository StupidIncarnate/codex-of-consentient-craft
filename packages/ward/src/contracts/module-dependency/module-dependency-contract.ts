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

import { z } from 'zod';
import { moduleSpecifierContract } from '../module-specifier/module-specifier-contract';
import { importedNameContract } from '../imported-name/imported-name-contract';

export const moduleDependencyContract = z.object({
  specifier: moduleSpecifierContract,
  kind: z.enum(['named', 'star', 'opaque']),
  importedNames: z.array(importedNameContract),
});

export type ModuleDependency = z.infer<typeof moduleDependencyContract>;
