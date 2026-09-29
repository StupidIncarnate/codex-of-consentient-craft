/**
 * PURPOSE: Inside a gateway file (`packages/@gateway/{npm,node,browser,bin}/src/**`), flags any import,
 * export-from, `require()` or `require.resolve()` whose source is one of OUR OWN workspace
 * packages, EXCEPT another gateway package (or a subpath of one). A relative import stays untouched
 * — that is a file inside the same gateway package — and an outside npm package or Node built-in is
 * exactly what a gateway file exists to hold. The gateway is the bottom layer: it may depend on
 * itself and on the outside world, never back up into a package built on top of it. `scope`
 * defaults to the value repoScopeResolveBroker reads from the repo root package.json at
 * module load, overridable per-rule-instance via the `scope` option so a RuleTester case can prove
 * the rule for a differently-scoped consumer without touching the filesystem. The gateway-package
 * check is duplicated across both AST listeners, the same way raw-import-ban duplicates its own
 * relative/workspace checks — a shared named helper here would be a nested (or non-exported,
 * top-level) function, which `@dungeonmaster/forbid-non-exported-functions` refuses.
 *
 * `@<scope>/testing` (and its subpaths, e.g. `@<scope>/testing/register-mock`) is a second,
 * file-suffix-gated exception: allowed only from `.proxy.ts`, `.test.ts`, `.integration.test.ts` and
 * `.stub.ts` files. Test support is not a runtime layer, so a gateway's runtime files (`index.ts`,
 * plain wrappers) still may not import it — only the boundary those wrappers get tested through.
 *
 * USAGE:
 * const rule = ruleGatewayImportBoundaryBroker();
 * // Returns an RuleModule that flags `import {x} from '@dungeonmaster/shared/contracts'` inside
 * // packages/@gateway/node/src/**, but allows `import {y} from '@dungeonmaster/npm/glob'` (or the
 * // '#gateway/npm/glob' import-alias form) there
 */
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { gatewayTestSupportSuffixStatics } from '../../../statics/gateway-test-support-suffix/gateway-test-support-suffix-statics';
import type { PackageName } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { minimatch } from '#gateway/npm/minimatch';
import { repoScopeResolveBroker } from '../../repo-scope/resolve/repo-scope-resolve-broker';

// Resolved lazily, on the first gateway file linted with no `scope` option, and cached from then
// on — see raw-import-ban's identically-shaped cache for why this never runs during this rule's own
// unit test (every RuleTester case passes `scope` explicitly).
const defaultScopeCache: { value?: PackageName } = {};

