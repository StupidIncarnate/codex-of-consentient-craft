/**
 * PURPOSE: Bans a raw import/export/require/require.resolve of a non-workspace package (an npm
 * package or a Node built-in, `node:`-prefixed or bare) in any file outside the gateway packages
 * (`@<scope>/npm`, `@<scope>/node`, `@<scope>/browser`, `@<scope>/bin`). The `#gateway/...` alias is
 * the one accepted way in; the scoped gateway package name (`@<scope>/node/fs`) is flagged too,
 * with the alias spelling as the fix, so two callers cannot reach the same gateway two ways. Every
 * other `@<scope>/...` workspace import is never flagged. Value imports and `import type` are both flagged — the
 * gateway is the one path to an outside package, whatever carries the specifier. `scope` defaults
 * to the scope repoScopeResolveBroker reads from the npm-workspaces root above the linted file,
 * and can be overridden per-rule-instance via the `scope` option, so a RuleTester case can name a
 * scope without touching the filesystem. Dungeonmaster's own published packages (`@dungeonmaster/shared`,
 * `@dungeonmaster/testing`, ...) are never flagged in any repo, its four gateway packages
 * excepted — see isDungeonmasterToolkitImportGuard for why. A side-effect import of a stylesheet
 * (`import '@mantine/core/styles.css';`) is never flagged: the bundler consumes it, and no gateway
 * can wrap CSS. `scope` only gates which imports count as "workspace"; the
 * suggested gateway path is always the `#gateway/...` alias text, identical in every consumer repo.
 *
 * USAGE:
 * const rule = ruleRawImportBanBroker();
 * // Returns an RuleModule that flags `import fs from 'fs'` outside packages/@gateway/node/src/**,
 * // etc., naming the exact gateway replacement in the report message
 */
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { gatewayPathFromImportSourceTransformer } from '@dungeonmaster/shared/transformers';
import { builtinModules } from '#gateway/node/module';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { minimatch } from '#gateway/npm/minimatch';
import { stylesheetExtensionStatics } from '../../../statics/stylesheet-extension/stylesheet-extension-statics';
import { isDungeonmasterToolkitImportGuard } from '../../../guards/is-dungeonmaster-toolkit-import/is-dungeonmaster-toolkit-import-guard';
import { dirname } from '#gateway/node/path';
import { repoScopeResolveBroker } from '../../repo-scope/resolve/repo-scope-resolve-broker';

// Keyed by the linted file's directory. The scope comes from the npm-workspaces root above the
// FILE being linted, never above this module: through a `file:` link this module sits inside
// dungeonmaster's checkout, so a walk from here would read dungeonmaster's scope for a consumer's
// files. A `scope` option skips the walk.
const defaultScopeCache = new Map<string, string>();

export const ruleRawImportBanBroker = (): TSESLint.RuleModule<
  'rawImport' | 'scopedGatewayImport'
> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban raw imports, exports, require() and require.resolve() of non-workspace packages outside the gateway packages.',
    },
    messages: {
      rawImport:
        'Import "{{importSource}}" through the gateway: "{{gatewayPath}}". If that subpath does not export what you need, add a wrapper there; never import the raw package.',
      scopedGatewayImport:
        'Import the gateway through its alias, "{{gatewayPath}}", not its package name "{{importSource}}".',
    },
    schema: [
      {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            description:
              'Override the workspace `@scope` used to allow workspace imports and build gateway paths. Defaults to the scope of the npm-workspaces root above the linted file.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context as TSESLint.RuleContext<string, unknown[]> & {
      options?: { scope?: string }[];
    };
    const { filename } = ctx;

    const isGatewayFile = gatewayLocationsStatics.packageGlobs.some((glob) =>
      minimatch(filename, `**/${glob}`, { dot: true }),
    );

    if (filename.length === 0 || isGatewayFile) {
      return {};
    }

    const optionScope = ctx.options[0]?.scope;

    const scope = ((): string => {
      if (optionScope !== undefined) {
        return optionScope;
      }

      const fileDir = dirname(filename);
      const cachedScope = defaultScopeCache.get(fileDir);
      if (cachedScope !== undefined) {
        return cachedScope;
      }

      const resolvedScope = repoScopeResolveBroker({ startDir: fileDir });
      defaultScopeCache.set(fileDir, resolvedScope);
      return resolvedScope;
    })();

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

        if (typeof importSource !== 'string') {
          return;
        }

        // A stylesheet the bundler consumes is not code, so no gateway can wrap it. Only the
        // side-effect form is skipped: `import styles from 'x.css'` binds a value and stays flagged.
        const isSideEffectStylesheetImport =
          node.type === AST_NODE_TYPES.ImportDeclaration &&
          node.specifiers.length === 0 &&
          stylesheetExtensionStatics.extensions.some((extension) =>
            importSource.endsWith(extension),
          );

        if (isSideEffectStylesheetImport) {
          return;
        }

        const isScopedGatewayImport = Object.values(gatewayLocationsStatics.folders).some(
          (folder) =>
            importSource === `${scope}/${folder}` || importSource.startsWith(`${scope}/${folder}/`),
        );

        if (isScopedGatewayImport) {
          ctx.report({
            node,
            messageId: 'scopedGatewayImport',
            data: {
              importSource,
              gatewayPath: `${gatewayLocationsStatics.importPrefix}${importSource.slice(scope.length)}`,
            },
          });
          return;
        }

        const isRelative = importSource.startsWith('.') || importSource.startsWith('/');
        // A raw import already written as '#gateway/<folder>/...' is already going through the
        // gateway — never a "raw" import to flag.
        const isWorkspacePackage =
          importSource === scope ||
          importSource.startsWith(`${scope}/`) ||
          importSource === gatewayLocationsStatics.importPrefix ||
          importSource.startsWith(`${gatewayLocationsStatics.importPrefix}/`);

        if (
          isRelative ||
          isWorkspacePackage ||
          isDungeonmasterToolkitImportGuard({ importSource })
        ) {
          return;
        }

        const gatewayPath = gatewayPathFromImportSourceTransformer({
          importSource,
          builtinModules,
        });

        ctx.report({
          node,
          messageId: 'rawImport',
          data: { importSource, gatewayPath },
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

        if (typeof importSource !== 'string') {
          return;
        }

        const isScopedGatewayImport = Object.values(gatewayLocationsStatics.folders).some(
          (folder) =>
            importSource === `${scope}/${folder}` || importSource.startsWith(`${scope}/${folder}/`),
        );

        if (isScopedGatewayImport) {
          ctx.report({
            node,
            messageId: 'scopedGatewayImport',
            data: {
              importSource,
              gatewayPath: `${gatewayLocationsStatics.importPrefix}${importSource.slice(scope.length)}`,
            },
          });
          return;
        }

        const isRelative = importSource.startsWith('.') || importSource.startsWith('/');
        // A raw import already written as '#gateway/<folder>/...' is already going through the
        // gateway — never a "raw" import to flag.
        const isWorkspacePackage =
          importSource === scope ||
          importSource.startsWith(`${scope}/`) ||
          importSource === gatewayLocationsStatics.importPrefix ||
          importSource.startsWith(`${gatewayLocationsStatics.importPrefix}/`);

        if (
          isRelative ||
          isWorkspacePackage ||
          isDungeonmasterToolkitImportGuard({ importSource })
        ) {
          return;
        }

        const gatewayPath = gatewayPathFromImportSourceTransformer({
          importSource,
          builtinModules,
        });

        ctx.report({
          node,
          messageId: 'rawImport',
          data: { importSource, gatewayPath },
        });
      },
    };
  },
});
