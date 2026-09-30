/**
 * PURPOSE: Enforces internal patterns for .proxy.ts files including colocation, return types, mocking, and constructor setup
 *
 * USAGE:
 * const rule = ruleEnforceProxyPatternsBroker();
 * // Returns ESLint rule that validates proxy files return objects, use jest.mocked(), setup mocks in constructor, etc.
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { existsSync } from '#gateway/node/fs';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { isIoBoundaryProxyGuard } from '../../../guards/is-io-boundary-proxy/is-io-boundary-proxy-guard';
import { validateProxyFunctionReturnLayerBroker } from './validate-proxy-function-return-layer-broker';
import { validateAdapterMockSetupLayerBroker } from './validate-adapter-mock-setup-layer-broker';
import { validateProxyConstructorSideEffectsLayerBroker } from './validate-proxy-constructor-side-effects-layer-broker';
import { validateNoExposedChildProxiesLayerBroker } from './validate-no-exposed-child-proxies-layer-broker';
import { proxyPatternsStatics } from '../../../statics/proxy-patterns/proxy-patterns-statics';
import { proxyPathToImplementationPathTransformer } from '../../../transformers/proxy-path-to-implementation-path/proxy-path-to-implementation-path-transformer';
import { tsToTsxPathTransformer } from '../../../transformers/ts-to-tsx-path/ts-to-tsx-path-transformer';
import { isAstNodeDirectlyInFunctionGuard } from '../../../guards/is-ast-node-directly-in-function/is-ast-node-directly-in-function-guard';

export const ruleEnforceProxyPatternsBroker = (): TSESLint.RuleModule<
  | 'proxyMustReturnObject'
  | 'proxyNoBootstrapMethod'
  | 'jestMockMustBeModuleLevel'
  | 'jestMockedOnlyNpmPackages'
  | 'adapterProxyMustSetupMocks'
  | 'childProxyMustBeInConstructor'
  | 'childProxyMustBeInsideFunction'
  | 'proxyNoContractImports'
  | 'proxyHelperNoMockInName'
  | 'proxyConstructorNoSideEffects'
  | 'proxyNotColocated'
  | 'exposedChildProxy'
> => ({
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
        'Adapter proxy must describe a call in the constructor (before return statement) with handle.calledWith([...]).returns/.resolves/.rejects/.throws/.implement(...), or handle.onceFor([...]) for a one-time result.',
      childProxyMustBeInConstructor:
        'Child proxy {{proxyName}} must be created in constructor (before return statement), not inside returned methods. Create it before the return statement.',
      childProxyMustBeInsideFunction:
        'Child proxy {{proxyName}} must be created inside the proxy function, not at module level. Move it inside the create*Proxy function body.',
      proxyNoContractImports:
        'Proxies must not import from contract files ({{importPath}}). Import from stub files (.stub.ts) instead.',
      proxyHelperNoMockInName:
        'Proxy helper "{{name}}" uses forbidden word "{{forbiddenWord}}". Use "returns", "throws", or describe the action instead. Proxies abstract implementation details.',
      proxyConstructorNoSideEffects:
        'Proxy constructor must only create child proxies and setup mocks. Found side effect: {{type}}. Move to setup methods instead. Allowed: const childProxy = create...(), handle.calledWith([...]), handle.onceFor([...]), handle.callsMatching([...]), jest.mocked(...), jest.spyOn(...)',
      proxyNotColocated:
        'Proxy file must be colocated with its implementation file. Expected implementation file "{{expectedPath}}" not found in the same directory.',
      exposedChildProxy:
        'Proxy must not expose child proxy "{{proxyName}}" in return object. Create semantic methods that delegate to child proxies instead. Example: setupQuestFile: ({questJson}) => { {{proxyName}}.setupQuestFile({questJson}); }',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;

    // Only check .proxy.ts files
    if (!hasFileSuffixGuard({ ...(filename ? { filename } : {}), suffix: 'proxy' })) {
      return {};
    }

    // Track child proxy creations for validation
    const childProxyCreations: {
      node: TSESTree.Node;
      name: string;
      isInsideProxyFunction: boolean;
      isBeforeReturn: boolean;
    }[] = [];

    // Track proxy variable assignments: const foo = barProxy()
    // Maps variable name -> callee name (both as Identifiers)
    const proxyVariableAssignments = new Map<string, string>();

    let currentProxyFunction: TSESTree.Node | null = null;
    let foundReturnStatement = false;

    return {
      // Check proxy file colocation at Program level
      Program: (node: TSESTree.Program): void => {
        // Check that proxy file is colocated with implementation file
        const proxyFilePath = filename;

        // Extract implementation file path by removing .proxy.ts and adding .ts
        // Example: foo-adapter.proxy.ts -> foo-adapter.ts
        const implementationPathTs = proxyPathToImplementationPathTransformer({ proxyPath: proxyFilePath });

        // Also check for .tsx extension (React components)
        const implementationPathTsx = tsToTsxPathTransformer({ tsPath: implementationPathTs });

        // Check if implementation file exists (either .ts or .tsx)
        const tsExists = existsSync(implementationPathTs);
        const tsxExists = existsSync(implementationPathTsx);

        if (!tsExists && !tsxExists) {
          ctx.report({
            node,
            messageId: 'proxyNotColocated',
            data: {
              expectedPath: implementationPathTs,
            },
          });
        }
      },

      // Check for contract imports (must use .stub.ts, not -contract.ts)
      ImportDeclaration: (node: TSESTree.ImportDeclaration): void => {
        const { source, importKind } = node;
        if (typeof source.value !== 'string') return;

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
      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;

        // Check for child proxy creation (*Proxy() calls). A call counts as "in constructor" when
        // it sits directly in the proxy function's own body — a statement before return, OR part
        // of the returned value's own expression (`return { ...childProxy() }`, same as the
        // implicit-return `() => ({ ...childProxy() })`) — but NOT nested inside a further
        // function the returned object exposes as a method, which is deferred rather than eager.
        if (callee.type === AST_NODE_TYPES.Identifier) {
          const calleeName = callee.name;
          if (calleeName.endsWith('Proxy')) {
            const isInsideProxyFunction = currentProxyFunction !== null;
            const isBeforeReturn =
              isInsideProxyFunction &&
              isAstNodeDirectlyInFunctionGuard({
                node,
                functionNode: currentProxyFunction ?? undefined,
              });

            childProxyCreations.push({
              node,
              name: calleeName,
              isInsideProxyFunction,
              isBeforeReturn,
            });
          }
        }

        // Check if this is jest.mock() or jest.mocked()
        if (callee.type === AST_NODE_TYPES.MemberExpression) {
          const { object } = callee;
          const { property } = callee;

          // Check jest.mock() - must be at module level
          if (
            object.type === AST_NODE_TYPES.Identifier &&
            object.name === 'jest' &&
            (property.type === AST_NODE_TYPES.Identifier ||
              property.type === AST_NODE_TYPES.PrivateIdentifier) &&
            property.name === 'mock'
          ) {
            // Check if we're inside a function
            const ancestors = ctx.sourceCode.getAncestors(node);
            const isInsideFunction = ancestors.some((ancestor) => {
              const ancestorNode = ancestor;
              return (
                ancestorNode.type === AST_NODE_TYPES.FunctionDeclaration ||
                ancestorNode.type === AST_NODE_TYPES.FunctionExpression ||
                ancestorNode.type === AST_NODE_TYPES.ArrowFunctionExpression
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
          if (
            object.type === AST_NODE_TYPES.Identifier &&
            object.name === 'jest' &&
            (property.type === AST_NODE_TYPES.Identifier ||
              property.type === AST_NODE_TYPES.PrivateIdentifier) &&
            property.name === 'mocked'
          ) {
            const args = node.arguments;
            if (args.length > 0) {
              const [firstArg] = args;
              if (firstArg?.type === AST_NODE_TYPES.Identifier) {
                const argName = firstArg.name;

                // Check if argument name ends with any implementation suffix
                const isImplementationCode = proxyPatternsStatics.implementationSuffixes.some(
                  (suffix) => argName.endsWith(suffix),
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
        (node: TSESTree.ArrowFunctionExpression): void => {
          // Check if this is a proxy function
          const ancestors = ctx.sourceCode.getAncestors(node);
          for (const ancestor of ancestors) {
            if (ancestor.type === AST_NODE_TYPES.VariableDeclarator) {
              const { id } = ancestor;
              if (id.type === AST_NODE_TYPES.Identifier && id.name.endsWith('Proxy')) {
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

      // Track return statements and validate exposed child proxies
      ReturnStatement: (node: TSESTree.ReturnStatement): void => {
        if (currentProxyFunction !== null) {
          foundReturnStatement = true;

          // Check if return has an ObjectExpression argument
          const { argument } = node;
          if (argument?.type === AST_NODE_TYPES.ObjectExpression) {
            // Validate that no child proxies are exposed in the return object
            validateNoExposedChildProxiesLayerBroker({
              objectNode: argument,
              proxyVariables: proxyVariableAssignments,
              context: ctx,
            });
          }
        }
      },

      // Track proxy variable assignments: const foo = barProxy()
      VariableDeclarator: (node: TSESTree.VariableDeclarator): void => {
        // Only track inside proxy functions and before return
        if (!currentProxyFunction || foundReturnStatement) return;

        const { id, init } = node;
        if (id.type !== AST_NODE_TYPES.Identifier || !init) return;

        // Check if init is a CallExpression with callee ending in 'Proxy'
        if (
          init.type === AST_NODE_TYPES.CallExpression &&
          init.callee.type === AST_NODE_TYPES.Identifier
        ) {
          const calleeName = init.callee.name;
          if (calleeName.endsWith('Proxy')) {
            proxyVariableAssignments.set(
              id.name,
              calleeName,
            );
          }
        }
      },

      // Find the exported proxy function
      ExportNamedDeclaration: (node: TSESTree.ExportNamedDeclaration): void => {
        const { declaration } = node;

        if (!declaration) return;

        // We need VariableDeclaration (export const foo = ...)
        if (declaration.type !== AST_NODE_TYPES.VariableDeclaration) return;

        const { declarations } = declaration;
        if (declarations.length === 0) return;

        const [firstDeclaration] = declarations;
        const { id } = firstDeclaration;
        const { init } = firstDeclaration;

        if (!init) return;

        // Check if this is a proxy function (ends with 'Proxy')
        const name = id.type === AST_NODE_TYPES.Identifier ? id.name : undefined;
        if (name?.endsWith('Proxy')) {
          // Check the function's return type and body
          if (
            init.type === AST_NODE_TYPES.ArrowFunctionExpression ||
            init.type === AST_NODE_TYPES.FunctionExpression
          ) {
            validateProxyFunctionReturnLayerBroker({ functionNode: init, context: ctx });

            // For I/O-boundary proxies (adapters/, and gateway wrappers under packages/{node,
            // npm,browser,bin}/), check that mock setup happens in constructor
            const isAdapterProxy =
              isIoBoundaryProxyGuard({ ...(filename ? { filename } : {}) }) &&
              hasFileSuffixGuard({
                ...(filename ? { filename } : {}),
                suffix: 'proxy',
              });
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