export const ruleGatewayImportBoundaryBroker =
  (): TSESLint.RuleModule<'workspacePackageImport'> => ({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban a gateway file from importing our own workspace packages, other than another gateway package.',
      },
      messages: {
        workspacePackageImport:
          'Gateway files cannot import our own workspace packages ("{{importSource}}"). The gateway is the bottom layer — move logic that needs it out of the gateway into a broker that calls the gateway. "{{scope}}/testing" is the one exception, and only from .proxy.ts, .test.ts, .integration.test.ts and .stub.ts files: test support is not a runtime layer, so a runtime gateway file still may not import it.',
      },
      schema: [
        {
          type: 'object',
          properties: {
            scope: {
              type: 'string',
              description:
                'Override the workspace `@scope` used to tell a gateway package from any other workspace package. Defaults to the scope read from the repo root package.json at rule module load.',
            },
          },
          additionalProperties: false,
        },
      ],
    },
    defaultOptions: [],
    create: (context: TSESLint.RuleContext<string, unknown[]>) => {
      const ctx = context as TSESLint.RuleContext<string, unknown[]> & {
        options?: { scope?: PackageName }[];
      };
      const { filename } = ctx;

      const isGatewayFile = gatewayLocationsStatics.packageGlobs.some((glob) =>
        minimatch(filename, `**/${glob}`, { dot: true }),
      );

      if (filename.length === 0 || !isGatewayFile) {
        return {};
      }

      const optionScope = ctx.options[0]?.scope;

      const scope = ((): PackageName => {
        if (optionScope !== undefined) {
          return optionScope;
        }

        if (defaultScopeCache.value === undefined) {
          defaultScopeCache.value = repoScopeResolveBroker({
            startDir: filePathContract.parse(__dirname),
          });
        }

        return defaultScopeCache.value;
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

          const isRelative = importSource.startsWith('.') || importSource.startsWith('/');
          const isWorkspacePackage =
            importSource === scope ||
            importSource.startsWith(`${scope}/`) ||
            importSource === gatewayLocationsStatics.importPrefix ||
            importSource.startsWith(`${gatewayLocationsStatics.importPrefix}/`);

          if (isRelative || !isWorkspacePackage) {
            return;
          }

          // A gateway package is reachable through the repo's own `@scope/<folder>` name AND the
          // `#gateway/<folder>` import-alias form (gatewayLocationsStatics.importPrefix) every
          // consumer repo resolves identically — either one names another gateway package, never a
          // different workspace package, so both count the same way here.
          const isGatewayPackage = Object.values(gatewayLocationsStatics.folders).some((folder) => {
            const gatewayPackageName = `${scope}/${folder}`;
            const gatewayAliasPackageName = `${gatewayLocationsStatics.importPrefix}/${folder}`;
            return (
              importSource === gatewayPackageName ||
              importSource.startsWith(`${gatewayPackageName}/`) ||
              importSource === gatewayAliasPackageName ||
              importSource.startsWith(`${gatewayAliasPackageName}/`)
            );
          });

          if (isGatewayPackage) {
            return;
          }

          const testingPackageName = `${scope}/testing`;
          const isTestingPackage =
            importSource === testingPackageName ||
            importSource.startsWith(`${testingPackageName}/`);
          const isTestSupportFile = gatewayTestSupportSuffixStatics.suffixes.some((suffix) =>
            filename.endsWith(suffix),
          );

          if (isTestingPackage && isTestSupportFile) {
            return;
          }

          ctx.report({
            node,
            messageId: 'workspacePackageImport',
            data: { importSource, scope },
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

          const importSource =
            firstArg?.type === AST_NODE_TYPES.Literal ? firstArg.value : undefined;

          if (typeof importSource !== 'string') {
            return;
          }

          const isRelative = importSource.startsWith('.') || importSource.startsWith('/');
          const isWorkspacePackage =
            importSource === scope ||
            importSource.startsWith(`${scope}/`) ||
            importSource === gatewayLocationsStatics.importPrefix ||
            importSource.startsWith(`${gatewayLocationsStatics.importPrefix}/`);

          if (isRelative || !isWorkspacePackage) {
            return;
          }

          // A gateway package is reachable through the repo's own `@scope/<folder>` name AND the
          // `#gateway/<folder>` import-alias form (gatewayLocationsStatics.importPrefix) every
          // consumer repo resolves identically — either one names another gateway package, never a
          // different workspace package, so both count the same way here.
          const isGatewayPackage = Object.values(gatewayLocationsStatics.folders).some((folder) => {
            const gatewayPackageName = `${scope}/${folder}`;
            const gatewayAliasPackageName = `${gatewayLocationsStatics.importPrefix}/${folder}`;
            return (
              importSource === gatewayPackageName ||
              importSource.startsWith(`${gatewayPackageName}/`) ||
              importSource === gatewayAliasPackageName ||
              importSource.startsWith(`${gatewayAliasPackageName}/`)
            );
          });

          if (isGatewayPackage) {
            return;
          }

          const testingPackageName = `${scope}/testing`;
          const isTestingPackage =
            importSource === testingPackageName ||
            importSource.startsWith(`${testingPackageName}/`);
          const isTestSupportFile = gatewayTestSupportSuffixStatics.suffixes.some((suffix) =>
            filename.endsWith(suffix),
          );

          if (isTestingPackage && isTestSupportFile) {
            return;
          }

          ctx.report({
            node,
            messageId: 'workspacePackageImport',
            data: { importSource, scope },
          });
        },
      };
    },
  });
