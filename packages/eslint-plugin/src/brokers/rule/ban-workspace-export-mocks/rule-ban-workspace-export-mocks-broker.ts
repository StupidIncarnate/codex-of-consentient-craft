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
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { astGetImportsTransformer } from '../../../transformers/ast-get-imports/ast-get-imports-transformer';
import { gatewayCallerPackageNameTransformer } from '../../../transformers/gateway-caller-package-name/gateway-caller-package-name-transformer';
import type { PackageName } from '@dungeonmaster/shared/contracts';

export const ruleBanWorkspaceExportMocksBroker = (): TSESLint.RuleModule<'composeProxy'> => ({
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
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context as TSESLint.RuleContext<string, unknown[]> & {
      options?: { workspacePackageNames?: PackageName[] }[];
    };
    const workspacePackageNames = ctx.options[0]?.workspacePackageNames ?? [];

    if (workspacePackageNames.length === 0) {
      return {};
    }

    const { filename } = ctx;
    const ownPackageFolder = gatewayCallerPackageNameTransformer({ filename });

    const imports = new Map<string, string>();

    return {
      ImportDeclaration: (node: TSESTree.ImportDeclaration): void => {
        for (const [name, importPath] of astGetImportsTransformer({ node })) {
          imports.set(name, importPath);
        }
      },

      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;
        if (callee.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        const mockFunction = callee.name;
        const isRegisterMock = mockFunction === 'registerMock';
        const isRegisterModuleMock = mockFunction === 'registerModuleMock';

        if (!isRegisterMock && !isRegisterModuleMock) {
          return;
        }

        const [firstArg] = node.arguments;
        if (firstArg?.type !== AST_NODE_TYPES.ObjectExpression) {
          return;
        }

        for (const prop of firstArg.properties) {
          if (
            prop.type !== AST_NODE_TYPES.Property ||
            prop.key.type !== AST_NODE_TYPES.Identifier
          ) {
            continue;
          }

          if (isRegisterMock && prop.key.name === 'fn') {
            let current: TSESTree.Node = prop.value;
            while (current.type === AST_NODE_TYPES.MemberExpression) {
              current = current.object;
            }
            if (current.type !== AST_NODE_TYPES.Identifier) {
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

          const propValue = prop.value as TSESTree.Node | undefined;

          if (
            isRegisterModuleMock &&
            prop.key.name === 'module' &&
            propValue?.type === AST_NODE_TYPES.Literal &&
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
