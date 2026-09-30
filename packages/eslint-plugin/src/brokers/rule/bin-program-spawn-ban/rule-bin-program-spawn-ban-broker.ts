/**
 * PURPOSE: Bans a direct spawn of a program that has a home in `@<scope>/bin` (`git`, `npm`,
 * `claude`, `cp`, `lsof`, `kill`) from anywhere outside the gateway packages. Reads the spawned
 * command off a gateway `child_process` call's `command` property — imported as
 * `#gateway/node/child_process` (how every caller imports it) or `@<scope>/node/child_process` — or
 * off a raw `child_process` call's first argument. A raw function (`spawn`, `execSync`, …) imported
 * from the gateway subpath is read as the raw shape, since that subpath re-exports Node's module.
 * The raw shape is checked independent of whether `raw-import-ban` is even enabled, per the design
 * doc. Command resolution is intentionally narrow: a string literal, a template literal's static
 * leading text, a `sh -c '<script>'` string (combined or split across `command`/`args`), a
 * same-module `const` or `const` object property, and a property of an object imported BY NAME from
 * a RELATIVE path (the statics file is read and scanned; see `resolveImportedStaticsLayerBroker`).
 * Anything else — a runtime value, a property reached through a workspace-package or `#` import, a
 * default or namespace import, a nested statics object, `process.execPath` — is NOT resolved, and
 * the call is silently allowed, matching the doc's own "commands built at runtime are allowed"
 * rule: this rule fails OPEN, never reporting "cannot determine command". A namespace import of the
 * gateway (`import * as cp from '#gateway/node/child_process'`) is not tracked.
 *
 * USAGE:
 * const rule = ruleBinProgramSpawnBanBroker();
 * // Returns an RuleModule that flags spawn('git', [...]) outside packages/@gateway/bin/src/**,
 * // naming currentBranch() from #gateway/bin/git in the report message
 */
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText, PackageName } from '@dungeonmaster/shared/contracts';
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isGatewayFileGuard } from '../../../guards/is-gateway-file/is-gateway-file-guard';
import { objectPropertyValueTransformer } from '../../../transformers/object-property-value/object-property-value-transformer';
import { childProcessFunctionNamesStatics } from '../../../statics/child-process-function-names/child-process-function-names-statics';
import { repoScopeResolveBroker } from '../../repo-scope/resolve/repo-scope-resolve-broker';
import { reportBinProgramSpawnLayerBroker } from './report-bin-program-spawn-layer-broker';

// Resolved lazily and cached, exactly as raw-import-ban's own scope resolution is: every RuleTester
// case passes `scope` explicitly, so the real filesystem walk only ever runs for a real ESLint run.
const defaultScopeCache: { value?: PackageName } = {};

