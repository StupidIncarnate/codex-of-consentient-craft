/**
 * PURPOSE: Enforces proper contract usage in test files
 *
 * USAGE:
 * const rule = ruleEnforceContractUsageInTestsBroker();
 * // Contract test files must import both contract and stub. Other test files cannot import contracts.
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { contractPathToStubPathTransformer } from '../../../transformers/contract-path-to-stub-path/contract-path-to-stub-path-transformer';

export const ruleEnforceContractUsageInTestsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Enforces contract test files import both contract and stub; bans contract imports in other test files',
      },
      messages: {
        useStubInTest:
          'Test files must not import from contracts (including types). Use {{stubPath}} instead.',
        useStubFromShared:
          'Test files must not import contracts from @questmaestro/shared/contracts. Import stubs (ending in "Stub") from @questmaestro/shared/contracts instead.',
        contractTestMissingStub:
          'Contract test files must import the stub. Add: import { XxxStub } from "{{stubPath}}";',
        contractTestMissingContract:
          'Contract test files must import the contract. Add: import { xxxContract } from "{{contractPath}}";',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;

    // Track imports for contract test files
    const imports = {
      hasContractImport: false,
      hasStubImport: false,
      contractImportNode: null as Tsestree | null,
      stubImportNode: null as Tsestree | null,
    };

    // Check if this is a contract test file
    const filename = ctx.filename ?? '';
    const isContractTestFile = filename.endsWith('-contract.test.ts');

    return {
      ImportDeclaration: (node: Tsestree): void => {
        // Only check test files
        const isTestFile = isTestFileGuard({ filename });

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

        // Check if importing a .stub file
        const isStubImport =
          importFilename.endsWith('.stub.ts') || importFilename.endsWith('.stub');

        // Track imports for contract test files
        if (isContractTestFile) {
          if (isContractImport) {
            imports.hasContractImport = true;
            imports.contractImportNode = node;
          }
          if (isStubImport) {
            imports.hasStubImport = true;
            imports.stubImportNode = node;
          }
          // Don't report yet - wait for Program:exit
          return;
        }

        // For non-contract test files, ban contract imports
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
      'Program:exit': (): void => {
        // Only check contract test files
        if (!isContractTestFile) {
          return;
        }

        // Check if both imports are present
        if (imports.hasContractImport && !imports.hasStubImport) {
          // Has contract but missing stub
          const basename = filename.split('/').pop() ?? '';
          const stubPath = `./${basename.replace('-contract.test.ts', '.stub')}`;
          ctx.report({
            node: imports.contractImportNode ?? ({} as Tsestree),
            messageId: 'contractTestMissingStub',
            data: {
              stubPath,
            },
          });
        } else if (!imports.hasContractImport && imports.hasStubImport) {
          // Has stub but missing contract
          const basename = filename.split('/').pop() ?? '';
          const contractPath = `./${basename.replace('.test.ts', '')}`;
          ctx.report({
            node: imports.stubImportNode ?? ({} as Tsestree),
            messageId: 'contractTestMissingContract',
            data: {
              contractPath,
            },
          });
        } else if (!imports.hasContractImport && !imports.hasStubImport) {
          // Missing both - report missing contract (primary requirement)
          const basename = filename.split('/').pop() ?? '';
          const contractPath = `./${basename.replace('.test.ts', '')}`;
          ctx.report({
            node: {} as Tsestree,
            messageId: 'contractTestMissingContract',
            data: {
              contractPath,
            },
          });
        }
      },
    };
  },
});
