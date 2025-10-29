import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { folderConfigStatics } from '../../../statics/folder-config/folder-config-statics';
import type { Identifier } from '@questmaestro/shared/contracts';
import { identifierContract } from '@questmaestro/shared/contracts';
import { singularizeFolderTypeTransformer } from '../../../transformers/singularize-folder-type/singularize-folder-type-transformer';

/**
 * PURPOSE: Creates ESLint rule that ensures proxies are created inside each test block, not at module level or in hooks
 *
 * USAGE:
 * const rule = ruleEnforceTestCreationOfProxyBroker();
 * // Returns EslintRule that validates proxy instances are created fresh in each it/test block
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce test isolation by preventing shared proxy instances
 */
export const ruleEnforceTestCreationOfProxyBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ensure proxies are created inside each test (it/test block), not at module level or in beforeEach/afterEach hooks',
      },
      messages: {
        proxyMustBeInTest:
          'Proxy instance {{name}} must be created inside each test (it/test block), not at module level or in beforeEach/afterEach hooks. Use: const {{name}} = {{proxyFunction}}() inside the test.',
        noExportProxy:
          'Do not export proxy instances from test files. Create proxies fresh in each test instead.',
        proxyNotCreated:
          'Implementation {{implementationName}} called without creating {{proxyName}} first. Create the proxy before calling the implementation: const proxy = {{proxyName}}(); proxy.setup(...); {{implementationName}}();',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ? String(ctx.filename) : '';

    // Only check test files
    if (!isTestFileGuard({ filename })) {
      return {};
    }

    // Track if we're inside a test block (it/test only, NOT beforeEach/etc)
    let testBlockDepth = 0;

    // Track exported proxy declarations to avoid duplicate errors
    const exportedProxyDeclarations = new Set<Tsestree>();

    // Track proxies created in current test block (reset for each test)
    const proxiesCreatedInCurrentTest = new Set<Identifier>();

    // Track if we've seen any proxy creation in current test
    let hasCreatedProxyInTest = false;

    // Get list of folder types that require proxies from folderConfigStatics
    // Convert to suffixes: brokers -> Broker, adapters -> Adapter
    const folderTypesRequiringProxies = Object.entries(folderConfigStatics)
      .filter(([, config]) => config.requireProxy)
      .map(([folderType]) => {
        const singular = singularizeFolderTypeTransformer({ folderType });
        return singular.charAt(0).toUpperCase() + singular.slice(1);
      });

    return {
      // Track when we enter a test block (it/test calls) or hook block
      CallExpression: (node: Tsestree): void => {
        const { callee } = node;

        if (!callee) return;

        if (callee.type === 'Identifier') {
          const { name } = callee;
          if (name === 'it' || name === 'test') {
            testBlockDepth += 1;
            // Reset proxy tracking for new test
            proxiesCreatedInCurrentTest.clear();
            hasCreatedProxyInTest = false;
          } else if (testBlockDepth > 0 && name !== undefined && name !== '') {
            // Check if this is a proxy call (mark that proxy was created)
            if (name.endsWith('Proxy')) {
              hasCreatedProxyInTest = true;
            }

            // Inside a test block - check if this is a testable implementation call
            // Only check for architectural components that require proxies per folderConfigStatics
            const requiresProxy = folderTypesRequiringProxies.some((suffix) =>
              name.endsWith(suffix),
            );
            const isTestableImplementation = requiresProxy && !name.endsWith('Proxy');

            if (isTestableImplementation && !hasCreatedProxyInTest) {
              // Check if there's a colocated proxy file for this implementation
              // Derive proxy name: userBroker -> userBrokerProxy
              const expectedProxyName = `${name}Proxy`;

              // Report error: implementation called without creating proxy first
              ctx.report({
                node,
                messageId: 'proxyNotCreated',
                data: {
                  implementationName: name,
                  proxyName: expectedProxyName,
                },
              });
            }
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
            testBlockDepth -= 1;
          }
        }
      },

      // Check variable declarations for proxy creation
      VariableDeclaration: (node: Tsestree): void => {
        const { declarations } = node;

        if (!declarations || declarations.length === 0) return;

        for (const declaration of declarations) {
          // Skip if this declaration is already tracked as exported (avoid duplicate errors)
          if (exportedProxyDeclarations.has(declaration)) {
            // Skip to next declaration
          } else {
            const { id, init } = declaration;

            if (init && init.type === 'CallExpression') {
              const { callee } = init;

              if (callee && callee.type === 'Identifier') {
                const { name } = callee;
                const isProxyCall = Boolean(name?.endsWith('Proxy'));
                if (isProxyCall) {
                  // Found proxy creation - check if inside test block (NOT hooks)
                  if (testBlockDepth === 0) {
                    const variableName = id?.name ?? 'proxy';
                    ctx.report({
                      node: declaration,
                      messageId: 'proxyMustBeInTest',
                      data: {
                        name: variableName,
                        proxyFunction: name ?? 'proxy',
                      },
                    });
                  } else {
                    // Inside test block - mark that we've created a proxy
                    hasCreatedProxyInTest = true;
                    const variableNameRaw = id?.name ?? name ?? 'proxy';
                    const variableName = identifierContract.parse(variableNameRaw);
                    proxiesCreatedInCurrentTest.add(variableName);
                  }
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

          if (init && init.type === 'CallExpression') {
            const { callee } = init;

            if (callee && callee.type === 'Identifier') {
              const { name } = callee;
              const isProxyCall = Boolean(name?.endsWith('Proxy'));
              if (isProxyCall) {
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
