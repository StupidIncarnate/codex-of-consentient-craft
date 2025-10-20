import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { isAstMethodCallGuard } from '../../../guards/is-ast-method-call/is-ast-method-call-guard';
import { isNpmPackageGuard } from '../../../guards/is-npm-package/is-npm-package-guard';
import { astGetImportsTransformer } from '../../../transformers/ast-get-imports/ast-get-imports-transformer';
import { astGetCallFirstArgumentNameTransformer } from '../../../transformers/ast-get-call-first-argument-name/ast-get-call-first-argument-name-transformer';

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

          const argumentName = astGetCallFirstArgumentNameTransformer({ node });
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
            if (importSource && !isNpmPackageGuard({ importSource })) {
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
