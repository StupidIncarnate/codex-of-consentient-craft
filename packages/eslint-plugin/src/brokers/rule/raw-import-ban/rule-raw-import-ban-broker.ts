/**
 * PURPOSE: Bans a raw import/export/require/require.resolve of a non-workspace package (an npm
 * package or a Node built-in, `node:`-prefixed or bare) in any file outside the gateway packages
 * (`@<scope>/npm`, `@<scope>/node`, `@<scope>/browser`, `@<scope>/bin`). Value imports and
 * `import type` are both flagged — the gateway is the one path to an outside package, whatever
 * carries the specifier. `scope` defaults to the value resolveRepoScopeLayerBroker reads from the
 * repo root package.json at module load, and can be overridden per-rule-instance via the `scope`
 * option — the override exists so a RuleTester case can prove the rule works for a consumer repo
 * scoped differently than this one, without touching the filesystem.
 *
 * USAGE:
 * const rule = ruleRawImportBanBroker();
 * // Returns an EslintRule that flags `import fs from 'fs'` outside packages/node/src/**, etc.,
 * // naming the exact gateway replacement in the report message
 */
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { gatewayPathFromImportSourceTransformer } from '@dungeonmaster/shared/transformers';
import { importPathContract, filePathContract } from '@dungeonmaster/shared/contracts';
import type { PackageName } from '@dungeonmaster/shared/contracts';
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { minimatchMatchAdapter } from '../../../adapters/minimatch/match/minimatch-match-adapter';
import { resolveRepoScopeLayerBroker } from './resolve-repo-scope-layer-broker';

// Resolved lazily, on the first file linted with no `scope` option, and cached from then on.
// Every RuleTester case passes `scope` explicitly, so this real filesystem walk never runs
// during this rule's own unit test — only a real ESLint run (or a consumer with no override)
// ever exercises it. Held in an object, never a bare `let … = undefined`, so ESLint's own
// `no-undef-init` autofix (which strips an explicit `= undefined`) and `init-declarations`
// (which demands one) stop fighting each other over this declaration.
const defaultScopeCache: { value?: PackageName } = {};

export const ruleRawImportBanBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban raw imports, exports, require() and require.resolve() of non-workspace packages outside the gateway packages.',
      },
      messages: {
        rawImport:
          'Import "{{importSource}}" through the gateway: "{{gatewayPath}}". If that subpath does not export what you need, add a wrapper there; never import the raw package.',
      },
      schema: [
        {
          type: 'object',
          properties: {
            scope: {
              type: 'string',
              description:
                'Override the workspace `@scope` used to allow workspace imports and build gateway paths. Defaults to the scope read from the repo root package.json at rule module load.',
            },
          },
          additionalProperties: false,
        },
      ],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context as EslintContext & { options?: { scope?: PackageName }[] };
    const filename = ctx.filename ?? ctx.getFilename?.() ?? '';

    const isGatewayFile = gatewayLocationsStatics.packageGlobs.some((glob) =>
      minimatchMatchAdapter({ filePath: filename, pattern: `**/${glob}` }),
    );

    if (filename.length === 0 || isGatewayFile) {
      return {};
    }

    const optionScope = ctx.options?.[0]?.scope;

    const scope = ((): PackageName => {
      if (optionScope !== undefined) {
        return optionScope;
      }

      if (defaultScopeCache.value === undefined) {
        defaultScopeCache.value = resolveRepoScopeLayerBroker({
          startDir: filePathContract.parse(__dirname),
        });
      }

      return defaultScopeCache.value;
    })();

    return {
      'ImportDeclaration, ExportNamedDeclaration, ExportAllDeclaration, ImportExpression': (
        node: Tsestree,
      ): void => {
        const importSource = node.source?.value;

        if (typeof importSource !== 'string') {
          return;
        }

        const isRelative = importSource.startsWith('.') || importSource.startsWith('/');
        const isWorkspacePackage = importSource === scope || importSource.startsWith(`${scope}/`);

        if (isRelative || isWorkspacePackage) {
          return;
        }

        const gatewayPath = gatewayPathFromImportSourceTransformer({
          importSource: importPathContract.parse(importSource),
          scope,
        });

        ctx.report({
          node,
          messageId: 'rawImport',
          data: { importSource, gatewayPath: String(gatewayPath) },
        });
      },

      CallExpression: (node: Tsestree): void => {
        const { callee } = node;
        const args = node.arguments ?? [];
        const [firstArg] = args;

        const isRequireCall = callee?.type === 'Identifier' && callee.name === 'require';
        const isRequireResolveCall =
          callee?.type === 'MemberExpression' &&
          callee.object?.type === 'Identifier' &&
          callee.object.name === 'require' &&
          callee.property?.type === 'Identifier' &&
          callee.property.name === 'resolve';

        if (!isRequireCall && !isRequireResolveCall) {
          return;
        }

        const importSource = firstArg?.type === 'Literal' ? firstArg.value : undefined;

        if (typeof importSource !== 'string') {
          return;
        }

        const isRelative = importSource.startsWith('.') || importSource.startsWith('/');
        const isWorkspacePackage = importSource === scope || importSource.startsWith(`${scope}/`);

        if (isRelative || isWorkspacePackage) {
          return;
        }

        const gatewayPath = gatewayPathFromImportSourceTransformer({
          importSource: importPathContract.parse(importSource),
          scope,
        });

        ctx.report({
          node,
          messageId: 'rawImport',
          data: { importSource, gatewayPath: String(gatewayPath) },
        });
      },
    };
  },
});
