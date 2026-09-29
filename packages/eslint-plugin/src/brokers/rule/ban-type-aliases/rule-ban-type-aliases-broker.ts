/**
 * PURPOSE: Refuses an exported type alias that only renames something already named: an alias of
 * a field's type (`export type QuestId = Quest['id']`, written `Quest['id']` where it is used) and an
 * alias that gives a library type a second name (`export type EslintContext = TSESLint.RuleContext<…>`,
 * imported from the gateway where it is used). `z.infer`, `z.input` and `z.output` of a schema are
 * how a contract names its own type, so they stay. The gateway is skipped: it exists to wrap a
 * library's types. Reads no file, so it runs pre-edit.
 *
 * USAGE:
 * const rule = ruleBanTypeAliasesBroker();
 * // Flags `export type CliSignalAction = CliSignal['action'];` and
 * // `import type { Stats } from '#gateway/node/fs'; export type FileStats = Stats;`
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { astGetImportsTransformer } from '../../../transformers/ast-get-imports/ast-get-imports-transformer';
import { isGatewayFileGuard } from '../../../guards/is-gateway-file/is-gateway-file-guard';
import { isNpmPackageGuard } from '../../../guards/is-npm-package/is-npm-package-guard';
import type { Identifier, ModulePath } from '@dungeonmaster/shared/contracts';

export const ruleBanTypeAliasesBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          "Ban exported type aliases of a field's type and exported aliases that give a library type a second name.",
      },
      messages: {
        noFieldTypeAlias:
          "Exported alias \"{{name}}\" renames a field's type. Write the indexed type (Owner['field']) where it is used instead of naming it.",
        noLibraryTypeAlias:
          'Exported alias "{{name}}" gives the library type "{{library}}" a second name. Import the library type through the gateway where it is used instead of aliasing it.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = String(ctx.filename ?? '');

    if (isGatewayFileGuard({ filename })) {
      return {};
    }

    const imports = new Map<Identifier, ModulePath>();

    return {
      Program: (node: Tsestree): void => {
        const statements = Array.isArray(node.body) ? node.body : [];
        for (const statement of statements) {
          for (const [name, importPath] of astGetImportsTransformer({ node: statement })) {
            imports.set(name, importPath);
          }
        }
      },

      TSTypeAliasDeclaration: (node: Tsestree): void => {
        if (node.parent?.type !== 'ExportNamedDeclaration') {
          return;
        }

        const aliasName = node.id?.name ?? '';
        const aliased = node.typeAnnotation;

        if (aliased?.type === 'TSIndexedAccessType') {
          // An alias with type parameters indexes a type computed from them (a compile-time type,
          // not a second name for one field), so it stays.
          if (node.typeParameters) {
            return;
          }
          ctx.report({ node, messageId: 'noFieldTypeAlias', data: { name: aliasName } });
          return;
        }

        if (aliased?.type !== 'TSTypeReference') {
          return;
        }

        const terminal =
          aliased.typeName?.type === 'TSQualifiedName' ? aliased.typeName.right?.name : undefined;
        if (terminal === 'infer' || terminal === 'input' || terminal === 'output') {
          return;
        }

        let root = aliased.typeName;
        while (root?.type === 'TSQualifiedName') {
          root = root.left;
        }
        const libraryName = root?.name;
        if (libraryName === undefined) {
          return;
        }

        if (isNpmPackageGuard({ importSource: imports.get(libraryName) ?? '' })) {
          ctx.report({
            node,
            messageId: 'noLibraryTypeAlias',
            data: { name: aliasName, library: libraryName },
          });
        }
      },
    };
  },
});
