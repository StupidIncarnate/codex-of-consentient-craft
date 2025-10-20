import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { isAstMethodCallGuard } from '../../../guards/is-ast-method-call/is-ast-method-call-guard';
import { astGetImportsTransformer } from '../../../transformers/ast-get-imports/ast-get-imports-transformer';

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

const getMockedArgumentName = (node: Tsestree): string | null => {
  if (!node.arguments || node.arguments.length === 0) {
    return null;
  }

  const firstArg = node.arguments[0];
  if (firstArg && firstArg.type === 'Identifier' && firstArg.name) {
    return firstArg.name;
  }

  return null;
};

export const ruleJestMockedMustImportBroker = (): EslintRule => {
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
      if (!hasFileSuffixGuard({ filename: ctx.filename ?? '', suffix: 'proxy' })) {
        return {};
      }

      return {
        // Track all imports
        ImportDeclaration: (node: Tsestree): void => {
          const imports = astGetImportsTransformer({ node });
          for (const [name, source] of imports) {
            importedNames.set(name, source);
          }
        },

        // Check jest.mocked() calls
        CallExpression: (node: Tsestree): void => {
          if (!isAstMethodCallGuard({ node, object: 'jest', method: 'mocked' })) {
            return;
          }

          const argumentName = getMockedArgumentName(node);
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
          const filename = ctx.filename ?? '';
          if (
            filename.includes('/adapters/') &&
            hasFileSuffixGuard({ filename, suffix: 'proxy' })
          ) {
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
