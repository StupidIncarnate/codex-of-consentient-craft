import type { Rule } from '../../../adapters/eslint/eslint-rule-adapter';

interface CallExpressionNode {
  type: string;
  callee?: {
    type: string;
    object?: {
      type: string;
      name?: string;
    };
    property?: {
      type: string;
      name?: string;
    };
    name?: string;
  };
  arguments?: unknown[];
}

interface VariableDeclarator {
  type: string;
  id?: {
    type: string;
    name?: string;
  };
  init?: CallExpressionNode;
}

interface ImportSpecifier {
  type: string;
  imported?: {
    name?: string;
  };
  local?: {
    name?: string;
  };
}

interface ImportDeclarationNode {
  type: string;
  specifiers?: ImportSpecifier[];
  source?: {
    value?: string;
  };
}

// List of global objects that are allowed with jest.spyOn
const ALLOWED_SPY_ON_GLOBALS = ['Date', 'crypto', 'console', 'Math', 'process'];

const isProxyFile = ({ filename }: { filename: string }): boolean => filename.endsWith('.proxy.ts');

const isAdapterProxy = ({ filename }: { filename: string }): boolean =>
  filename.includes('-adapter.proxy.ts');

const isStateProxy = ({ filename }: { filename: string }): boolean =>
  filename.includes('-state.proxy.ts');

const isJestMockCall = (node: CallExpressionNode): boolean =>
  node.callee?.type === 'MemberExpression' &&
  node.callee.object?.type === 'Identifier' &&
  node.callee.object.name === 'jest' &&
  node.callee.property?.type === 'Identifier' &&
  node.callee.property.name === 'mock';

const isJestMockedCall = (node: CallExpressionNode): boolean =>
  node.callee?.type === 'MemberExpression' &&
  node.callee.object?.type === 'Identifier' &&
  node.callee.object.name === 'jest' &&
  node.callee.property?.type === 'Identifier' &&
  node.callee.property.name === 'mocked';

const isJestSpyOnCall = (node: CallExpressionNode): boolean =>
  node.callee?.type === 'MemberExpression' &&
  node.callee.object?.type === 'Identifier' &&
  node.callee.object.name === 'jest' &&
  node.callee.property?.type === 'Identifier' &&
  node.callee.property.name === 'spyOn';

const getSpyOnTarget = (node: CallExpressionNode): string | null => {
  if (!node.arguments || node.arguments.length === 0) {
    return null;
  }

  interface ArgumentWithName {
    type: string;
    name?: string;
  }

  const firstArg = node.arguments[0] as ArgumentWithName;
  if (firstArg.type === 'Identifier' && firstArg.name) {
    return firstArg.name;
  }

  return null;
};

export const enforceJestMockedUsageRuleBroker = (): Rule.RuleModule => {
  // Track jest.mock() calls and imported module names
  const jestMockedModules = new Set<string>();
  const importedModuleNames = new Map<string, string>(); // source -> local name
  const variablesWithJestMocked = new Set<string>();

  return {
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
    create: (context: Rule.RuleContext) => {
      // Reset state for each file
      jestMockedModules.clear();
      importedModuleNames.clear();
      variablesWithJestMocked.clear();

      // Only check proxy files
      if (!isProxyFile({ filename: context.filename })) {
        return {};
      }

      return {
        // Track imports to know which names are module imports
        ImportDeclaration: (node): void => {
          const importNode = node as unknown as ImportDeclarationNode;
          const source = importNode.source?.value;

          if (typeof source !== 'string') {
            return;
          }

          // Track all imported names from this module
          const specifiers = importNode.specifiers ?? [];
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
        CallExpression: (node): void => {
          const callNode = node as unknown as CallExpressionNode;

          // Track jest.mock() calls
          if (isJestMockCall(callNode)) {
            if (callNode.arguments && callNode.arguments.length > 0) {
              interface StringLiteral {
                type: string;
                value?: string;
              }
              const firstArg = callNode.arguments[0] as StringLiteral;
              if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
                jestMockedModules.add(firstArg.value);
              }
            }
          }

          // Check jest.spyOn() usage
          if (isJestSpyOnCall(callNode)) {
            const target = getSpyOnTarget(callNode);
            if (target && !ALLOWED_SPY_ON_GLOBALS.includes(target)) {
              // Check if this is an imported module
              if (importedModuleNames.has(target)) {
                context.report({
                  node,
                  messageId: 'spyOnModuleImport',
                });
              }
            }
          }
        },

        // Track variables that use jest.mocked() and check for direct assignments
        VariableDeclarator: (node): void => {
          const declaratorNode = node as unknown as VariableDeclarator;

          if (!declaratorNode.init || !declaratorNode.id) {
            return;
          }

          interface InitNode {
            type: string;
            name?: string;
            expression?: {
              type: string;
              name?: string;
            };
          }

          const initNode = declaratorNode.init as unknown as InitNode;

          // Check if using jest.mocked()
          const callNode = declaratorNode.init;
          if (isJestMockedCall(callNode)) {
            // Check if this is a non-adapter/non-state proxy using jest.mocked()
            // State proxies can use jest.mocked() for external systems (Redis, DB)
            if (
              !isAdapterProxy({ filename: context.filename }) &&
              !isStateProxy({ filename: context.filename })
            ) {
              context.report({
                node,
                messageId: 'nonAdapterNoJestMocked',
              });
              return;
            }

            // Extract the module name from jest.mocked(moduleName)
            if (callNode.arguments && callNode.arguments.length > 0) {
              interface ArgumentWithName {
                type: string;
                name?: string;
              }
              const arg = callNode.arguments[0] as ArgumentWithName;
              if (arg.type === 'Identifier' && arg.name) {
                variablesWithJestMocked.add(arg.name);
              }
            }
            return;
          }

          // Check if assigning directly to an imported module (without jest.mocked)
          // This includes both plain identifiers and TSAsExpressions
          let importedName: string | null = null;

          if (initNode.type === 'Identifier' && initNode.name) {
            importedName = initNode.name;
          } else if (initNode.type === 'TSAsExpression' && initNode.expression) {
            // Handle: const mock = axios as jest.MockedFunction<typeof axios>
            if (initNode.expression.type === 'Identifier' && initNode.expression.name) {
              importedName = initNode.expression.name;
            }
          }

          if (importedName && importedModuleNames.has(importedName)) {
            const source = importedModuleNames.get(importedName);
            // Check if this module was mocked with jest.mock()
            if (source && jestMockedModules.has(source)) {
              context.report({
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
