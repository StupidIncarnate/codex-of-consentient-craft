import { z } from 'zod';
import type { Identifier } from '@questmaestro/shared/contracts';
import type { Tsestree } from '../tsestree/tsestree-contract';

/**
 * ESLint Rule Context contract
 * Replicates Rule.RuleContext from @types/eslint
 *
 * Contract defines ONLY data properties (functions cause Zod type inference issues).
 * Function methods are added via intersection in the EslintContext type below.
 */
export const eslintContextContract = z.object({
  filename: z.string().brand<'Filename'>().optional(),
});

// Extract the branded Filename type from contract
type Filename = NonNullable<z.infer<typeof eslintContextContract>['filename']>;

/**
 * ESLint Scope - returned by ctx.getScope()
 * Replicates Scope.Scope from @types/eslint
 */
const _scopeDataContract = z.object({
  type: z.custom<Identifier>(),
  variables: z.array(z.unknown()),
});
export type EslintScope = z.infer<typeof _scopeDataContract>;

/**
 * ESLint SourceCode - returned by ctx.getSourceCode() and available as ctx.sourceCode
 * Replicates SourceCode class from @types/eslint
 * Function methods added via intersection
 */
const _sourceCodeDataContract = z.object({
  text: z.string().brand<'SourceText'>(),
  ast: z.unknown(),
});
export type EslintSourceCode = z.infer<typeof _sourceCodeDataContract> & {
  getAncestors: (node: Tsestree) => Tsestree[];
};

/**
 * Complete ESLint Context type with data + function methods
 * Based on Rule.RuleContext from @types/eslint
 *
 * Data properties validated through contract, function methods added via intersection.
 */
export type EslintContext = z.infer<typeof eslintContextContract> & {
  report: (descriptor: {
    node?: Tsestree;
    messageId?: string;
    message?: string;
    data?: Record<string, unknown>;
  }) => void;

  getFilename?: () => Filename;
  getScope?: () => EslintScope;
  getSourceCode?: () => EslintSourceCode;
  sourceCode?: EslintSourceCode;
};
