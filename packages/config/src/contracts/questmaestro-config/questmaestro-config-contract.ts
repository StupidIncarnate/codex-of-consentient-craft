import type { Framework } from '../framework/framework-contract';
import type { SchemaLibrary } from '../schema-library/schema-library-contract';
import type { RoutingLibrary } from '../routing-library/routing-library-contract';

export interface QuestmaestroConfig {
  framework: Framework; // Required: Sets the preset
  routing?: RoutingLibrary; // Required for apps, not for libraries
  schema: SchemaLibrary | SchemaLibrary[]; // Required: Validation library/libraries

  architecture?: {
    overrides?: Record<
      string,
      {
        add?: string[]; // Add packages to the preset
      }
    >;
    allowedRootFiles?: string[]; // Files allowed in src/ root
    booleanFunctionPrefixes?: string[]; // Prefixes for boolean functions
  };
}

export const DEFAULT_ALLOWED_ROOT_FILES = ['global.d.ts'];

export const DEFAULT_BOOLEAN_FUNCTION_PREFIXES = ['is', 'has', 'can', 'should', 'will', 'was'];
