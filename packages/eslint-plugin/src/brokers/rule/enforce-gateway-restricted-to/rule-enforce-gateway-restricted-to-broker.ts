/**
 * PURPOSE: Fails an import of a gateway subpath (or, when an entry names one, a specific export of
 * it) from any package outside the `gateway.restrictedTo` key's own `packages` list in
 * `.dungeonmaster.json` — the mechanism this epic uses to confine a gateway export (such as
 * `spawnStreamJson`) to the one package that should call it, as bugs arise, without hard-coding the
 * restriction into the gateway's own source. No allow-list: any package may use any gateway export
 * unless a `restrictedTo` entry says otherwise. `configDungeonmasterBroker` reads `.dungeonmaster.json`
 * once when `eslint.config.js` loads and passes the parsed `restrictedTo` list in as a rule OPTION, so
 * this rule itself never reads a file — which is what keeps it `'pre-edit'` eligible.
 * gatewayCallerPackageNameTransformer learns which package the linted file belongs to by reading its
 * OWN path (the `packages/<name>` segment), never by reading that package's package.json — the same
 * "file being edited only" constraint the config option already satisfies.
 *
 * USAGE:
 * const rule = ruleEnforceGatewayRestrictedToBroker();
 * // Registered with options: [{restrictedTo: [{subpath: '#gateway/bin/spawn', packages: ['@dungeonmaster/orchestrator'], reason: '...'}]}]
 * // Flags `import { spawn } from '#gateway/bin/spawn'` from any package other than orchestrator
 */
import { gatewayLintConfigContract } from '@dungeonmaster/shared/contracts';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { gatewayCallerPackageNameTransformer } from '../../../transformers/gateway-caller-package-name/gateway-caller-package-name-transformer';

export const ruleEnforceGatewayRestrictedToBroker = (): TSESLint.RuleModule<
  'restrictedSubpath' | 'restrictedExport'
> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Confine a gateway subpath (or one named export of it) to the packages listed under gateway.restrictedTo in .dungeonmaster.json.',
    },
    messages: {
      restrictedSubpath:
        '"{{subpath}}" is restricted to {{packages}} — this file is in the "{{ownPackage}}" package. {{reason}}',
      restrictedExport:
        '"{{name}}" from "{{subpath}}" is restricted to {{packages}} — this file is in the "{{ownPackage}}" package. {{reason}}',
    },
    schema: [{ type: 'object' }],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const [rawOptions] = ctx.options;
    const { restrictedTo } = gatewayLintConfigContract.parse(
      typeof rawOptions === 'object' && rawOptions !== null ? rawOptions : {},
    );

    if (!restrictedTo || restrictedTo.length === 0) {
      return {};
    }

    const { filename } = ctx;
    if (filename.length === 0) {
      return {};
    }

    const ownPackage = gatewayCallerPackageNameTransformer({ filename });
    if (ownPackage === undefined) {
      return {};
    }

    return {
      ImportDeclaration: (node: TSESTree.ImportDeclaration): void => {
        const importSource = node.source.value;
        if (typeof importSource !== 'string') {
          return;
        }

        const matchingEntries = restrictedTo.filter((entry) => entry.subpath === importSource);
        if (matchingEntries.length === 0) {
          return;
        }

        for (const entry of matchingEntries) {
          const isAllowed = entry.packages.some(
            (allowed) => allowed.split('/').pop() === ownPackage,
          );

          if (isAllowed) {
            continue;
          }

          if (entry.name === undefined) {
            ctx.report({
              node,
              messageId: 'restrictedSubpath',
              data: {
                subpath: entry.subpath,
                packages: entry.packages.join(', '),
                ownPackage,
                reason: entry.reason,
              },
            });
            continue;
          }

          const hasNamedImport = node.specifiers.some(
            (specifier) =>
              specifier.type === AST_NODE_TYPES.ImportSpecifier &&
              String(
                specifier.imported.type === AST_NODE_TYPES.Identifier
                  ? specifier.imported.name
                  : undefined,
              ) === String(entry.name),
          );

          if (!hasNamedImport) {
            continue;
          }

          ctx.report({
            node,
            messageId: 'restrictedExport',
            data: {
              name: entry.name,
              subpath: entry.subpath,
              packages: entry.packages.join(', '),
              ownPackage,
              reason: entry.reason,
            },
          });
        }
      },
    };
  },
});