export const ruleBinProgramSpawnBanBroker = (): TSESLint.RuleModule<'binProgramSpawn'> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        "Ban a direct spawn of a program that has a home in @<scope>/bin. Use that program's own wrapper there instead.",
    },
    messages: {
      binProgramSpawn:
        'Spawning "{{program}}" directly is not allowed. Use {{binFunction}}() from "{{gatewayPath}}" instead.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            description:
              'Override the workspace `@scope` used to build the `@scope/bin/<program>` path. Defaults to the scope read from the repo root package.json at rule module load.',
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

    if (filename.length === 0 || isGatewayFileGuard({ filename })) {
      return {};
    }

    const optionScope = ctx.options[0]?.scope;
    const scope = ((): PackageName => {
      if (optionScope !== undefined) {
        return optionScope;
      }
      if (defaultScopeCache.value === undefined) {
        defaultScopeCache.value = repoScopeResolveBroker({
          startDir: __dirname,
        });
      }
      return defaultScopeCache.value;
    })();

    const scopedGatewaySource = `${scope}/${gatewayLocationsStatics.folders.node}/child_process`;
    const aliasedGatewaySource = `${gatewayLocationsStatics.importPrefix}/${gatewayLocationsStatics.folders.node}/child_process`;

    let moduleBody: readonly TSESTree.ProgramStatement[] = [];
    const gatewayLocalNames = new Set<ContentText>();
    const rawLocalNames = new Map<ContentText, ContentText>();
    const rawNamespaceNames = new Set<ContentText>();

    return {
      Program: (node: TSESTree.Program): void => {
        moduleBody = node.body;

        for (const statement of moduleBody) {
          if (statement.type !== AST_NODE_TYPES.ImportDeclaration) {
            continue;
          }
          const source = statement.source.value;

          const isGatewaySource = source === scopedGatewaySource || source === aliasedGatewaySource;
          const isNodeModuleSource = source === 'child_process' || source === 'node:child_process';
          // The gateway subpath is `export * from 'child_process'` plus its own wrappers, so its raw
          // names (`spawn`, `execSync`, …) are the raw positional shape too.
          const isRawSource = isNodeModuleSource || isGatewaySource;
          if (!isGatewaySource && !isNodeModuleSource) {
            continue;
          }

          for (const specifier of statement.specifiers) {
            if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
              const importedName =
                specifier.imported.type === AST_NODE_TYPES.Identifier
                  ? contentTextContract.parse(specifier.imported.name)
                  : undefined;
              const localName = contentTextContract.parse(specifier.local.name);
              if (importedName === undefined) {
                continue;
              }

              if (
                isGatewaySource &&
                childProcessFunctionNamesStatics.gatewayFunctionNames.some(
                  (name) => name === importedName,
                )
              ) {
                gatewayLocalNames.add(localName);
              }
              if (
                isRawSource &&
                childProcessFunctionNamesStatics.rawFunctionNames.some(
                  (name) => name === importedName,
                )
              ) {
                rawLocalNames.set(localName, importedName);
              }
            }

            if (specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier && isNodeModuleSource) {
              const localName = contentTextContract.parse(specifier.local.name);
              rawNamespaceNames.add(localName);
            }
          }
        }
      },

      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;
        const args = node.arguments.flatMap((argument) => [argument]);

        if (
          callee.type === AST_NODE_TYPES.Identifier &&
          gatewayLocalNames.has(contentTextContract.parse(callee.name))
        ) {
          const [optionsArg] = args;
          if (optionsArg?.type !== AST_NODE_TYPES.ObjectExpression) {
            return;
          }
          const { properties } = optionsArg;
          reportBinProgramSpawnLayerBroker({
            ctx,
            node,
            commandNode: objectPropertyValueTransformer({ properties, name: 'command' }),
            argsNode: objectPropertyValueTransformer({ properties, name: 'args' }),
            moduleBody,
            filename,
          });
          return;
        }

        const rawImportedName = ((): ContentText | undefined => {
          if (callee.type === AST_NODE_TYPES.Identifier) {
            return rawLocalNames.get(contentTextContract.parse(callee.name));
          }
          if (
            callee.type === AST_NODE_TYPES.MemberExpression &&
            !callee.computed &&
            callee.object.type === AST_NODE_TYPES.Identifier &&
            rawNamespaceNames.has(contentTextContract.parse(callee.object.name)) &&
            callee.property.type === AST_NODE_TYPES.Identifier
          ) {
            const propertyName = contentTextContract.parse(callee.property.name);
            return childProcessFunctionNamesStatics.rawFunctionNames.some(
              (name) => name === propertyName,
            )
              ? propertyName
              : undefined;
          }
          return undefined;
        })();

        if (rawImportedName === undefined) {
          return;
        }

        const [commandNode, secondArg] = args;
        const argsNode = childProcessFunctionNamesStatics.singleStringRawFunctionNames.some(
          (name) => name === rawImportedName,
        )
          ? undefined
          : secondArg;
        reportBinProgramSpawnLayerBroker({
          ctx,
          node,
          commandNode,
          argsNode,
          moduleBody,
          filename,
        });
      },
    };
  },
});
