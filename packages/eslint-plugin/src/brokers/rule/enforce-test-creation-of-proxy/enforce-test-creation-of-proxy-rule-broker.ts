import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';

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
        const { callee } = node;

        if (!callee) return;

        if (callee.type === 'Identifier') {
          const { name } = callee;
          if (name === 'it' || name === 'test') {
            testBlockDepth++;
          }
        }
      },

      // Track when we exit a test block
      'CallExpression:exit': (node: Tsestree): void => {
        const { callee } = node;

        if (!callee) return;

        if (callee.type === 'Identifier') {
          const { name } = callee;
          if (name === 'it' || name === 'test') {
            testBlockDepth--;
          }
        }
      },

      // Check variable declarations for proxy creation
      VariableDeclaration: (node: Tsestree): void => {
        const { declarations } = node;

        if (!declarations || declarations.length === 0) return;

        for (const declaration of declarations) {
          // Skip if this declaration is already tracked as exported (avoid duplicate errors)
          if (exportedProxyDeclarations.has(declaration)) continue;

          const { id, init } = declaration;

          if (!init) continue;

          // Check if init is a proxy creation call (ends with Proxy())
          if (init.type === 'CallExpression') {
            const { callee } = init;

            if (callee && callee.type === 'Identifier') {
              const { name } = callee;
              if (name?.endsWith('Proxy')) {
                // Found proxy creation - check if inside test block
                if (testBlockDepth === 0) {
                  const variableName = id?.name ?? 'proxy';
                  ctx.report({
                    node: declaration,
                    messageId: 'proxyMustBeInTest',
                    data: {
                      name: variableName,
                      proxyFunction: name,
                    },
                  });
                }
              }
            }
          }
        }
      },

      // Check for exported proxy instances
      ExportNamedDeclaration: (node: Tsestree): void => {
        const { declaration } = node;

        if (!declaration) return;

        if (declaration.type !== 'VariableDeclaration') return;

        const { declarations } = declaration;

        if (!declarations || declarations.length === 0) return;

        for (const declarator of declarations) {
          const { init } = declarator;

          if (!init) continue;

          // Check if init is a proxy creation call
          if (init.type === 'CallExpression') {
            const { callee } = init;

            if (callee && callee.type === 'Identifier') {
              const { name } = callee;
              if (name?.endsWith('Proxy')) {
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
      },
    };
  },
});
