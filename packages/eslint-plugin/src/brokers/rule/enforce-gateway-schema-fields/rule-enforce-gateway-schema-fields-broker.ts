/**
 * PURPOSE: Enforces BR C9 inside a contract file (`*-contract.ts` under any `contracts/` folder):
 * a `z.object(...)` field, at any nesting depth, may not be defined with a direct `z.custom<T>(...)`
 * or `z.instanceof(X)` call whose `T`/`X` resolves to an identifier imported from OUTSIDE the
 * workspace — an npm package or a Node builtin (`import {ChildProcess} from 'child_process'`) —
 * even a checked, branded one (`z.custom<T>(isT).brand<'#GatewayT'>()` is still a hand-copy of a
 * check the gateway already owns). A language global (`Error`, `Uint8Array`, unimported) or our own
 * type (a relative import, or `@dungeonmaster/*`) is not what BR C9 is about and passes untouched —
 * the gateway wraps outside packages, not the language or our own workspace. The only way in for a
 * field holding an outside package's type is a schema imported from `#gateway`, which this rule
 * never sees as a `CallExpression` at all — an imported identifier used as a property value has no
 * callee to flag. Syntax/AST only (no file I/O), so — unlike `gateway-schema-brand`, which reads the
 * real gateway tree off disk — this rule is `'pre-edit'`-eligible.
 *
 * USAGE:
 * const rule = ruleEnforceGatewaySchemaFieldsBroker();
 * // import { ChildProcess } from 'child_process';
 * // Flags `proc: z.custom<ChildProcess>()` and `proc: z.instanceof(ChildProcess)` inside
 * // `z.object(...)` in a *-contract.ts file; leaves `proc: childProcessSchema` (an import, not a
 * // call), `proc: z.instanceof(Error)` (a global) and a relative- or `@dungeonmaster/*`-imported
 * // type alone.
 */
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isFileInFolderTypeGuard } from '../../../guards/is-file-in-folder-type/is-file-in-folder-type-guard';
import { isAstMethodCallGuard } from '../../../guards/is-ast-method-call/is-ast-method-call-guard';

export const ruleEnforceGatewaySchemaFieldsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          "A z.object(...) field holding an outside package's type reuses the gateway schema imported from #gateway — never a direct z.custom/z.instanceof on an npm-package or Node-builtin type in a contract.",
      },
      messages: {
        directZodEscapeHatch:
          '{{key}} uses z.custom/z.instanceof on {{typeName}}, imported from "{{importSource}}", directly. A field holding an outside package\'s type reuses the gateway\'s schema, imported from #gateway.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ?? ctx.getFilename?.() ?? '';

    if (!isFileInFolderTypeGuard({ filename, folderType: 'contracts', suffix: 'contract' })) {
      return {};
    }

    // Populated by every ImportDeclaration before a later CallExpression reads it — imports are
    // always syntactically ahead of their usage, so one forward pass over the file is enough.
    const importSourceByLocalName = new Map<Identifier, FilePath>();

    return {
      ImportDeclaration: (node: Tsestree): void => {
        const sourceValue = typeof node.source?.value === 'string' ? node.source.value : undefined;
        if (sourceValue === undefined) {
          return;
        }

        const importSource = filePathContract.parse(sourceValue);

        for (const specifier of node.specifiers ?? []) {
          const localName =
            specifier.local?.type === 'Identifier' ? specifier.local.name : undefined;
          if (localName !== undefined) {
            importSourceByLocalName.set(localName, importSource);
          }
        }
      },

      CallExpression: (node: Tsestree): void => {
        const isCustomCall = isAstMethodCallGuard({ node, object: 'z', method: 'custom' });
        const isInstanceofCall = isAstMethodCallGuard({ node, object: 'z', method: 'instanceof' });

        if (!isCustomCall && !isInstanceofCall) {
          return;
        }

        // z.custom<T>(...) — the checked type is T, the first type argument.
        // z.instanceof(X) — the checked type is X, the first value argument (a class reference).
        const typeArgs = node.typeArguments ?? node.typeParameters;
        const firstTypeParam = typeArgs?.params?.[0];
        const firstValueArg = node.arguments?.[0];

        const checkedTypeName = isCustomCall
          ? firstTypeParam?.type === 'TSTypeReference' &&
            firstTypeParam.typeName?.type === 'Identifier'
            ? firstTypeParam.typeName.name
            : undefined
          : firstValueArg?.type === 'Identifier'
            ? firstValueArg.name
            : undefined;

        if (checkedTypeName === undefined) {
          return;
        }

        const importSource = importSourceByLocalName.get(identifierContract.parse(checkedTypeName));

        // Unresolved (a language global like Error/Uint8Array, never imported), a relative import
        // (our own type) or a workspace package (@dungeonmaster/*) — none of these is what BR C9
        // is about, so none is flagged.
        if (
          importSource === undefined ||
          importSource.startsWith('.') ||
          importSource.startsWith('@dungeonmaster/')
        ) {
          return;
        }

        // Walk up through a chained-method wrapper (`.brand()`, `.optional()`, `.default()`, …)
        // to the nearest enclosing object-literal Property this call is the VALUE of — never
        // diving into a sibling z.object(...)'s own shape, since that call gets its own
        // independent visit from this same listener.
        let current: Tsestree = node;
        // Sentinel: unchanged (`=== node`) after the walk means no enclosing Property was found.
        let propertyNode: Tsestree = node;
        let { parent } = current;

        while (parent) {
          if (parent.type === 'Property' && (parent.value as Tsestree | undefined) === current) {
            propertyNode = parent;
            break;
          }

          const staysInChain =
            (parent.type === 'MemberExpression' && parent.object === current) ||
            (parent.type === 'CallExpression' && parent.callee === current);

          if (!staysInChain) {
            break;
          }

          current = parent;
          ({ parent } = current);
        }

        if (propertyNode === node) {
          return;
        }

        const objectExpr = propertyNode.parent ?? undefined;
        if (objectExpr?.type !== 'ObjectExpression') {
          return;
        }

        const objectCall = objectExpr.parent ?? undefined;
        const isZodObjectShape =
          objectCall !== undefined &&
          isAstMethodCallGuard({ node: objectCall, object: 'z', method: 'object' }) &&
          objectCall.arguments?.[0] === objectExpr;

        if (!isZodObjectShape) {
          return;
        }

        const { key } = propertyNode;
        const keyName =
          key?.type === 'Identifier' && key.name !== undefined
            ? key.name
            : key?.type === 'Literal' && typeof key.value === 'string'
              ? key.value
              : '<computed>';

        ctx.report({
          node,
          messageId: 'directZodEscapeHatch',
          data: { key: keyName, typeName: checkedTypeName, importSource },
        });
      },
    };
  },
});
