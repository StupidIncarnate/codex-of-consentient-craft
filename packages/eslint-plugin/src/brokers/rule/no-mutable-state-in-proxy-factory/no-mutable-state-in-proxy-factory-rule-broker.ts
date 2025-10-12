import type { Rule } from '../../../adapters/eslint/eslint-rule-adapter';
import type { TSESTree } from '@typescript-eslint/utils';

interface NodeWithDeclarations {
  declarations?: TSESTree.Node[];
}

interface NodeWithKind {
  kind?: 'const' | 'let' | 'var';
}

export const noMutableStateInProxyFactoryRuleBroker = (): Rule.RuleModule => ({
  meta: {
    type: 'problem',
    docs: {
      description: 'Forbid mutable state (let/var) anywhere in proxy files',
    },
    messages: {
      noMutableState:
        'Proxy files cannot contain mutable state (let/var). Use const for all variables.',
    },
    schema: [],
    hasSuggestions: true,
  },
  create: (context: Rule.RuleContext) => {
    const { filename } = context;

    // Only check .proxy.ts files
    if (!filename.endsWith('.proxy.ts')) {
      return {};
    }

    return {
      // Check for let/var declarations anywhere in the file
      VariableDeclaration: (node): void => {
        const varDecl = node as unknown as NodeWithDeclarations & NodeWithKind;
        const { kind, declarations } = varDecl;

        // Only check let and var (const is fine)
        if (kind !== 'let' && kind !== 'var') return;

        if (!declarations || declarations.length === 0) return;

        // Report ALL let/var declarations - no exceptions
        for (const declaration of declarations) {
          context.report({
            node: declaration,
            messageId: 'noMutableState',
            suggest: [
              {
                desc: 'Change to const declaration.',
                fix: (): null => null, // No auto-fix, manual refactor needed
              },
            ],
          });
        }
      },
    };
  },
});
