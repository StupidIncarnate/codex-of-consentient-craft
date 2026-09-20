/**
 * PURPOSE: Enforces architectural structure of @dungeonmaster/hydration-recipes and bans direct imports from its brokers
 *
 * USAGE:
 * const rule = ruleEnforceHydrationRecipesStructureBroker();
 * // Returns ESLint rule that verifies required files in hydration-recipes and forbids direct broker imports
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { filepathResolveRelativeImportTransformer } from '../../../transformers/filepath-resolve-relative-import/filepath-resolve-relative-import-transformer';
import { hydrationRecipesStructureStatics } from '../../../statics/hydration-recipes-structure/hydration-recipes-structure-statics';

export const ruleEnforceHydrationRecipesStructureBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Enforce @dungeonmaster/hydration-recipes package structure and ban direct imports from its brokers',
      },
      messages: {
        noBrokerImport:
          'Do not import from @dungeonmaster/hydration-recipes/brokers. Use @dungeonmaster/hydration-recipes or @dungeonmaster/hydration-recipes/responders instead.',
        missingStructure:
          'Package packages/hydration-recipes is missing required architectural file: {{filePath}}',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const { filename } = context;
    if (!filename || filename === '<text>' || filename === '<input>') {
      return {};
    }

    const packagesIndex = filename.indexOf('/packages/');
    const lastSlash = filename.lastIndexOf('/');
    const fallbackDir = lastSlash === -1 ? '' : filename.slice(0, lastSlash);
    const fallbackCandidate =
      fallbackDir.length > 0
        ? filePathContract.parse(`${fallbackDir}/packages/hydration-recipes`)
        : undefined;

    const repoRoot =
      packagesIndex > 0
        ? filePathContract.parse(filename.slice(0, packagesIndex))
        : packagesIndex === 0 || filename.startsWith('packages/')
          ? filePathContract.parse('')
          : fallbackCandidate && fsExistsSyncAdapter({ filePath: fallbackCandidate })
            ? filePathContract.parse(fallbackDir)
            : undefined;

    if (repoRoot === undefined) {
      return {};
    }

    const hydrationRecipesDir =
      repoRoot.length > 0
        ? filePathContract.parse(`${repoRoot}/packages/hydration-recipes`)
        : filename.startsWith('/packages/')
          ? filePathContract.parse('/packages/hydration-recipes')
          : filePathContract.parse('packages/hydration-recipes');

    if (!fsExistsSyncAdapter({ filePath: hydrationRecipesDir })) {
      return {};
    }

    const isInsideHydrationRecipes =
      filename.includes('/packages/hydration-recipes/') ||
      filename.startsWith('packages/hydration-recipes/');

    return {
      ImportDeclaration: (node: Tsestree): void => {
        const sourceValue = typeof node.source?.value === 'string' ? node.source.value : undefined;
        if (!sourceValue) {
          return;
        }

        if (
          sourceValue === '@dungeonmaster/hydration-recipes/brokers' ||
          sourceValue.startsWith('@dungeonmaster/hydration-recipes/brokers/')
        ) {
          context.report({
            node,
            messageId: 'noBrokerImport',
          });
          return;
        }

        if (isInsideHydrationRecipes) {
          const isAllowedCaller =
            filename.includes('/src/brokers/') ||
            filename.includes('/src/responders/') ||
            filename.endsWith('/brokers.ts') ||
            filename === 'brokers.ts';

          if (!isAllowedCaller && (sourceValue.startsWith('./') || sourceValue.startsWith('../'))) {
            const resolved = filepathResolveRelativeImportTransformer({
              currentFilePath: filename,
              importPath: sourceValue,
            });

            if (resolved.includes('/src/brokers/') || resolved.endsWith('/src/brokers.ts')) {
              context.report({
                node,
                messageId: 'noBrokerImport',
              });
            }
          }
        }
      },
      Program: (node: Tsestree): void => {
        if (!isInsideHydrationRecipes) {
          return;
        }

        const { requiredFiles } = hydrationRecipesStructureStatics;

        for (const requiredFile of requiredFiles) {
          const fullPath = filePathContract.parse(`${hydrationRecipesDir}/${requiredFile}`);
          if (!fsExistsSyncAdapter({ filePath: fullPath })) {
            context.report({
              node,
              messageId: 'missingStructure',
              data: {
                filePath: requiredFile,
              },
            });
          }
        }
      },
    };
  },
});
