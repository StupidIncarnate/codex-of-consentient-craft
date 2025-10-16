import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';

interface NodeWithDeclarations {
  declarations?: Tsestree[];
}

interface NodeWithId {
  id?: Tsestree | null;
}

interface NodeWithName {
  name?: string;
}

interface NodeWithInit {
  init?: Tsestree | null;
}

interface NodeWithCallee {
  callee?: Tsestree;
}

interface ExportDeclarationNode {
  declaration?: Tsestree | null;
}

export const enforceTestCreationOfProxyRuleBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ensure proxies are created inside each test (it/test block), not at module level in test files',
      },
      messages: {
        proxyMustBeInTest:
          'Proxy instance {{name}} must be created inside each test (it/test block), not at module level. Use: const {{name}} = {{proxyFunction}}() inside the test.',
        noExportProxy:
          'Do not export proxy instances from test files. Create proxies fresh in each test instead.',
      },
      schema: [],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    const filename = ctx.filename ? String(ctx.filename) : '';

    // Only check test files
    if (!isTestFileGuard({ filename })) {
      return {};
    }

    // Track if we're inside a test block
    let testBlockDepth = 0;

    // Track exported proxy declarations to avoid duplicate errors
    const exportedProxyDeclarations = new Set<Tsestree>();

    return {
      // Track when we enter a test block (it/test calls)
      CallExpression: (node: Tsestree): void => {
        const callNode = node as unknown as NodeWithCallee;
        const { callee } = callNode;

        if (!callee) return;

        const calleeType = (callee as { type: string }).type;
        if (calleeType === 'Identifier') {
          const calleeName = (callee as NodeWithName).name;
          if (calleeName === 'it' || calleeName === 'test') {
            testBlockDepth++;
          }
        }
      },

      // Track when we exit a test block
      'CallExpression:exit': (node: Tsestree): void => {
        const callNode = node as unknown as NodeWithCallee;
        const { callee } = callNode;

        if (!callee) return;

        const calleeType = (callee as { type: string }).type;
        if (calleeType === 'Identifier') {
          const calleeName = (callee as NodeWithName).name;
          if (calleeName === 'it' || calleeName === 'test') {
            testBlockDepth--;
          }
        }
      },

      // Check variable declarations for proxy creation
      VariableDeclaration: (node: Tsestree): void => {
        const varDecl = node as unknown as NodeWithDeclarations;
        const { declarations } = varDecl;

        if (!declarations || declarations.length === 0) return;

        for (const declaration of declarations) {
          // Skip if this declaration is already tracked as exported (avoid duplicate errors)
          if (exportedProxyDeclarations.has(declaration)) continue;

          const declarator = declaration as unknown as NodeWithId & NodeWithInit;
          const { id, init } = declarator;

          if (!init) continue;

          // Check if init is a proxy creation call (ends with Proxy())
          const initType = (init as { type: string }).type;
          if (initType === 'CallExpression') {
            const callExpr = init as unknown as NodeWithCallee;
            const { callee } = callExpr;

            if (callee) {
              const calleeType = (callee as { type: string }).type;
              if (calleeType === 'Identifier') {
                const calleeName = (callee as NodeWithName).name;
                if (calleeName?.endsWith('Proxy')) {
                  // Found proxy creation - check if inside test block
                  if (testBlockDepth === 0) {
                    const variableName =
                      id && 'name' in id ? ((id as NodeWithName).name ?? 'proxy') : 'proxy';
                    ctx.report({
                      node: declaration,
                      messageId: 'proxyMustBeInTest',
                      data: {
                        name: variableName,
                        proxyFunction: calleeName,
                      },
                    });
                  }
                }
              }
            }
          }
        }
      },

      // Check for exported proxy instances
      ExportNamedDeclaration: (node: Tsestree): void => {
        const exportNode = node as unknown as ExportDeclarationNode;
        const { declaration } = exportNode;

        if (!declaration) return;

        const declarationType = (declaration as { type: string }).type;

        if (declarationType !== 'VariableDeclaration') return;

        const varDecl = declaration as NodeWithDeclarations;
        const { declarations } = varDecl;

        if (!declarations || declarations.length === 0) return;

        for (const declarator of declarations) {
          const declaratorNode = declarator as unknown as NodeWithInit;
          const { init } = declaratorNode;

          if (!init) continue;

          // Check if init is a proxy creation call
          const initType = (init as { type: string }).type;
          if (initType === 'CallExpression') {
            const callExpr = init as unknown as NodeWithCallee;
            const { callee } = callExpr;

            if (callee) {
              const calleeType = (callee as { type: string }).type;
              if (calleeType === 'Identifier') {
                const calleeName = (callee as NodeWithName).name;
                if (calleeName?.endsWith('Proxy')) {
                  // Track this declaration as exported to avoid duplicate errors
                  exportedProxyDeclarations.add(declarator);

                  // Found exported proxy instance
                  ctx.report({
                    node: declarator,
                    messageId: 'noExportProxy',
                  });
                }
              }
            }
          }
        }
      },
    };
  },
});
