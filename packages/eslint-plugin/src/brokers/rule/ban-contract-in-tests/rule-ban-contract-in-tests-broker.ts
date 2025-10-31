/**
 * PURPOSE: Prevents test files from importing contracts directly and enforces using stub variants instead
 *
 * USAGE:
 * const rule = ruleBanContractInTestsBroker();
 * // Returns ESLint rule that requires test files to import .stub files instead of -contract files
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { contractPathToStubPathTransformer } from '../../../transformers/contract-path-to-stub-path/contract-path-to-stub-path-transformer';

export const ruleBanContractInTestsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban importing contracts in test files; use .stub variants instead (includes types)',
      },
      messages: {
        useStubInTest:
          'Test files must not import from contracts (including types). Use {{stubPath}} instead.',
        useStubFromShared:
          'Test files must not import contracts from @questmaestro/shared/contracts. Import stubs (ending in "Stub") from @questmaestro/shared/contracts instead.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    return {
      ImportDeclaration: (node: Tsestree): void => {
        // Only check test files
        const isTestFile = isTestFileGuard({ filename: ctx.filename ?? '' });

        if (!isTestFile) {
          return;
        }

        // Extract import source
        const importSource = node.source?.value;

        if (typeof importSource !== 'string') {
          return;
        }

        // Check for @questmaestro/shared/contracts imports
        // Allow stub imports (files ending with "Stub"), block contract imports
        if (importSource.startsWith('@questmaestro/shared/contracts')) {
          // Check if this is importing a stub by looking at the import specifiers
          const specifiers = node.specifiers ?? [];

          // Check if all imports are stubs (end with "Stub")
          const allImportsAreStubs = specifiers.every((spec) => {
            const importedName = spec.imported?.name ?? '';
            return importedName.endsWith('Stub');
          });

          if (!allImportsAreStubs) {
            ctx.report({
              node,
              messageId: 'useStubFromShared',
            });
          }
          return;
        }

        // Check for direct contract imports from @questmaestro/shared
        if (importSource === '@questmaestro/shared') {
          // Need to check if importing contract exports
          // This would require analyzing the import specifiers, which is complex
          // For now, we'll just check the path-based imports above
          return;
        }

        // Check if importing a -contract file (relative imports)
        // Only match if the filename itself ends with -contract, not just the path containing it
        // Extract just the filename from the import path
        const importPathParts = importSource.split('/');
        const importFilename = importPathParts[importPathParts.length - 1] ?? '';
        const isContractImport =
          importFilename.endsWith('-contract.ts') || importFilename.endsWith('-contract');

        if (!isContractImport) {
          return;
        }

        // Generate suggested stub path
        const stubPath = contractPathToStubPathTransformer({ contractPath: importSource });

        ctx.report({
          node,
          messageId: 'useStubInTest',
          data: {
            stubPath,
          },
        });
      },
    };
  },
});
