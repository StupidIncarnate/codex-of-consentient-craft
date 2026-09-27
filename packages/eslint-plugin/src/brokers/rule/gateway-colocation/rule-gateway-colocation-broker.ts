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
 * USAGE:
 * const rule = ruleGatewayColocationBroker();
 * // Flags packages/@gateway/node/src/fs/read-file-sync/read-file-sync.ts with no read-file-sync.proxy.ts;
 * // flags packages/@gateway/node/src/module/module.ts if its body builds an object instead of only
 * // re-exporting, as passThroughNotPureReexport
 * // With options: [{requireStub: true}], also flags a subpath barrel whose folder tree has no
 * // .stub.ts anywhere under it, as missingStub — off by default (G18 turns it on repo-wide once
 * // every subpath actually has one; see gateway-subpath-has-stub-layer-broker.ts)
 */
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { isGatewayFileGuard } from '../../../guards/is-gateway-file/is-gateway-file-guard';
import { isGatewayBarrelFileGuard } from '../../../guards/is-gateway-barrel-file/is-gateway-barrel-file-guard';
import { dotCountTransformer } from '../../../transformers/dot-count/dot-count-transformer';
import { getFileExtensionTransformer } from '../../../transformers/get-file-extension/get-file-extension-transformer';
import { removeFileExtensionTransformer } from '../../../transformers/remove-file-extension/remove-file-extension-transformer';
import { gatewayPureReexportStatementTypesStatics } from '../../../statics/gateway-pure-reexport-statement-types/gateway-pure-reexport-statement-types-statics';
import { gatewaySubpathHasStubLayerBroker } from './gateway-subpath-has-stub-layer-broker';

export const ruleGatewayColocationBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
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
  }),
  create: (context: EslintContext) => {
    const ctx = context as EslintContext & { options?: { requireStub?: boolean }[] };
    const filename = ctx.filename ?? ctx.getFilename?.() ?? '';
    const requireStub = ctx.options?.[0]?.requireStub === true;

    if (filename.length === 0 || !isGatewayFileGuard({ filename })) {
      return {};
    }

    const fileBaseName = filename.split('/').pop() ?? '';
    const dotCount = dotCountTransformer({ str: fileBaseName });

    // A gateway file with more than one dot is itself a test/proxy/stub/d.ts companion, never the
    // implementation this rule checks companions FOR.
    if (dotCount > 1) {
      return {};
    }

    const directory = filename.slice(0, filename.length - fileBaseName.length);
    const extension = getFileExtensionTransformer({ filename });
    const baseNameWithoutExtension = removeFileExtensionTransformer({ filename: fileBaseName });
    const isBarrelFile = isGatewayBarrelFileGuard({ filename });

    return {
      Program: (node: Tsestree): void => {
        const testFileName = `${baseNameWithoutExtension}.test${extension}`;
        const integrationTestFileName = `${baseNameWithoutExtension}.integration.test${extension}`;
        const proxyFileName = `${baseNameWithoutExtension}.proxy${extension}`;

        const hasTestFile =
          fsExistsSyncAdapter({
            filePath: filePathContract.parse(`${directory}${testFileName}`),
          }) ||
          fsExistsSyncAdapter({
            filePath: filePathContract.parse(`${directory}${integrationTestFileName}`),
          });

        if (!isBarrelFile) {
          const statements = Array.isArray(node.body) ? node.body : [];
          const declaresOnlyTypes =
            statements.length > 0 &&
            statements.every(
              (statement) =>
                statement.type === 'ImportDeclaration' ||
                (statement.type === 'ExportNamedDeclaration' &&
                  (statement.declaration?.type === 'TSInterfaceDeclaration' ||
                    statement.declaration?.type === 'TSTypeAliasDeclaration')),
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

          const hasProxyFile = fsExistsSyncAdapter({
            filePath: filePathContract.parse(`${directory}${proxyFileName}`),
          });

          if (!hasProxyFile) {
            ctx.report({
              node,
              messageId: 'missingProxyFile',
              data: { fileName: fileBaseName, proxyFileName },
            });
          }

          return;
        }

        const body = Array.isArray(node.body) ? node.body : [];
        const isPureReexport = body.every((statement) => {
          const statementType = statement.type;

          if (
            gatewayPureReexportStatementTypesStatics.types.some((type) => type === statementType)
          ) {
            return true;
          }

          if (statementType === 'ExportNamedDeclaration') {
            const hasSource = typeof statement.source?.value === 'string';
            const declarationNode = statement.declaration;
            const declarationType = declarationNode?.type;
            const isTypeDeclaration =
              declarationType === 'TSTypeAliasDeclaration' ||
              declarationType === 'TSInterfaceDeclaration';

            if (hasSource || isTypeDeclaration) {
              return true;
            }

            if (declarationType !== 'VariableDeclaration' || declarationNode?.kind !== 'const') {
              return false;
            }

            const declarations = declarationNode.declarations ?? [];

            if (declarations.length !== 1) {
              return false;
            }

            const [declarator] = declarations;
            const id = declarator?.id;
            const init = declarator?.init;

            const isMemberCapture =
              id?.type === 'Identifier' &&
              init?.type === 'MemberExpression' &&
              init.computed !== true &&
              init.object?.type === 'Identifier' &&
              init.object.name === 'globalThis' &&
              init.property?.type === 'Identifier' &&
              init.property.name === id.name;

            const patternProperties = id?.properties ?? [];
            const [firstPatternProperty] = patternProperties;

            const isDestructureCapture =
              id?.type === 'ObjectPattern' &&
              patternProperties.length === 1 &&
              firstPatternProperty?.type === 'Property' &&
              firstPatternProperty.shorthand === true &&
              init?.type === 'Identifier' &&
              init.name === 'globalThis';

            return isMemberCapture || isDestructureCapture;
          }

          if (statementType === 'ImportDeclaration') {
            return (statement.specifiers ?? []).length === 0;
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
            subpathDirectory: filePathContract.parse(directory),
          })
        ) {
          ctx.report({
            node,
            messageId: 'missingStub',
            data: { subpathName: baseNameWithoutExtension },
          });
        }
      },
    };
  },
});
