/**
 * PURPOSE: Validates dungeonmaster configuration structure for projects
 *
 * USAGE:
 * import {dungeonmasterConfigContract} from './dungeonmaster-config-contract';
 * const config = dungeonmasterConfigContract.parse({framework: 'react', schema: 'zod'});
 * // Returns validated DungeonmasterConfig type
 */

import { z } from 'zod';
import { frameworkStatics } from '../../statics/framework/framework-statics';
import { routingLibraryStatics } from '../../statics/routing-library/routing-library-statics';
import { schemaLibraryStatics } from '../../statics/schema-library/schema-library-statics';

export const dungeonmasterConfigContract = z.object({
  framework: z.enum(frameworkStatics.frameworks.all),
  routing: z.enum(routingLibraryStatics.libraries.all).optional(),
  schema: z.union([
    z.enum(schemaLibraryStatics.libraries.all),
    z.array(z.enum(schemaLibraryStatics.libraries.all)),
  ]),
  architecture: z
    .object({
      overrides: z
        .record(
          z.string().brand<'FolderName'>(),
          z.object({ add: z.array(z.string().brand<'PackageName'>()).optional() }),
        )
        .optional(),
      allowedRootFiles: z.array(z.string().brand<'FileName'>()).optional(),
      booleanFunctionPrefixes: z.array(z.string().brand<'FunctionPrefix'>()).optional(),
    })
    .optional(),
});

export type DungeonmasterConfig = z.infer<typeof dungeonmasterConfigContract>;
