/**
 * PURPOSE: For every import, export-from, dynamic import or require whose specifier starts with
 * `#gateway/`, confirms the linted file's own nearest package.json actually resolves it — mapped by
 * its `imports` field, then backed by a real `dependencies` (or, for a test-support file,
 * `dependencies` or `devDependencies`) entry for the resolved target package. The `imports` field
 * only RENAMES a specifier; it installs nothing, so a package importing `#gateway/npm/zod` without
 * `@dungeonmaster/npm` in its own `dependencies` resolves fine inside this monorepo (the workspace
 * symlink is already on disk) and then fails to resolve the moment it ships standalone.
 *
 * USAGE:
 * const rule = ruleGatewayDependencyDeclaredBroker();
 * // Returns an EslintRule that flags `import {glob} from '#gateway/npm/glob'` in a file whose
 * // nearest package.json omits "@dungeonmaster/npm" from dependencies
 */
import { importPathContract } from '@dungeonmaster/shared/contracts';
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { validateGatewaySpecifierLayerBroker } from './validate-gateway-specifier-layer-broker';

const gatewaySpecifierPrefix = `${gatewayLocationsStatics.importPrefix}/`;

export const ruleGatewayDependencyDeclaredBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Require a "#gateway/<folder>/..." specifier to be mapped by the importing package\'s own "imports" field, and its resolved target package to be a declared dependency.',
      },
      messages: {
        unmappedSpecifier:
          '"{{specifier}}" is not mapped by the "imports" field of {{packageJsonPath}}. Add "#gateway/{{folder}}/*": "{{scope}}/{{folder}}/*".',
        missingDependency:
          '{{packageJsonPath}} must list "{{targetPackage}}" in {{location}}, because this file imports "{{specifier}}".',
      },
      schema: [],
    },
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;

    if (filename.length === 0) {
      return {};
    }

    return {
      'ImportDeclaration, ExportNamedDeclaration, ExportAllDeclaration, ImportExpression': (
        node:
          | TSESTree.ImportDeclaration
          | TSESTree.ExportNamedDeclaration
          | TSESTree.ExportAllDeclaration
          | TSESTree.ImportExpression,
      ): void => {
        const importSource =
          node.source?.type === AST_NODE_TYPES.Literal ? node.source.value : undefined;

        if (typeof importSource !== 'string' || !importSource.startsWith(gatewaySpecifierPrefix)) {
          return;
        }

        validateGatewaySpecifierLayerBroker({
          node,
          context: ctx,
          filename,
          specifier: importPathContract.parse(importSource),
        });
      },

      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;
        const args = node.arguments;
        const [firstArg] = args;

        const isRequireCall =
          callee.type === AST_NODE_TYPES.Identifier && callee.name === 'require';
        const isRequireResolveCall =
          callee.type === AST_NODE_TYPES.MemberExpression &&
          callee.object.type === AST_NODE_TYPES.Identifier &&
          callee.object.name === 'require' &&
          callee.property.type === AST_NODE_TYPES.Identifier &&
          callee.property.name === 'resolve';

        if (!isRequireCall && !isRequireResolveCall) {
          return;
        }

        const importSource = firstArg?.type === AST_NODE_TYPES.Literal ? firstArg.value : undefined;

        if (typeof importSource !== 'string' || !importSource.startsWith(gatewaySpecifierPrefix)) {
          return;
        }

        validateGatewaySpecifierLayerBroker({
          node,
          context: ctx,
          filename,
          specifier: importPathContract.parse(importSource),
        });
      },
    };
  },
});
