import { z } from 'zod';

/**
 * TSESTree contract - translates @typescript-eslint/utils types to branded Zod schemas.
 * Contract defines ONLY data properties (no functions).
 * Type intersection adds parent and dynamic properties.
 */

export const tsestreeContract = z.object({
  type: z.string().min(1).brand<'AstNodeType'>(),
});

// Type intersection adds parent and dynamic properties
export type Tsestree = z.infer<typeof tsestreeContract> & {
  parent?: Tsestree | null;
};
