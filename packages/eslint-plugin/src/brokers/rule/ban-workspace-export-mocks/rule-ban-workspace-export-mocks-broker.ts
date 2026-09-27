/**
 * PURPOSE: Refuses `registerMock({ fn: SomePackage.someExport })` or `registerModuleMock({ module:
 * '<workspace-package>', factory })` where the mocked package is ANOTHER workspace package's own —
 * never the file's own — so a caller composes that package's own shipped proxy
 * (`startOrchestratorProxy`, or equivalent) instead of inventing a raw mock that can drift from what
 * the real export actually does. The workspace package name list is a rule OPTION —
 * `configWorkspacePackageNamesBroker` builds it once, when `eslint.config.js` loads, by resolving the
 * workspaces ROOT's own `workspaces` globs to every member's OWN package.json `name` field — so this
 * rule itself reads no file at lint time and can run `'pre-edit'`. "The file's own package" is derived
 * from the linted file's OWN path (`gatewayCallerPackageNameTransformer`, pure — no file read),
 * compared against the imported package's UNSCOPED name; a workspace member's own `.proxy.ts` mocking
 * its own package is therefore never flagged, whatever other package's proxy it also composes beside
 * it.
 *
 * USAGE:
 * const rule = ruleBanWorkspaceExportMocksBroker();
 * // Registered with options: [{ workspacePackageNames: ['@dungeonmaster/orchestrator', ...] }]
 * // Flags `registerMock({ fn: StartOrchestrator.getQuest })` in a `server` or `mcp` file, where
 * // `StartOrchestrator` is imported (any subpath) from '@dungeonmaster/orchestrator'
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { astGetImportsTransformer } from '../../../transformers/ast-get-imports/ast-get-imports-transformer';
import { gatewayCallerPackageNameTransformer } from '../../../transformers/gateway-caller-package-name/gateway-caller-package-name-transformer';
import type { Identifier, ModulePath, PackageName } from '@dungeonmaster/shared/contracts';

export const ruleBanWorkspaceExportMocksBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          "Ban registerMock/registerModuleMock of another workspace package's export. Compose that package's own shipped proxy instead.",
      },
      messages: {
        composeProxy:
          '"{{name}}" comes from workspace package "{{specifier}}". Compose that package\'s own proxy instead of mocking it directly with {{mockFunction}}.',
      },
      schema: [{ type: 'object' }],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context as EslintContext & {
      options?: { workspacePackageNames?: PackageName[] }[];
    };
    const workspacePackageNames = ctx.options?.[0]?.workspacePackageNames ?? [];

    if (workspacePackageNames.length === 0) {
      return {};
    }

    const filename = ctx.filename ?? ctx.getFilename?.() ?? '';
    const ownPackageFolder = gatewayCallerPackageNameTransformer({ filename });

    const imports = new Map<Identifier, ModulePath>();

    return {
      ImportDeclaration: (node: Tsestree): void => {
        for (const [name, importPath] of astGetImportsTransformer({ node })) {
          imports.set(name, importPath);
        }
      },

      CallExpression: (node: Tsestree): void => {
        const { callee } = node;
        if (callee?.type !== 'Identifier') {
          return;
        }

        const mockFunction = callee.name;
        const isRegisterMock = mockFunction === 'registerMock';
        const isRegisterModuleMock = mockFunction === 'registerModuleMock';

        if (!isRegisterMock && !isRegisterModuleMock) {
          return;
        }

        const [firstArg] = node.arguments ?? [];
        if (firstArg?.type !== 'ObjectExpression') {
          return;
        }

        for (const prop of firstArg.properties ?? []) {
          if (prop.type !== 'Property' || prop.key?.type !== 'Identifier') {
            continue;
          }

          if (isRegisterMock && prop.key.name === 'fn') {
            // Property.value overlaps with Literal.value (typed `unknown`) in the shared Tsestree
            // contract, so the property-value side needs an explicit cast to the Node shape —
            // the same cast check-discriminated-union-variants-layer-broker already applies.
            let current = prop.value as Tsestree | undefined;
            while (current?.type === 'MemberExpression') {
              current = current.object as Tsestree | undefined;
            }
            if (current?.type !== 'Identifier' || current.name === undefined) {
              continue;
            }

            const importedFrom = imports.get(current.name);
            if (importedFrom === undefined) {
              continue;
            }

            const workspacePackage = workspacePackageNames.find(
              (pkg) =>
                String(importedFrom) === String(pkg) ||
                String(importedFrom).startsWith(`${String(pkg)}/`),
            );
            if (workspacePackage === undefined) {
              continue;
            }

            if (workspacePackage.split('/').pop() === ownPackageFolder) {
              continue;
            }

            ctx.report({
              node: prop,
              messageId: 'composeProxy',
              data: { name: current.name, specifier: workspacePackage, mockFunction },
            });
          }

          const propValue = prop.value as Tsestree | undefined;

          if (
            isRegisterModuleMock &&
            prop.key.name === 'module' &&
            propValue?.type === 'Literal' &&
            typeof propValue.value === 'string'
          ) {
            const moduleSpecifier = propValue.value;

            const workspacePackage = workspacePackageNames.find(
              (pkg) => moduleSpecifier === pkg || moduleSpecifier.startsWith(`${pkg}/`),
            );
            if (workspacePackage === undefined) {
              continue;
            }

            if (workspacePackage.split('/').pop() === ownPackageFolder) {
              continue;
            }

            ctx.report({
              node: prop,
              messageId: 'composeProxy',
              data: { name: moduleSpecifier, specifier: workspacePackage, mockFunction },
            });
          }
        }
      },
    };
  },
});
