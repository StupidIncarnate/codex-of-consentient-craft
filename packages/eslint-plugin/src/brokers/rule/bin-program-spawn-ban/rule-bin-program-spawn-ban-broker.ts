/**
 * PURPOSE: Bans a direct spawn of a program that has a home in `@<scope>/bin` (`git`, `npm`,
 * `claude`, `cp`, `lsof`, `kill`) from anywhere outside the gateway packages. Reads the spawned
 * command off a `@<scope>/node/child_process` gateway call's `command` property, or off a raw
 * `child_process` call's first argument — the raw shape is checked too, independent of whether
 * `raw-import-ban` is even enabled, per the design doc. Command resolution is intentionally narrow:
 * a string literal, a template literal's static leading text, a `sh -c '<script>'` string (combined
 * or split across `command`/`args`), and a same-module `const` or `const` object property. Anything
 * else — a runtime value, an imported statics object's property, `process.execPath` — is NOT
 * resolved, and the call is silently allowed, matching the doc's own "commands built at runtime are
 * allowed" rule: this rule fails OPEN, never reporting "cannot determine command".
 *
 * USAGE:
 * const rule = ruleBinProgramSpawnBanBroker();
 * // Returns an EslintRule that flags spawn('git', [...]) outside packages/bin/src/**, naming
 * // currentBranch() from @<scope>/bin/git in the report message
 */
import { contentTextContract, filePathContract } from '@dungeonmaster/shared/contracts';
import type { ContentText, PackageName } from '@dungeonmaster/shared/contracts';
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isGatewayFileGuard } from '../../../guards/is-gateway-file/is-gateway-file-guard';
import { objectPropertyValueTransformer } from '../../../transformers/object-property-value/object-property-value-transformer';
import { childProcessFunctionNamesStatics } from '../../../statics/child-process-function-names/child-process-function-names-statics';
import { resolveRepoScopeLayerBroker } from './resolve-repo-scope-layer-broker';
import { reportBinProgramSpawnLayerBroker } from './report-bin-program-spawn-layer-broker';

// Resolved lazily and cached, exactly as raw-import-ban's own scope resolution is: every RuleTester
// case passes `scope` explicitly, so the real filesystem walk only ever runs for a real ESLint run.
const defaultScopeCache: { value?: PackageName } = {};

export const ruleBinProgramSpawnBanBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
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
  }),
  create: (context: EslintContext) => {
    const ctx = context as EslintContext & { options?: { scope?: PackageName }[] };
    const filename = ctx.filename ?? ctx.getFilename?.() ?? '';

    if (filename.length === 0 || isGatewayFileGuard({ filename })) {
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

    const gatewayChildProcessSource = `${scope}/node/child_process`;

    let moduleBody: Tsestree[] = [];
    const gatewayLocalNames = new Set<ContentText>();
    const rawLocalNames = new Map<ContentText, ContentText>();
    const rawNamespaceNames = new Set<ContentText>();

    return {
      Program: (node: Tsestree): void => {
        moduleBody = Array.isArray(node.body) ? node.body : [];

        for (const statement of moduleBody) {
          if (statement.type !== 'ImportDeclaration') {
            continue;
          }
          const source = statement.source?.value;
          if (typeof source !== 'string') {
            continue;
          }

          const isGatewaySource = source === gatewayChildProcessSource;
          const isRawSource = source === 'child_process' || source === 'node:child_process';
          if (!isGatewaySource && !isRawSource) {
            continue;
          }

          for (const specifier of statement.specifiers ?? []) {
            if (specifier.type === 'ImportSpecifier') {
              const importedName =
                specifier.imported?.type === 'Identifier'
                  ? contentTextContract.parse(String(specifier.imported.name))
                  : undefined;
              const localName =
                specifier.local?.type === 'Identifier'
                  ? contentTextContract.parse(String(specifier.local.name))
                  : undefined;
              if (importedName === undefined || localName === undefined) {
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

            if (specifier.type === 'ImportNamespaceSpecifier' && isRawSource) {
              const localName =
                specifier.local?.type === 'Identifier'
                  ? contentTextContract.parse(String(specifier.local.name))
                  : undefined;
              if (localName !== undefined) {
                rawNamespaceNames.add(localName);
              }
            }
          }
        }
      },

      CallExpression: (node: Tsestree): void => {
        const { callee } = node;
        const args = (node.arguments ?? []).filter(
          (argument): argument is Tsestree => argument !== null,
        );

        if (
          callee?.type === 'Identifier' &&
          callee.name !== undefined &&
          gatewayLocalNames.has(contentTextContract.parse(String(callee.name)))
        ) {
          const [optionsArg] = args;
          if (optionsArg?.type !== 'ObjectExpression') {
            return;
          }
          const properties = optionsArg.properties ?? [];
          reportBinProgramSpawnLayerBroker({
            ctx,
            node,
            commandNode: objectPropertyValueTransformer({ properties, name: 'command' }),
            argsNode: objectPropertyValueTransformer({ properties, name: 'args' }),
            moduleBody,
            scope,
          });
          return;
        }

        const rawImportedName = ((): ContentText | undefined => {
          if (callee?.type === 'Identifier' && callee.name !== undefined) {
            return rawLocalNames.get(contentTextContract.parse(String(callee.name)));
          }
          if (
            callee?.type === 'MemberExpression' &&
            !callee.computed &&
            callee.object?.type === 'Identifier' &&
            callee.object.name !== undefined &&
            rawNamespaceNames.has(contentTextContract.parse(String(callee.object.name))) &&
            callee.property?.type === 'Identifier'
          ) {
            const propertyName = contentTextContract.parse(String(callee.property.name));
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
        reportBinProgramSpawnLayerBroker({ ctx, node, commandNode, argsNode, moduleBody, scope });
      },
    };
  },
});
