/**
 * ESLint Rule Context contract
 * Replicates Rule.RuleContext from @types/eslint
 *
 * Contract defines ONLY data properties (functions cause Zod type inference issues).
 * Function methods are added via intersection in the EslintContext type below.
 *
 * PURPOSE: Validates ESLint rule context data properties (filename, etc.)
 *
 * USAGE:
 * const contextData = eslintContextContract.parse({ filename: '/path/to/file.ts' });
 * // Returns validated context data; use EslintContext type for full context with methods
 */
import { z } from 'zod';
import type { Identifier } from '@questmaestro/shared/contracts';
import type { Tsestree } from '../tsestree/tsestree-contract';

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
 * ESLint Comment - returned by getAllComments()
 * Replicates Comment interface from @types/eslint
 */
export interface EslintComment {
  type?: unknown;
  value?: unknown;
  range?: unknown;
  loc?: unknown;
}

/**
 * ESLint Rule Fixer - provides methods to apply fixes
 * Replicates RuleFixer interface from @types/eslint
 */
export interface EslintRuleFixer {
  insertTextAfter: (node: unknown, text: unknown) => unknown;
  insertTextBefore: (node: unknown, text: unknown) => unknown;
  insertTextAfterRange: (range: unknown, text: unknown) => unknown;
  insertTextBeforeRange: (range: unknown, text: unknown) => unknown;
  remove: (node: unknown) => unknown;
  removeRange: (range: unknown) => unknown;
  replaceText: (node: unknown, text: unknown) => unknown;
  replaceTextRange: (range: unknown, text: unknown) => unknown;
}

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
  getAllComments: () => EslintComment[];
  getText: (node?: Tsestree | EslintComment) => unknown;
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
    messageId?: unknown;
    message?: unknown;
    data?: Record<PropertyKey, unknown>;
    fix?: (fixer: EslintRuleFixer) => unknown;
  }) => void;

  getFilename?: () => Filename;
  getScope?: () => EslintScope;
  getSourceCode?: () => EslintSourceCode;
  sourceCode?: EslintSourceCode;
};
