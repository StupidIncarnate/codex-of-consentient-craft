/**
 * PURPOSE: Enforces the gateway's own colocation and pass-through-purity shape, inside a gateway
 * file (`packages/{npm,node,browser,bin}/src/**`) only. A wrapper file — any single-dot `.ts` that
 * is not `index.ts` — needs a colocated `.test.ts` (or `.integration.test.ts`) and a `.proxy.ts`,
 * the same requirement `enforce-implementation-colocation` already checks for every other folder
 * type, minus the `/src/` self-skip that rule carries (this rule is path-scoped to the gateway
 * glob instead, so it never needs one). An `index.ts` is the subpath's single entry, and it may
 * hold ONLY re-exports — `export *`, `export { a } from './a'`, `export type`, the `export =`
 * form (`import x = require('pkg'); export = x;`), a global capture (`export const { x } =
 * globalThis;`, or `export const x = globalThis.x;` — a global has no module to `export * from`,
 * so this IS its re-export), and a bare side-effect `import 'pkg';` with zero specifiers (a
 * pass-through for a package that only registers side effects, e.g. jest-dom augmenting `expect`).
 * A pure-reexport `index.ts` needs only a colocated `index.test.ts` (or `.integration.test.ts`); a
 * proxy there is dead weight, not an error, so it is flagged softly under its own messageId rather
 * than treated the same as a missing file. An `index.ts` that fails purity (it holds a plain
 * `import` with bindings, a `const` not shaped like a global capture, a function body — real
 * wrapping behaviour) is reported for that, AND is then held to the wrapper's own test+proxy
 * requirement, because a file doing wrapper work needs a wrapper's tests.
 *
 * USAGE:
 * const rule = ruleGatewayColocationBroker();
 * // Flags packages/node/src/fs/read-file-sync.ts with no read-file-sync.proxy.ts;
 * // flags packages/node/src/module/index.ts, whose body builds an object instead of only
 * // re-exporting, as passThroughNotPureReexport
 */
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { isGatewayFileGuard } from '../../../guards/is-gateway-file/is-gateway-file-guard';
import { dotCountTransformer } from '../../../transformers/dot-count/dot-count-transformer';
import { getFileExtensionTransformer } from '../../../transformers/get-file-extension/get-file-extension-transformer';
import { removeFileExtensionTransformer } from '../../../transformers/remove-file-extension/remove-file-extension-transformer';
import { gatewayPureReexportStatementTypesStatics } from '../../../statics/gateway-pure-reexport-statement-types/gateway-pure-reexport-statement-types-statics';

export const ruleGatewayColocationBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          "Enforce the gateway's own colocation shape: a wrapper file needs a test and a proxy, an index.ts holds only re-exports.",
      },
      messages: {
        missingTestFile:
          'Gateway file "{{fileName}}" needs a colocated {{testFileName}} (or an .integration.test.ts variant).',
        missingProxyFile: 'Gateway file "{{fileName}}" needs a colocated {{proxyFileName}}.',
        passThroughNotPureReexport:
          'Pass-through entry "{{fileName}}" may only re-export ("export * from \'...\'", "export { a } from \'./a\'", "export type", or "export = x"). Found a non-export statement — this file wraps behavior, so it needs its own colocated test and proxy like a wrapper.',
        passThroughHasStrayProxy:
          'Pass-through entry "{{fileName}}" is a pure re-export and needs no proxy; "{{proxyFileName}}" is dead weight — delete it, or add real wrapping behavior that needs it.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ?? ctx.getFilename?.() ?? '';

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
    const isIndexFile = String(baseNameWithoutExtension) === 'index';

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
        const hasProxyFile = fsExistsSyncAdapter({
          filePath: filePathContract.parse(`${directory}${proxyFileName}`),
        });

        if (!isIndexFile) {
          if (!hasTestFile) {
            ctx.report({
              node,
              messageId: 'missingTestFile',
              data: { fileName: fileBaseName, testFileName },
            });
          }

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

          if (!hasTestFile) {
            ctx.report({
              node,
              messageId: 'missingTestFile',
              data: { fileName: fileBaseName, testFileName },
            });
          }

          if (!hasProxyFile) {
            ctx.report({
              node,
              messageId: 'missingProxyFile',
              data: { fileName: fileBaseName, proxyFileName },
            });
          }

          return;
        }

        if (!hasTestFile) {
          ctx.report({
            node,
            messageId: 'missingTestFile',
            data: { fileName: fileBaseName, testFileName },
          });
        }

        if (hasProxyFile) {
          ctx.report({
            node,
            messageId: 'passThroughHasStrayProxy',
            data: { fileName: fileBaseName, proxyFileName },
          });
        }
      },
    };
  },
});
