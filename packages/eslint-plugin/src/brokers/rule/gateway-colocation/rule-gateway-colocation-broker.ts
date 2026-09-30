/**
 * PURPOSE: Enforces the gateway's own colocation and pass-through-purity shape, inside a gateway
 * file (`packages/@gateway/{npm,node,browser,bin}/src/**`) only. A subpath's barrel is the file
 * named after its own folder directly under `src/` (`src/fs/fs.ts`); every other single-dot `.ts`
 * sits in a wrapper folder. A wrapper file needs a colocated `.test.ts` (or `.integration.test.ts`)
 * and a `.proxy.ts`, the same requirement `enforce-implementation-colocation` checks for every other
 * folder type; a file declaring only types needs neither. A barrel needs only a colocated test, and
 * it never needs a `.proxy.ts` of its own — a test importing one of its wrappers imports that
 * wrapper's own proxy per file. A barrel may hold ONLY re-exports —
 * `export *`, `export { a } from './a/a'`, `export type`, the `export =` form (`import x =
 * require('pkg'); export = x;`), a global capture (`export const { x } = globalThis;`, or `export
 * const x = globalThis.x;` — a global has no module to `export * from`, so this IS its re-export),
 * and a bare side-effect `import 'pkg';` with zero specifiers (a pass-through for a package that only
 * registers side effects, e.g. jest-dom augmenting `expect`). A barrel holding anything else — a
 * plain `import` with bindings, a `const` not shaped like a global capture, a function body — does
 * wrapper work that belongs in a wrapper folder, and is reported for it.
 *
 * An `.error.ts` file (`git-not-installed.error.ts`) is a third shape, told apart from a
 * test/proxy/stub companion by its own suffix rather than by dot count: it needs no test and no
 * proxy, but may hold nothing besides imports plus exactly one exported class extending `Error`,
 * whose name is the file's own base name (minus `.error`) in PascalCase plus `Error`
 * (`run-not-found.error.ts` exports `RunNotFoundError`). An error class declared anywhere else in
 * the gateway — inside an ordinary wrapper file — is refused too, so every future error class is
 * forced into its own `.error.ts` file from the start.
 *
 * A barrel's own named re-exports (`export { x } from './y/y'`) are checked three further ways,
 * each delegated to its own layer broker so a barrel visit computes the shared reexports list once:
 * completeness in both directions (a wrapper's `const`/`function`/`class` export — or an `.error.ts`
 * companion's one class — with no matching barrel re-export, and a barrel re-export whose target no
 * longer carries that name), single-home (a re-export whose relative source climbs outside the
 * barrel's own subpath folder), and no-test-support-reexport (a re-export sourced from a sibling
 * `.proxy.ts` or `.stub.ts`, which G26 says stays imported from its own file, never the barrel).
 *
 * USAGE:
 * const rule = ruleGatewayColocationBroker();
 * // Flags packages/@gateway/node/src/fs/read-file-sync/read-file-sync.ts with no read-file-sync.proxy.ts;
 * // flags packages/@gateway/node/src/module/module.ts if its body builds an object instead of only
 * // re-exporting, as passThroughNotPureReexport
 * // Flags packages/@gateway/bin/src/git/git-run/git-run.ts if it declares `class X extends Error`
 * // itself, as errorClassOutsideErrorFile
 * // With options: [{requireStub: true}], also flags a subpath barrel whose folder tree has no
 * // .stub.ts anywhere under it, as missingStub — off by default (G18 turns it on repo-wide once
 * // every subpath actually has one; see gateway-subpath-has-stub-layer-broker.ts)
 * // Flags a barrel missing a re-export for an existing wrapper export as barrelMissingReexport, one
 * // re-exporting a name no wrapper carries any more as barrelStaleReexport, one reaching into a
 * // sibling subpath as reexportOutsideOwnSubpath, and one re-exporting a .proxy.ts/.stub.ts as
 * // barrelReexportsTestSupportFile
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { existsSync } from '#gateway/node/fs';
import { isGatewayFileGuard } from '../../../guards/is-gateway-file/is-gateway-file-guard';
import { isGatewayBarrelFileGuard } from '../../../guards/is-gateway-barrel-file/is-gateway-barrel-file-guard';
import { dotCountTransformer } from '../../../transformers/dot-count/dot-count-transformer';
import { getFileExtensionTransformer } from '../../../transformers/get-file-extension/get-file-extension-transformer';
import { removeFileExtensionTransformer } from '../../../transformers/remove-file-extension/remove-file-extension-transformer';
import { kebabToPascalCaseTransformer } from '../../../transformers/kebab-to-pascal-case/kebab-to-pascal-case-transformer';
import { gatewayPureReexportStatementTypesStatics } from '../../../statics/gateway-pure-reexport-statement-types/gateway-pure-reexport-statement-types-statics';
import { gatewaySubpathHasStubLayerBroker } from './gateway-subpath-has-stub-layer-broker';
import { barrelNamedReexportsLayerBroker } from './barrel-named-reexports-layer-broker';
import { barrelSingleHomeLayerBroker } from './barrel-single-home-layer-broker';
import { barrelNoTestSupportReexportLayerBroker } from './barrel-no-test-support-reexport-layer-broker';
import { barrelCompletenessLayerBroker } from './barrel-completeness-layer-broker';

export const ruleGatewayColocationBroker = (): TSESLint.RuleModule<
  | 'missingTestFile'
  | 'missingProxyFile'
  | 'passThroughNotPureReexport'
  | 'missingStub'
  | 'errorFileMultipleExports'
  | 'errorFileNotErrorClass'
  | 'errorFileNameMismatch'
  | 'errorClassOutsideErrorFile'
  | 'barrelMissingReexport'
  | 'barrelStaleReexport'
  | 'reexportOutsideOwnSubpath'
  | 'barrelReexportsTestSupportFile'
> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        "Enforce the gateway's own colocation shape: a wrapper file needs a test and a proxy, a subpath barrel holds only re-exports.",
    },
    messages: {
      missingTestFile:
        'Gateway file "{{fileName}}" needs a colocated {{testFileName}} (or an .integration.test.ts variant).',
      missingProxyFile: 'Gateway file "{{fileName}}" needs a colocated {{proxyFileName}}.',
      passThroughNotPureReexport:
        'Subpath barrel "{{fileName}}" may only re-export ("export * from \'...\'", "export { a } from \'./a/a\'", "export type", or "export = x"). Found a non-export statement — move that behavior into a wrapper folder beside the barrel.',
      missingStub:
        'Gateway subpath "{{subpathName}}" needs at least one .stub.ts file somewhere under its folder (see #gateway/node/fs/is-fs-error/fs-error.stub.ts for the pattern).',
      errorFileMultipleExports:
        'Gateway error file "{{fileName}}" may hold only imports plus exactly one exported class extending Error. Move any other export into its own wrapper file.',
      errorFileNotErrorClass:
        'Gateway error file "{{fileName}}" must export exactly one class extending Error.',
      errorFileNameMismatch:
        'Gateway error file "{{fileName}}" exports "{{actualName}}", but its filename requires the class "{{expectedName}}".',
      errorClassOutsideErrorFile:
        'Class "{{className}}" extends Error but is declared in "{{fileName}}" — move it into its own .error.ts file beside this wrapper.',
      barrelMissingReexport:
        'Subpath barrel "{{fileName}}" is missing a re-export for "{{name}}", exported by "{{wrapperFile}}". Add a named re-export for it to the barrel.',
      barrelStaleReexport:
        'Subpath barrel "{{fileName}}" re-exports "{{name}}" from "{{source}}", but no such export exists there any more. Remove the stale re-export or restore the wrapper.',
      reexportOutsideOwnSubpath:
        'Subpath barrel "{{fileName}}" re-exports "{{name}}" from "{{source}}", which reaches outside its own subpath folder. A barrel may only re-export from its own folder tree.',
      barrelReexportsTestSupportFile:
        'Subpath barrel "{{fileName}}" re-exports "{{name}}" from "{{source}}", a test-support file. A production barrel may not re-export a .proxy.ts or .stub.ts — each is imported from its own file.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          requireStub: {
            type: 'boolean',
            description:
              'When true, every subpath barrel must have at least one .stub.ts file somewhere under its folder. Off by default until every subpath has one (G18).',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context as TSESLint.RuleContext<string, unknown[]> & {
      options?: { requireStub?: boolean }[];
    };
    const { filename } = ctx;
    const requireStub = ctx.options[0]?.requireStub === true;

    if (filename.length === 0 || !isGatewayFileGuard({ filename })) {
      return {};
    }

    const fileBaseName = filename.split('/').pop() ?? '';
    const dotCount = dotCountTransformer({ str: fileBaseName });
    const isErrorFile = fileBaseName.endsWith('.error.ts') || fileBaseName.endsWith('.error.tsx');

    // A gateway file with more than one dot is itself a test/proxy/stub/d.ts companion, never the
    // implementation this rule checks companions FOR — an `.error.ts` file is the one two-dot name
    // that IS an implementation, so it alone is exempt from this skip.
    if (dotCount > 1 && !isErrorFile) {
      return {};
    }

    const directory = filename.slice(0, filename.length - fileBaseName.length);
    const extension = getFileExtensionTransformer({ filename });
    const baseNameWithoutExtension = removeFileExtensionTransformer({ filename: fileBaseName });
    const isBarrelFile = isGatewayBarrelFileGuard({ filename });

    return {
      Program: (node: TSESTree.Program): void => {
        const statements = Array.isArray(node.body) ? node.body : [];

        if (isErrorFile) {
          const nonImportStatements = statements.filter(
            (statement) => statement.type !== AST_NODE_TYPES.ImportDeclaration,
          );

          if (nonImportStatements.length !== 1) {
            ctx.report({
              node,
              messageId: 'errorFileMultipleExports',
              data: { fileName: fileBaseName },
            });
            return;
          }

          const [onlyStatement] = nonImportStatements;
          const errorClassDeclaration =
            onlyStatement?.type === AST_NODE_TYPES.ExportNamedDeclaration &&
            onlyStatement.declaration?.type === AST_NODE_TYPES.ClassDeclaration
              ? onlyStatement.declaration
              : undefined;
          const extendsError =
            errorClassDeclaration?.superClass?.type === AST_NODE_TYPES.Identifier &&
            errorClassDeclaration.superClass.name === 'Error';

          if (errorClassDeclaration === undefined || !extendsError) {
            ctx.report({
              node,
              messageId: 'errorFileNotErrorClass',
              data: { fileName: fileBaseName },
            });
            return;
          }

          // `baseNameWithoutExtension` still carries the trailing `.error` this branch's own
          // `isErrorFile` guard confirmed — a plain slice, not a regex, since brokers/ may not
          // hold a regex literal (transformers/guards/statics/contracts only).
          const baseNameWithoutErrorSuffix = baseNameWithoutExtension.slice(
            0,
            baseNameWithoutExtension.length - '.error'.length,
          );
          const expectedClassName = `${kebabToPascalCaseTransformer({
            str: baseNameWithoutErrorSuffix,
          })}Error`;
          const actualClassName = errorClassDeclaration.id?.name ?? '';

          if (actualClassName !== expectedClassName) {
            ctx.report({
              node,
              messageId: 'errorFileNameMismatch',
              data: {
                fileName: fileBaseName,
                actualName: actualClassName,
                expectedName: expectedClassName,
              },
            });
          }

          return;
        }

        const testFileName = `${baseNameWithoutExtension}.test${extension}`;
        const integrationTestFileName = `${baseNameWithoutExtension}.integration.test${extension}`;
        const proxyFileName = `${baseNameWithoutExtension}.proxy${extension}`;

        const hasTestFile =
          existsSync(`${directory}${testFileName}`) ||
          existsSync(`${directory}${integrationTestFileName}`);

        if (!isBarrelFile) {
          statements.forEach((statement) => {
            const wrapperClassDeclaration =
              statement.type === AST_NODE_TYPES.ClassDeclaration
                ? statement
                : statement.type === AST_NODE_TYPES.ExportNamedDeclaration &&
                    statement.declaration?.type === AST_NODE_TYPES.ClassDeclaration
                  ? statement.declaration
                  : undefined;

            const wrapperClassExtendsError =
              wrapperClassDeclaration?.superClass?.type === AST_NODE_TYPES.Identifier &&
              wrapperClassDeclaration.superClass.name === 'Error';

            if (wrapperClassDeclaration !== undefined && wrapperClassExtendsError) {
              ctx.report({
                node,
                messageId: 'errorClassOutsideErrorFile',
                data: {
                  fileName: fileBaseName,
                  className: wrapperClassDeclaration.id?.name ?? '(anonymous)',
                },
              });
            }
          });

          const declaresOnlyTypes =
            statements.length > 0 &&
            statements.every(
              (statement) =>
                statement.type === AST_NODE_TYPES.ImportDeclaration ||
                (statement.type === AST_NODE_TYPES.ExportNamedDeclaration &&
                  (statement.declaration?.type === AST_NODE_TYPES.TSInterfaceDeclaration ||
                    statement.declaration?.type === AST_NODE_TYPES.TSTypeAliasDeclaration)),
            );

          if (declaresOnlyTypes) {
            return;
          }

          if (!hasTestFile) {
            ctx.report({
              node,
              messageId: 'missingTestFile',
              data: { fileName: fileBaseName, testFileName },
            });
          }

          const hasProxyFile = existsSync(`${directory}${proxyFileName}`);

          if (!hasProxyFile) {
            ctx.report({
              node,
              messageId: 'missingProxyFile',
              data: { fileName: fileBaseName, proxyFileName },
            });
          }

          return;
        }

        const isPureReexport = statements.every((statement) => {
          const statementType = statement.type;

          if (
            gatewayPureReexportStatementTypesStatics.types.some((type) => type === statementType)
          ) {
            return true;
          }

          if (statementType === AST_NODE_TYPES.ExportNamedDeclaration) {
            const hasSource = typeof statement.source?.value === 'string';
            const declarationNode = statement.declaration;
            const declarationType = declarationNode?.type;
            const isTypeDeclaration =
              declarationType === AST_NODE_TYPES.TSTypeAliasDeclaration ||
              declarationType === AST_NODE_TYPES.TSInterfaceDeclaration;

            if (hasSource || isTypeDeclaration) {
              return true;
            }

            if (
              declarationType !== AST_NODE_TYPES.VariableDeclaration ||
              declarationNode?.kind !== 'const'
            ) {
              return false;
            }

            const { declarations } = declarationNode;

            if (declarations.length !== 1) {
              return false;
            }

            const [declarator] = declarations;
            const id = declarator?.id;
            const init = declarator?.init;

            const isMemberCapture =
              id?.type === AST_NODE_TYPES.Identifier &&
              init?.type === AST_NODE_TYPES.MemberExpression &&
              !init.computed &&
              init.object.type === AST_NODE_TYPES.Identifier &&
              init.object.name === 'globalThis' &&
              init.property.type === AST_NODE_TYPES.Identifier &&
              init.property.name === id.name;

            const patternProperties =
              (id?.type === AST_NODE_TYPES.ObjectPattern ? id.properties : undefined) ?? [];
            const [firstPatternProperty] = patternProperties;

            const isDestructureCapture =
              id?.type === AST_NODE_TYPES.ObjectPattern &&
              patternProperties.length === 1 &&
              firstPatternProperty?.type === AST_NODE_TYPES.Property &&
              firstPatternProperty.shorthand &&
              init?.type === AST_NODE_TYPES.Identifier &&
              init.name === 'globalThis';

            return isMemberCapture || isDestructureCapture;
          }

          if (statementType === AST_NODE_TYPES.ImportDeclaration) {
            return statement.specifiers.length === 0;
          }

          return false;
        });

        if (!isPureReexport) {
          ctx.report({
            node,
            messageId: 'passThroughNotPureReexport',
            data: { fileName: fileBaseName },
          });
        }

        if (!hasTestFile) {
          ctx.report({
            node,
            messageId: 'missingTestFile',
            data: { fileName: fileBaseName, testFileName },
          });
        }

        if (
          requireStub &&
          !gatewaySubpathHasStubLayerBroker({
            subpathDirectory: directory,
          })
        ) {
          ctx.report({
            node,
            messageId: 'missingStub',
            data: { subpathName: baseNameWithoutExtension },
          });
        }

        const reexports = barrelNamedReexportsLayerBroker({ node });

        barrelSingleHomeLayerBroker({ node, context: ctx, fileName: fileBaseName, reexports });
        barrelNoTestSupportReexportLayerBroker({
          node,
          context: ctx,
          fileName: fileBaseName,
          reexports,
        });
        barrelCompletenessLayerBroker({
          node,
          context: ctx,
          fileName: fileBaseName,
          subpathDirectory: directory,
          reexports,
        });
      },
    };
  },
});
