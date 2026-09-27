/**
 * PURPOSE: Checks every `subpath`, banned `name`, and `restrictedTo` `packages` entry in
 * `.dungeonmaster.json`'s `gateway` key against the REAL gateway and the REAL workspace package list —
 * so an upstream rename (a gateway subpath moved, a wrapper's export renamed, a package deleted) fails
 * lint instead of silently banning or restricting nothing. Unlike ban-gateway-export and
 * enforce-gateway-restricted-to, this rule reads OTHER files (the gateway's own source, the workspace
 * root's package.json) rather than only the file being edited, so it is NOT `'pre-edit'`-eligible — see
 * dungeonmasterRuleEnforceOnStatics. The config it checks is a single repo-wide value, not a per-file
 * one, so it self-gates on ONE anchor file — dungeonmaster-config-contract.ts, the schema owner of the
 * `gateway` key it validates — rather than running (and reporting the same thing) on every linted file.
 *
 * USAGE:
 * const rule = ruleEnforceGatewayConfigNamesExistBroker();
 * // Registered at 'error' with the SAME gateway lint config option the other two gateway rules take;
 * // only reports while linting dungeonmaster-config-contract.ts
 */
import { filePathContract, gatewayLintConfigContract } from '@dungeonmaster/shared/contracts';
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import { workspaceRootFindBroker } from '../../workspace-root/find/workspace-root-find-broker';
import { checkGatewaySubpathExistsLayerBroker } from './check-gateway-subpath-exists-layer-broker';
import { checkGatewayExportNameExistsLayerBroker } from './check-gateway-export-name-exists-layer-broker';

const ANCHOR_FILE_SUFFIX =
  'packages/config/src/contracts/dungeonmaster-config/dungeonmaster-config-contract.ts';

export const ruleEnforceGatewayConfigNamesExistBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          "Check every gateway.bannedExports/restrictedTo subpath, name, and package in .dungeonmaster.json against the gateway's real exports and the real workspace package list.",
      },
      messages: {
        unknownSubpath: '"{{subpath}}" is not a real gateway subpath.',
        unknownName: '"{{name}}" is not a real export of "{{subpath}}".',
        unknownPackage:
          '"{{packageName}}" (named in restrictedTo for "{{subpath}}") is not a real workspace package.',
      },
      schema: [{ type: 'object' }],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ?? ctx.getFilename?.() ?? '';

    if (!filename.endsWith(ANCHOR_FILE_SUFFIX)) {
      return {};
    }

    const rawOptions = ctx.options?.[0];
    const { bannedExports, restrictedTo } = gatewayLintConfigContract.parse(
      typeof rawOptions === 'object' && rawOptions !== null ? rawOptions : {},
    );

    if ((bannedExports?.length ?? 0) === 0 && (restrictedTo?.length ?? 0) === 0) {
      return {};
    }

    return {
      Program: (node: Tsestree): void => {
        const workspaceRoot = workspaceRootFindBroker({
          startDir: pathDirnameAdapter({ filePath: filePathContract.parse(filename) }),
        });

        if (workspaceRoot === undefined) {
          return;
        }

        const { rootDir, packageNames } = workspaceRoot;

        for (const entry of bannedExports ?? []) {
          const barrelPath = checkGatewaySubpathExistsLayerBroker({
            rootDir,
            subpath: entry.subpath,
          });

          if (barrelPath === undefined) {
            ctx.report({ node, messageId: 'unknownSubpath', data: { subpath: entry.subpath } });
            continue;
          }

          if (!checkGatewayExportNameExistsLayerBroker({ barrelPath, name: entry.name })) {
            ctx.report({
              node,
              messageId: 'unknownName',
              data: { name: entry.name, subpath: entry.subpath },
            });
          }
        }

        for (const entry of restrictedTo ?? []) {
          const barrelPath = checkGatewaySubpathExistsLayerBroker({
            rootDir,
            subpath: entry.subpath,
          });

          if (barrelPath === undefined) {
            ctx.report({ node, messageId: 'unknownSubpath', data: { subpath: entry.subpath } });
          } else if (
            entry.name !== undefined &&
            !checkGatewayExportNameExistsLayerBroker({ barrelPath, name: entry.name })
          ) {
            ctx.report({
              node,
              messageId: 'unknownName',
              data: { name: entry.name, subpath: entry.subpath },
            });
          }

          for (const packageName of entry.packages) {
            if (!packageNames.includes(packageName)) {
              ctx.report({
                node,
                messageId: 'unknownPackage',
                data: { packageName, subpath: entry.subpath },
              });
            }
          }
        }
      },
    };
  },
});
