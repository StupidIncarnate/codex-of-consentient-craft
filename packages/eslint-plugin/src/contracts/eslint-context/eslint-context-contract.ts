import { z } from 'zod';

// This type is for Rule.RuleContext in eslint

// Contract defines only data properties (functions cause Zod type inference issues)
export const eslintContextContract = z.object({
  filename: z.string().brand<'Filename'>().optional(),
});

// Extract the branded Filename type from contract
type Filename = NonNullable<z.infer<typeof eslintContextContract>['filename']>;

// TypeScript type: data from contract + function methods via intersection
export type EslintContext = z.infer<typeof eslintContextContract> & {
  report: (...args: unknown[]) => unknown;
  getFilename?: () => Filename;
  getScope?: () => unknown;
  getSourceCode?: () => unknown;
  sourceCode?: {
    getAncestors: (node: unknown) => unknown[];
  };
};
