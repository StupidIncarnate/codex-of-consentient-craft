/**
 * PURPOSE: Enforces BR C9 inside a gateway file (`packages/@gateway/{npm,node,browser,bin}/src/**`)
 * only: a bare `z.custom<T>()` with no check function is refused (it infers the type but checks
 * NOTHING at runtime); a gateway schema's `.brand<'…'>()` text must read `#Gateway` plus the exact
 * type name the schema checks, derived from the `z.instanceof`/`z.custom<T>` receiver rather than
 * picked freely; and no two gateway modules may export a same-named `interface`/`type` alias, since
 * one brand text (`#Gateway<Type>`) has to mean one check. The third check reads the real gateway
 * tree off disk (via workspaceRootFindBroker + build-gateway-type-declaration-index-layer-broker),
 * so — like enforce-gateway-config-names-exist — this is NOT `'pre-edit'`-eligible; unlike that
 * rule it has no single anchor file to self-gate on, so it runs once per exported type declaration
 * it visits rather than once per lint pass. The brand-text derivation is delegated to
 * check-schema-brand-text-layer-broker so this file's own `create()` stays a plain dispatch table.
 *
 * USAGE:
 * const rule = ruleGatewaySchemaBrandBroker();
 * // Flags `z.custom<WalkedFile>()` (no check) as bareCustomSchema;
 * // flags `z.instanceof(ChildProcess).brand<'#GatewayWrong'>()` as wrongBrandText;
 * // flags a second gateway file exporting `interface WalkedFile` as duplicateTypeName
 */
import { dirname } from '#gateway/node/path';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isGatewayFileGuard } from '../../../guards/is-gateway-file/is-gateway-file-guard';
import { dotCountTransformer } from '../../../transformers/dot-count/dot-count-transformer';
import { workspaceRootFindBroker } from '../../workspace-root/find/workspace-root-find-broker';
import { checkSchemaBrandTextLayerBroker } from './check-schema-brand-text-layer-broker';
import { buildGatewayTypeDeclarationIndexLayerBroker } from './build-gateway-type-declaration-index-layer-broker';

export const ruleGatewaySchemaBrandBroker = (): TSESLint.RuleModule<
  'bareCustomSchema' | 'wrongBrandText' | 'duplicateTypeName'
> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        "Enforce BR C9 in the gateway: no bare z.custom<T>() with no check, a schema's .brand<'…'>() text must be #Gateway plus the type name it checks, and no two gateway modules export a same-named type.",
    },
    messages: {
      bareCustomSchema:
        'z.custom<{{typeName}}>() has no check function, so it accepts a missing field or any junk at runtime. Pass a check: z.custom<{{typeName}}>((value) => is{{typeName}}(value)).',
      wrongBrandText:
        'Brand text "{{brandText}}" does not match "{{expectedBrandText}}" — the brand is #Gateway plus the exact type name this schema checks, derived, not chosen.',
      duplicateTypeName:
        '"{{name}}" is also declared in {{otherFile}}. A type name must be unique across the four gateway packages, so one brand text (#Gateway{{name}}) always means one check.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;

    if (filename.length === 0 || !isGatewayFileGuard({ filename })) {
      return {};
    }

    const fileBaseName = filename.split('/').pop() ?? '';
    const dotCount = dotCountTransformer({ str: fileBaseName });

    // A test/proxy/stub/.d.ts companion never declares its own schema or its own type — the
    // implementation file beside it already does, and that is the file this rule checks.
    if (dotCount > 1) {
      return {};
    }

    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;
        const objectName =
          callee.type === AST_NODE_TYPES.MemberExpression &&
          callee.object.type === AST_NODE_TYPES.Identifier
            ? callee.object.name
            : undefined;
        const propertyName =
          callee.type === AST_NODE_TYPES.MemberExpression &&
          callee.property.type === AST_NODE_TYPES.Identifier
            ? callee.property.name
            : undefined;

        if (objectName === 'z' && propertyName === 'custom') {
          const args = node.arguments;
          const hasCheckFunction = args.some(
            (arg) =>
              arg.type === AST_NODE_TYPES.ArrowFunctionExpression ||
              arg.type === AST_NODE_TYPES.FunctionExpression ||
              arg.type === AST_NODE_TYPES.Identifier,
          );

          if (!hasCheckFunction) {
            const typeArgs = node.typeArguments;
            const firstParam = typeArgs?.params[0];
            const typeName =
              firstParam?.type === AST_NODE_TYPES.TSTypeReference &&
              firstParam.typeName.type === AST_NODE_TYPES.Identifier
                ? firstParam.typeName.name
                : 'T';

            ctx.report({ node, messageId: 'bareCustomSchema', data: { typeName } });
          }
        }

        if (propertyName === 'brand') {
          checkSchemaBrandTextLayerBroker({ node, context: ctx });
        }
      },

      ExportNamedDeclaration: (node: TSESTree.ExportNamedDeclaration): void => {
        const { declaration } = node;

        if (
          declaration?.type !== AST_NODE_TYPES.TSInterfaceDeclaration &&
          declaration?.type !== AST_NODE_TYPES.TSTypeAliasDeclaration
        ) {
          return;
        }

        const { name } = declaration.id;

        const workspaceRoot = workspaceRootFindBroker({
          startDir: dirname(filename),
        });

        if (workspaceRoot === undefined) {
          return;
        }

        const index = buildGatewayTypeDeclarationIndexLayerBroker({
          rootDir: workspaceRoot.rootDir,
        });
        const declaringFiles = index.get(name) ?? [];
        const otherFile = declaringFiles.find((filePath) => filePath !== filename);

        if (otherFile !== undefined) {
          ctx.report({
            node,
            messageId: 'duplicateTypeName',
            data: { name, otherFile },
          });
        }
      },
    };
  },
});
