import { z } from 'zod';
import { ALL_FRAMEWORKS } from '../framework/framework-contract';
import { ALL_ROUTING_LIBRARIES } from '../routing-library/routing-library-contract';
import { ALL_SCHEMA_LIBRARIES } from '../schema-library/schema-library-contract';

export const DEFAULT_ALLOWED_ROOT_FILES = ['global.d.ts'];
export const DEFAULT_BOOLEAN_FUNCTION_PREFIXES = ['is', 'has', 'can', 'should', 'will', 'was'];

export const questmaestroConfigContract = z.object({
  framework: z.enum(ALL_FRAMEWORKS),
  routing: z.enum(ALL_ROUTING_LIBRARIES).optional(),
  schema: z.union([z.enum(ALL_SCHEMA_LIBRARIES), z.array(z.enum(ALL_SCHEMA_LIBRARIES))]),
  architecture: z
    .object({
      overrides: z.record(z.string(), z.object({ add: z.array(z.string()).optional() })).optional(),
      allowedRootFiles: z.array(z.string()).optional(),
      booleanFunctionPrefixes: z.array(z.string()).optional(),
    })
    .optional(),
});

export type QuestmaestroConfig = z.infer<typeof questmaestroConfigContract>;
