/**
 * PURPOSE: Fails a named import of a gateway export the `gateway.bannedExports` key of
 * `.dungeonmaster.json` lists — the mechanism this epic uses to ban an unsafe or superseded gateway
 * export as bugs arise, without hard-coding the ban into the gateway's own source. Checks the
 * IMPORTING file, never the gateway's own barrel: a barrel's `export *` cannot selectively omit one
 * name, so the ban has to land on every caller instead. `configDungeonmasterBroker` reads
 * `.dungeonmaster.json` once when `eslint.config.js` loads and passes the parsed `bannedExports` list
 * in as a rule OPTION, so this rule itself never reads a file — which is what keeps it `'pre-edit'`
 * eligible.
 *
 * USAGE:
 * const rule = ruleBanGatewayExportBroker();
 * // Registered with options: [{bannedExports: [{subpath: '#gateway/node/fs', name: 'readFileSync', use: 'readFile', reason: '...'}]}]
 * // Flags `import { readFileSync } from '#gateway/node/fs'`
 */
import { gatewayLintConfigContract } from '@dungeonmaster/shared/contracts';
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const ruleBanGatewayExportBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban a named import of a gateway export listed under gateway.bannedExports in .dungeonmaster.json.',
      },
      messages: {
        bannedExport: '"{{name}}" from "{{subpath}}" is banned — use "{{use}}" instead. {{reason}}',
      },
      schema: [{ type: 'object' }],
    },
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const [rawOptions] = ctx.options;
    const { bannedExports } = gatewayLintConfigContract.parse(
      typeof rawOptions === 'object' && rawOptions !== null ? rawOptions : {},
    );

    if (!bannedExports || bannedExports.length === 0) {
      return {};
    }

    return {
      ImportDeclaration: (node: TSESTree.ImportDeclaration): void => {
        const importSource = node.source.value;
        if (typeof importSource !== 'string') {
          return;
        }

        const matchingEntries = bannedExports.filter((entry) => entry.subpath === importSource);
        if (matchingEntries.length === 0) {
          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.type !== AST_NODE_TYPES.ImportSpecifier) {
            continue;
          }

          const importedName =
            specifier.imported.type === AST_NODE_TYPES.Identifier
              ? specifier.imported.name
              : undefined;
          if (typeof importedName !== 'string') {
            continue;
          }

          const match = matchingEntries.find((entry) => entry.name === importedName);
          if (!match) {
            continue;
          }

          ctx.report({
            node: specifier,
            messageId: 'bannedExport',
            data: {
              name: match.name,
              subpath: match.subpath,
              use: match.use,
              reason: match.reason,
            },
          });
        }
      },
    };
  },
});
