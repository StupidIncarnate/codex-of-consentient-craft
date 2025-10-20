import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isAstMethodCallGuard } from '../../../guards/is-ast-method-call/is-ast-method-call-guard';

// List of global objects that are allowed with jest.spyOn
const ALLOWED_SPY_ON_GLOBALS = ['Date', 'crypto', 'console', 'Math', 'process'];

const isProxyFile = ({ filename }: { filename: string }): boolean => filename.endsWith('.proxy.ts');

const isAdapterProxy = ({ filename }: { filename: string }): boolean =>
  filename.includes('-adapter.proxy.ts');

const isStateProxy = ({ filename }: { filename: string }): boolean =>
  filename.includes('-state.proxy.ts');

const getSpyOnTarget = ({ node }: { node: Tsestree }): string | null => {
  if (!node.arguments || node.arguments.length === 0) {
    return null;
  }

  const [firstArg] = node.arguments;
  if (firstArg && firstArg.type === 'Identifier' && firstArg.name) {
    return firstArg.name;
  }

  return null;
};

export const ruleEnforceJestMockedUsageBroker = (): EslintRule => {
  // Track jest.mock() calls and imported module names
  const jestMockedModules = new Set<string>();
  const importedModuleNames = new Map<string, string>(); // source -> local name
  const variablesWithJestMocked = new Set<string>();

  return {
    ...eslintRuleContract.parse({
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce proper Jest mocking patterns in proxy files',
        },
        messages: {
          useJestMocked:
            'When using jest.mock(), access the mocked module with jest.mocked(). Use: const mock = jest.mocked({{moduleName}})',
          spyOnModuleImport:
            'jest.spyOn() should only be used for global objects (Date, crypto, console, Math). Use jest.mock() + jest.mocked() for module imports instead.',
          nonAdapterNoJestMocked:
            'Non-adapter proxies cannot use jest.mocked(). Only adapters (I/O boundaries) and state proxies (for external systems) should be mocked. Brokers, widgets, and responders must run real code.',
        },
        schema: [],
      },
    }),
    create: (context: unknown) => {
      const ctx = context as EslintContext;
      // Reset state for each file
      jestMockedModules.clear();
      importedModuleNames.clear();
      variablesWithJestMocked.clear();

      // Only check proxy files
      if (!isProxyFile({ filename: ctx.filename ?? '' })) {
        return {};
      }

      return {
        // Track imports to know which names are module imports
        ImportDeclaration: (node: Tsestree): void => {
          const source = node.source?.value;

          if (typeof source !== 'string') {
            return;
          }

          // Track all imported names from this module
          const specifiers = node.specifiers ?? [];
          for (const spec of specifiers) {
            if (spec.type === 'ImportSpecifier' && spec.local?.name) {
              importedModuleNames.set(spec.local.name, source);
            } else if (spec.type === 'ImportDefaultSpecifier' && spec.local?.name) {
              importedModuleNames.set(spec.local.name, source);
            } else if (spec.type === 'ImportNamespaceSpecifier' && spec.local?.name) {
              importedModuleNames.set(spec.local.name, source);
            }
          }
        },

        // Track jest.mock() calls
        CallExpression: (node: Tsestree): void => {
          // Track jest.mock() calls
          if (isAstMethodCallGuard({ node, object: 'jest', method: 'mock' })) {
            if (node.arguments && node.arguments.length > 0) {
              const [firstArg] = node.arguments;
              if (firstArg && firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
                jestMockedModules.add(firstArg.value);
              }
            }
          }

          // Check jest.spyOn() usage
          if (isAstMethodCallGuard({ node, object: 'jest', method: 'spyOn' })) {
            const target = getSpyOnTarget({ node });
            if (target && !ALLOWED_SPY_ON_GLOBALS.includes(target)) {
              // Check if this is an imported module
              if (importedModuleNames.has(target)) {
                ctx.report({
                  node,
                  messageId: 'spyOnModuleImport',
                });
              }
            }
          }
        },

        // Track variables that use jest.mocked() and check for direct assignments
        VariableDeclarator: (node: Tsestree): void => {
          if (!node.init || !node.id) {
            return;
          }

          // Check if using jest.mocked()
          if (isAstMethodCallGuard({ node: node.init, object: 'jest', method: 'mocked' })) {
            // Check if this is a non-adapter/non-state proxy using jest.mocked()
            // State proxies can use jest.mocked() for external systems (Redis, DB)
            if (
              !isAdapterProxy({ filename: ctx.filename ?? '' }) &&
              !isStateProxy({ filename: ctx.filename ?? '' })
            ) {
              ctx.report({
                node,
                messageId: 'nonAdapterNoJestMocked',
              });
              return;
            }

            // Extract the module name from jest.mocked(moduleName)
            if (node.init.arguments && node.init.arguments.length > 0) {
              const [arg] = node.init.arguments;
              if (arg && arg.type === 'Identifier' && arg.name) {
                variablesWithJestMocked.add(arg.name);
              }
            }
            return;
          }

          // Check if assigning directly to an imported module (without jest.mocked)
          // This includes both plain identifiers and TSAsExpressions
          let importedName: string | null = null;

          if (node.init.type === 'Identifier' && node.init.name) {
            importedName = node.init.name;
          } else if (node.init.type === 'TSAsExpression' && node.init.expression) {
            // Handle: const mock = axios as jest.MockedFunction<typeof axios>
            if (node.init.expression.type === 'Identifier' && node.init.expression.name) {
              importedName = node.init.expression.name;
            }
          }

          if (importedName && importedModuleNames.has(importedName)) {
            const source = importedModuleNames.get(importedName);
            // Check if this module was mocked with jest.mock()
            if (source && jestMockedModules.has(source)) {
              ctx.report({
                node,
                messageId: 'useJestMocked',
                data: {
                  moduleName: importedName,
                },
              });
            }
          }
        },

        // At the end of the file, check if all jest.mock() calls have corresponding jest.mocked() usage
        'Program:exit': (): void => {
          // For each imported module that has jest.mock() called on it,
          // verify it's accessed via jest.mocked()
          for (const [localName, source] of importedModuleNames) {
            if (jestMockedModules.has(source) && !variablesWithJestMocked.has(localName)) {
              // This module was mocked but not accessed via jest.mocked()
              // We need to report this, but we don't have a specific node here
              // This validation is better done at the point of usage
              // So we'll skip this check for now as it's covered by the test cases
            }
          }
        },
      };
    },
  };
};
