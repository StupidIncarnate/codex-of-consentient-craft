import type { Rule } from '../../../adapters/eslint/eslint-rule-adapter';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';

export const banContractInTestsRuleBroker = (): Rule.RuleModule => ({
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
  create: (context: Rule.RuleContext) => ({
    ImportDeclaration: (node): void => {
      // Only check test files
      const isTestFile = isTestFileGuard({ filename: context.filename });

      if (!isTestFile) {
        return;
      }

      // Extract import source
      interface NodeWithSource {
        source?: { value?: unknown };
      }
      const nodeWithSource: NodeWithSource = node;
      const importSource = nodeWithSource.source?.value;

      if (typeof importSource !== 'string') {
        return;
      }

      // Check for @questmaestro/shared/contracts imports
      // Allow stub imports (files ending with "Stub"), block contract imports
      if (importSource.startsWith('@questmaestro/shared/contracts')) {
        // Check if this is importing a stub by looking at the import specifiers
        interface ImportSpecifier {
          imported?: {
            name?: string;
          };
        }

        interface NodeWithSpecifiers {
          specifiers?: unknown[];
        }

        const nodeWithSpecifiers = node as unknown as NodeWithSpecifiers;
        const specifiers = nodeWithSpecifiers.specifiers ?? [];

        // Check if all imports are stubs (end with "Stub")
        const allImportsAreStubs = specifiers.every((spec) => {
          const importSpec = spec as ImportSpecifier;
          const importedName = importSpec.imported?.name ?? '';
          return importedName.endsWith('Stub');
        });

        if (!allImportsAreStubs) {
          context.report({
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
      const isContractImport = importSource.includes('-contract');

      if (!isContractImport) {
        return;
      }

      // Generate suggested stub path
      const stubPath = importSource.replace(/-contract(\.ts)?$/u, '.stub');

      context.report({
        node,
        messageId: 'useStubInTest',
        data: {
          stubPath,
        },
      });
    },
  }),
});
