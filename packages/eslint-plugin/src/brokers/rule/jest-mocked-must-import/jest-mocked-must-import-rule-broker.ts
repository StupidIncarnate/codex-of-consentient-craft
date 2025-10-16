import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

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
  };
  arguments?: unknown[];
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

const isProxyFile = ({ filename }: { filename: string }): boolean => filename.endsWith('.proxy.ts');

const isAdapterProxy = ({ filename }: { filename: string }): boolean =>
  filename.includes('-adapter.proxy.ts');

const isJestMockedCall = (node: CallExpressionNode): boolean =>
  node.callee?.type === 'MemberExpression' &&
  node.callee.object?.type === 'Identifier' &&
  node.callee.object.name === 'jest' &&
  node.callee.property?.type === 'Identifier' &&
  node.callee.property.name === 'mocked';

const isNpmPackage = ({ importSource }: { importSource: string }): boolean => {
  // Relative/absolute paths are not npm packages
  if (importSource.startsWith('.') || importSource.startsWith('/')) {
    return false;
  }

  // @questmaestro workspace packages are not npm packages for mocking purposes
  if (importSource.startsWith('@questmaestro')) {
    return false;
  }

  // Everything else is an npm package (including node:, scoped packages, etc.)
  return true;
};

const getMockedArgumentName = (node: CallExpressionNode): string | null => {
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

export const jestMockedMustImportRuleBroker = (): EslintRule => {
  const importedNames = new Map<string, string>(); // local name -> source

  return {
    ...eslintRuleContract.parse({
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce that jest.mocked() arguments are imported at the top of the file',
        },
        messages: {
          mockedNotImported:
            'jest.mocked({{name}}) requires importing {{name}}. Add: import {{importStatement}}',
          mockingAdapter:
            'jest.mocked({{name}}) - Do not mock the adapter itself. Mock the npm package it uses instead (e.g., mock axios, not httpAdapter).',
          notNpmPackage:
            'jest.mocked({{name}}) - In adapter proxies, only mock npm packages (axios, fs, etc.), not adapters or business logic.',
        },
        schema: [],
      },
    }),
    create: (context: unknown) => {
      const ctx = context as EslintContext;
      // Reset state for each file
      importedNames.clear();

      // Only check proxy files
      if (!isProxyFile({ filename: ctx.filename ?? '' })) {
        return {};
      }

      return {
        // Track all imports
        ImportDeclaration: (node: Tsestree): void => {
          const importNode = node as unknown as ImportDeclarationNode;
          const source = importNode.source?.value;

          if (typeof source !== 'string') {
            return;
          }

          // Track all imported names
          const specifiers = importNode.specifiers ?? [];
          for (const spec of specifiers) {
            if (spec.type === 'ImportSpecifier' && spec.local?.name) {
              // Named import: import { foo } from 'bar'
              importedNames.set(spec.local.name, source);
            } else if (spec.type === 'ImportDefaultSpecifier' && spec.local?.name) {
              // Default import: import foo from 'bar'
              importedNames.set(spec.local.name, source);
            } else if (spec.type === 'ImportNamespaceSpecifier' && spec.local?.name) {
              // Namespace import: import * as foo from 'bar'
              importedNames.set(spec.local.name, source);
            }
          }
        },

        // Check jest.mocked() calls
        CallExpression: (node: Tsestree): void => {
          const callNode = node as unknown as CallExpressionNode;

          if (!isJestMockedCall(callNode)) {
            return;
          }

          const argumentName = getMockedArgumentName(callNode);
          if (!argumentName) {
            return;
          }

          // Check if argument is imported
          if (!importedNames.has(argumentName)) {
            // Determine import statement suggestion
            const importStatement = `${argumentName} from '${argumentName}'`;

            ctx.report({
              node,
              messageId: 'mockedNotImported',
              data: {
                name: argumentName,
                importStatement,
              },
            });
            return;
          }

          // Additional validation for adapter proxies
          if (isAdapterProxy({ filename: ctx.filename ?? '' })) {
            // Check if trying to mock the adapter itself
            if (argumentName.endsWith('Adapter')) {
              ctx.report({
                node,
                messageId: 'mockingAdapter',
                data: {
                  name: argumentName,
                },
              });
              return;
            }

            // Check if mocking an npm package
            const importSource = importedNames.get(argumentName);
            if (importSource && !isNpmPackage({ importSource })) {
              ctx.report({
                node,
                messageId: 'notNpmPackage',
                data: {
                  name: argumentName,
                },
              });
            }
          }
        },
      };
    },
  };
};
