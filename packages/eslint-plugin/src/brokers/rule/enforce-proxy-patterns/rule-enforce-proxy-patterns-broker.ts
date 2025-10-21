import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { filePathContract } from '@questmaestro/shared/contracts';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { validateProxyFunctionReturnLayerBroker } from './validate-proxy-function-return-layer-broker';
import { validateAdapterMockSetupLayerBroker } from './validate-adapter-mock-setup-layer-broker';
import { validateProxyConstructorSideEffectsLayerBroker } from './validate-proxy-constructor-side-effects-layer-broker';

export const ruleEnforceProxyPatternsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce proxy file internal patterns for .proxy.ts files',
      },
      messages: {
        proxyMustReturnObject:
          'Proxy function must return an object, not void, primitive, or array. Expected: export const fooProxy = () => ({ method: () => {} })',
        proxyNoBootstrapMethod:
          'Proxy returned object must NOT have a "bootstrap" property/method. Use constructor setup instead.',
        jestMockMustBeModuleLevel:
          'jest.mock() calls must be at module level (outside functions). Move jest.mock() call to top of file.',
        jestMockedOnlyNpmPackages:
          'jest.mocked({{name}}) - Only mock npm packages (axios, fs, etc), not implementation code. Implementation code ending with -adapter, -broker, -transformer, etc. should never be mocked.',
        adapterProxyMustSetupMocks:
          'Adapter proxy must call mock.mockImplementation() or mock.mockResolvedValue() in constructor (before return statement). This sets up default mock behavior when proxy is created.',
        childProxyMustBeInConstructor:
          'Child proxy {{proxyName}} must be created in constructor (before return statement), not inside returned methods. Create it before the return statement.',
        childProxyMustBeInsideFunction:
          'Child proxy {{proxyName}} must be created inside the proxy function, not at module level. Move it inside the create*Proxy function body.',
        proxyNoContractImports:
          'Proxies must not import from contract files ({{importPath}}). Import from stub files (.stub.ts) instead.',
        proxyHelperNoMockInName:
          'Proxy helper "{{name}}" uses forbidden word "{{forbiddenWord}}". Use "returns", "throws", or describe the action instead. Proxies abstract implementation details.',
        proxyConstructorNoSideEffects:
          'Proxy constructor must only create child proxies and setup mocks. Found side effect: {{type}}. Move to setup methods instead. Allowed: const childProxy = create...(), jest.mocked(...), jest.spyOn(...)',
        proxyNotColocated:
          'Proxy file must be colocated with its implementation file. Expected implementation file "{{expectedPath}}" not found in the same directory.',
      },
      schema: [],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    const { filename } = ctx;

    // Only check .proxy.ts files
    if (
      !hasFileSuffixGuard({ ...(filename ? { filename: String(filename) } : {}), suffix: 'proxy' })
    ) {
      return {};
    }

    // Track child proxy creations for validation
    const childProxyCreations: {
      node: Tsestree;
      name: string;
      isInsideProxyFunction: boolean;
      isBeforeReturn: boolean;
    }[] = [];

    let currentProxyFunction: Tsestree | null = null;
    let foundReturnStatement = false;

    return {
      // Check proxy file colocation at Program level
      Program: (node: Tsestree): void => {
        // Check that proxy file is colocated with implementation file
        const proxyFilePath = filePathContract.parse(filename);

        // Extract implementation file path by removing .proxy.ts and adding .ts
        // Example: foo-adapter.proxy.ts -> foo-adapter.ts
        const implementationPath = filePathContract.parse(
          proxyFilePath.replace(/\.proxy\.ts$/u, '.ts'),
        );

        // Check if implementation file exists
        if (!fsExistsSyncAdapter({ filePath: implementationPath })) {
          ctx.report({
            node,
            messageId: 'proxyNotColocated',
            data: {
              expectedPath: implementationPath,
            },
          });
        }
      },

      // Check for contract imports (must use .stub.ts, not -contract.ts)
      ImportDeclaration: (node: Tsestree): void => {
        const { source, importKind } = node;
        if (!source || typeof source.value !== 'string') return;

        const importPath = source.value;

        // Allow type-only imports (import type { ... })
        if (importKind === 'type') {
          return;
        }

        // Check if importing from a contract file
        // Contract files end with -contract (no extension in imports)
        if (importPath.endsWith('-contract')) {
          // Allow if it's a stub file
          if (importPath.endsWith('.stub')) {
            return;
          }

          ctx.report({
            node,
            messageId: 'proxyNoContractImports',
            data: { importPath },
          });
        }
      },

      // Check for jest.mock() calls inside functions, jest.mocked() arguments, and child proxy creation
      CallExpression: (node: Tsestree): void => {
        const { callee } = node;

        if (!callee) return;

        // Check for child proxy creation (*Proxy() calls)
        if (callee.type === 'Identifier') {
          const calleeName = callee.name;
          if (calleeName?.endsWith('Proxy')) {
            // Found a child proxy creation
            const isInsideProxyFunction = currentProxyFunction !== null;
            const isBeforeReturn = isInsideProxyFunction && !foundReturnStatement;

            childProxyCreations.push({
              node,
              name: calleeName,
              isInsideProxyFunction,
              isBeforeReturn,
            });
          }
        }

        // Check if this is jest.mock() or jest.mocked()
        if (callee.type === 'MemberExpression') {
          const { object } = callee;
          const { property } = callee;

          // Check jest.mock() - must be at module level
          if (object?.name === 'jest' && property?.name === 'mock') {
            // Check if we're inside a function
            const ancestors = ctx.sourceCode?.getAncestors(node) ?? [];
            const isInsideFunction = ancestors.some((ancestor) => {
              const ancestorNode = ancestor as Tsestree;
              return (
                ancestorNode.type === 'FunctionDeclaration' ||
                ancestorNode.type === 'FunctionExpression' ||
                ancestorNode.type === 'ArrowFunctionExpression'
              );
            });

            if (isInsideFunction) {
              ctx.report({
                node,
                messageId: 'jestMockMustBeModuleLevel',
              });
            }
          }

          // Check jest.mocked() - argument must be npm package, not implementation code
          if (object?.name === 'jest' && property?.name === 'mocked') {
            const args = node.arguments;
            if (args && args.length > 0) {
              const [firstArg] = args;
              if (firstArg?.name) {
                const argName = firstArg.name;

                // List of implementation code suffixes
                const implementationSuffixes = [
                  'Adapter',
                  'Broker',
                  'Transformer',
                  'Guard',
                  'Binding',
                  'Widget',
                  'Responder',
                  'Middleware',
                  'State',
                  'Flow',
                ];

                // Check if argument name ends with any implementation suffix
                const isImplementationCode = implementationSuffixes.some((suffix) =>
                  argName.endsWith(suffix),
                );

                if (isImplementationCode) {
                  ctx.report({
                    node,
                    messageId: 'jestMockedOnlyNpmPackages',
                    data: { name: argName },
                  });
                }
              }
            }
          }
        }
      },

      // Track when we enter a proxy function
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression':
        (node: Tsestree): void => {
          // Check if this is a proxy function
          const ancestors = ctx.sourceCode?.getAncestors(node) ?? [];
          for (const ancestor of ancestors) {
            const ancestorNode = ancestor as Tsestree;
            if (ancestorNode.type === 'VariableDeclarator') {
              const { id } = ancestorNode;
              if (id?.name?.endsWith('Proxy')) {
                currentProxyFunction = node;
                foundReturnStatement = false;
                break;
              }
            }
          }
        },

      // Track when we exit a proxy function
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression:exit':
        (): void => {
          currentProxyFunction = null;
          foundReturnStatement = false;
        },

      // Track return statements
      ReturnStatement: (): void => {
        if (currentProxyFunction !== null) {
          foundReturnStatement = true;
        }
      },

      // Find the exported proxy function
      ExportNamedDeclaration: (node: Tsestree): void => {
        const { declaration } = node;

        if (!declaration) return;

        // We need VariableDeclaration (export const foo = ...)
        if (declaration.type !== 'VariableDeclaration') return;

        const { declarations } = declaration;
        if (!declarations || declarations.length === 0) return;

        const [firstDeclaration] = declarations;
        const id = firstDeclaration?.id;
        const init = firstDeclaration?.init;

        if (!id || !init) return;

        // Check if this is a proxy function (ends with 'Proxy')
        const { name } = id;
        if (name?.endsWith('Proxy')) {
          // Check the function's return type and body
          if (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression') {
            validateProxyFunctionReturnLayerBroker({ functionNode: init, context: ctx });

            // For adapter proxies, check that mock setup happens in constructor
            const isAdapterProxy =
              (filename?.includes('/adapters/') &&
                hasFileSuffixGuard({
                  ...(filename ? { filename: String(filename) } : {}),
                  suffix: 'proxy',
                })) ??
              false;
            if (isAdapterProxy) {
              validateAdapterMockSetupLayerBroker({ functionNode: init, context: ctx });
            }

            // Check for side effects in constructor
            validateProxyConstructorSideEffectsLayerBroker({ functionNode: init, context: ctx });
          }
        }
      },

      // Validate child proxy creations at the end
      'Program:exit': (): void => {
        for (const creation of childProxyCreations) {
          if (!creation.isInsideProxyFunction) {
            // Child proxy created at module level
            ctx.report({
              node: creation.node,
              messageId: 'childProxyMustBeInsideFunction',
              data: { proxyName: creation.name },
            });
          } else if (!creation.isBeforeReturn) {
            // Child proxy created after return (inside methods)
            ctx.report({
              node: creation.node,
              messageId: 'childProxyMustBeInConstructor',
              data: { proxyName: creation.name },
            });
          }
        }
      },
    };
  },
});
