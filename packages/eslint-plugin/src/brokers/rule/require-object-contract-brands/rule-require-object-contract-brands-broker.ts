/**
 * PURPOSE: B1, B2 and B3 for the syntax half of the brand rules: every object schema in a contract
 * carries `.brand<'Owner…'>()`, every brand text is the owner's name plus the field key, and a brand
 * sits only on an object or one of its fields. It also holds a self-referencing contract to the
 * getter form (no `z.lazy`, no `z.ZodType` getter, a `Self` type that ends in `z.$brand<'Owner'>`),
 * refuses `z.unknown()` and `z.any()`, and takes a brand off an enum, a literal or a boolean. A
 * `z.record` key and anything inside a `z.function` schema are not fields, so it grades no brand there.
 * Reach for this over `require-zod-on-primitives`, which asked the model to pick each text: here the
 * fixer writes the derived one. A leaf with no brand, and a layer contract's texts, need another
 * file to tell a reuse from a new value, so `require-object-contract-brands-indexed` owns those.
 * Reads only the file it lints, so it is pre-edit eligible.
 *
 * USAGE:
 * const rule = ruleRequireObjectContractBrandsBroker();
 * // Reports `z.object({ id: idContract })` in quest-contract.ts and fixes it to
 * // `z.object({ id: idContract }).brand<'Quest'>()`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isFileInFolderTypeGuard } from '../../../guards/is-file-in-folder-type/is-file-in-folder-type-guard';
import { isAstGetterReturnTypeGuard } from '../../../guards/is-ast-getter-return-type/is-ast-getter-return-type-guard';
import { isAstMethodCallGuard } from '../../../guards/is-ast-method-call/is-ast-method-call-guard';
import { isAstBrandExemptGuard } from '../../../guards/is-ast-brand-exempt/is-ast-brand-exempt-guard';
import { isAstObjectSchemaGuard } from '../../../guards/is-ast-object-schema/is-ast-object-schema-guard';
import { isAstShapeReuseCheckGuard } from '../../../guards/is-ast-shape-reuse-check/is-ast-shape-reuse-check-guard';
import { zodObjectBrandStatics } from '../../../statics/zod-object-brand/zod-object-brand-statics';
import { dotCountTransformer } from '../../../transformers/dot-count/dot-count-transformer';
import { astCallMethodNameTransformer } from '../../../transformers/ast-call-method-name/ast-call-method-name-transformer';
import { astBrandLiteralTransformer } from '../../../transformers/ast-brand-literal/ast-brand-literal-transformer';
import { astBrandPathTransformer } from '../../../transformers/ast-brand-path/ast-brand-path-transformer';
import { astExpectedBrandTextTransformer } from '../../../transformers/ast-expected-brand-text/ast-expected-brand-text-transformer';
import { astFieldListOwnersTransformer } from '../../../transformers/ast-field-list-owners/ast-field-list-owners-transformer';
import { astLocalIdConstsTransformer } from '../../../transformers/ast-local-id-consts/ast-local-id-consts-transformer';
import { astObjectBrandAnchorTransformer } from '../../../transformers/ast-object-brand-anchor/ast-object-brand-anchor-transformer';
import { astZodRootMethodTransformer } from '../../../transformers/ast-zod-root-method/ast-zod-root-method-transformer';
import { brandTextDeriveTransformer } from '../../../transformers/brand-text-derive/brand-text-derive-transformer';

export const ruleRequireObjectContractBrandsBroker = (): TSESLint.RuleModule<
  | 'objectNoBrand'
  | 'fieldListBranded'
  | 'wrongBrandText'
  | 'localIdBrandText'
  | 'brandOnUnbrandable'
  | 'brandElsewhere'
  | 'unknownSchema'
  | 'lazySchema'
  | 'zodTypeGetter'
  | 'selfTypeBrand'
  | 'reuseAddsCheck'
> => ({
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description:
        "Every object schema in a contract carries a brand whose text is the owner's name plus the field key; a brand sits only on an object contract or one of its fields",
    },
    messages: {
      objectNoBrand: "z.object in {{file}} has no brand. Add .brand<'{{expected}}'>().",
      fieldListBranded:
        "{{name}} is a field list spread into {{owner}}. It carries no brand of its own: the owner's brand is the only one on the object.",
      wrongBrandText: "Brand text '{{actual}}' must be '{{expected}}'.",
      localIdBrandText: "Brand text '{{actual}}' must be '{{expected}}', the id of {{owner}}.",
      brandOnUnbrandable: '{{key}} is an enum, literal or boolean. Remove the brand.',
      brandElsewhere:
        'A brand sits only on an object contract or one of its fields. Move it onto the field that owns the value, or drop it.',
      unknownSchema:
        "{{key}} is z.unknown(), which checks nothing. Use the value's contract, or z.json() when it is any JSON value.",
      lazySchema:
        'A contract that holds itself uses an annotated getter, not z.lazy. See "A contract that holds itself".',
      zodTypeGetter:
        'A getter\'s return type wraps z.core.$ZodType<Self>, never z.ZodType<Self>. See "A contract that holds itself".',
      selfTypeBrand:
        "The local type of a self-referencing contract ends in z.$brand<'{{expected}}'>, the owner's brand, so the getter's elements carry it.",
      reuseAddsCheck:
        '{{key}} reuses {{source}}. Add no check to it: one brand text means one check.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;
    const baseName = filename.split('/').pop() ?? '';

    // A test, proxy, stub, harness or declaration file has more than one dot; none of them declares
    // a contract, and none may be graded as if it did.
    if (
      !(filename.endsWith('.ts') || filename.endsWith('.tsx')) ||
      dotCountTransformer({ str: baseName }) > 1
    ) {
      return {};
    }

    const isContract = isFileInFolderTypeGuard({
      filename,
      folderType: 'contracts',
      suffix: 'contract',
    });
    // A layer's owner is the file that imports it, so its texts belong to the indexed rule.
    const isLayer = baseName.includes('-layer-contract');
    const fieldListOwners = new Map<string, string>();
    const localIdConsts = new Map<string, string>();

    return {
      Program: (node: TSESTree.Program): void => {
        if (!isContract) {
          return;
        }
        for (const [list, owner] of astFieldListOwnersTransformer({ program: node })) {
          fieldListOwners.set(list, owner);
        }
        for (const [idConst, owner] of astLocalIdConstsTransformer({ program: node })) {
          localIdConsts.set(idConst, owner);
        }
      },

      TSTypeReference: (node: TSESTree.TSTypeReference): void => {
        const { typeName } = node;
        if (
          isContract &&
          isAstGetterReturnTypeGuard({ node }) &&
          typeName.type === AST_NODE_TYPES.TSQualifiedName &&
          typeName.left.type === AST_NODE_TYPES.Identifier &&
          typeName.left.name === 'z' &&
          typeName.right.name === 'ZodType'
        ) {
          ctx.report({ node, messageId: 'zodTypeGetter' });
        }
      },

      TSTypeAliasDeclaration: (node: TSESTree.TSTypeAliasDeclaration): void => {
        const annotation = node.typeAnnotation;
        if (!isContract) {
          return;
        }

        const annotationText = ctx.sourceCode.getText(annotation);

        for (const [list, owner] of fieldListOwners) {
          const expected = brandTextDeriveTransformer({ path: [owner] });
          const marker = `z.$brand<'${expected}'>`;
          if (
            !annotationText.includes(`z.infer<typeof ${list}>`) ||
            annotationText.includes(marker)
          ) {
            continue;
          }

          ctx.report({
            node,
            messageId: 'selfTypeBrand',
            data: { expected },
            // A union takes the brand as a whole, so it needs parentheses to bind the `&` correctly.
            fix: (fixer) =>
              annotation.type === AST_NODE_TYPES.TSUnionType
                ? [
                    fixer.insertTextBefore(annotation, '('),
                    fixer.insertTextAfter(annotation, `) & ${marker}`),
                  ]
                : fixer.insertTextAfter(annotation, ` & ${marker}`),
          });
        }
      },

      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;
        const method = astCallMethodNameTransformer({ node });

        if (isContract && isAstMethodCallGuard({ node, object: 'z', method: 'lazy' })) {
          ctx.report({ node, messageId: 'lazySchema' });
          return;
        }

        if (
          isContract &&
          (isAstMethodCallGuard({ node, object: 'z', method: 'unknown' }) ||
            isAstMethodCallGuard({ node, object: 'z', method: 'any' }))
        ) {
          const key = astBrandPathTransformer({ node }).at(-1) ?? 'value';
          ctx.report({ node, messageId: 'unknownSchema', data: { key } });
          return;
        }

        // `owner.shape.key.<method>(…)`: the reuse keeps its source's checks and its brand.
        if (isContract && isAstShapeReuseCheckGuard({ node })) {
          const reused = callee.type === AST_NODE_TYPES.MemberExpression ? callee.object : null;
          ctx.report({
            node,
            messageId: 'reuseAddsCheck',
            data: {
              key: String(
                reused?.type === AST_NODE_TYPES.MemberExpression ||
                  reused?.type === AST_NODE_TYPES.MetaProperty
                  ? reused.property.type === AST_NODE_TYPES.Identifier ||
                    reused.property.type === AST_NODE_TYPES.PrivateIdentifier
                    ? reused.property.name
                    : undefined
                  : undefined,
              ),
              source: ctx.sourceCode.getText(reused ?? undefined),
            },
          });
          return;
        }

        // A record key stays plain and a function schema's parts are not fields of the contract, so
        // no brand is demanded or graded there.
        if (isAstBrandExemptGuard({ node })) {
          return;
        }

        if (method === 'brand') {
          const literal = astBrandLiteralTransformer({ node });
          const actual =
            literal !== null && 'value' in literal && typeof literal.value === 'string'
              ? literal.value
              : null;
          if (actual?.startsWith(zodObjectBrandStatics.gateway.brandPrefix)) {
            return;
          }

          const root = astZodRootMethodTransformer({ node });
          const path = astBrandPathTransformer({ node });
          const onObject =
            root === 'derive' || zodObjectBrandStatics.objectRoots.some((name) => name === root);

          if (isContract && zodObjectBrandStatics.unbrandableRoots.some((name) => name === root)) {
            const receiver = callee.type === AST_NODE_TYPES.MemberExpression ? callee.object : null;
            const receiverText = receiver ? ctx.sourceCode.getText(receiver) : '';
            ctx.report({
              node,
              messageId: 'brandOnUnbrandable',
              data: { key: path.at(-1) ?? 'value' },
              fix: (fixer) => (receiver ? fixer.replaceText(node, receiverText) : null),
            });
            return;
          }

          // Not on an object and not a field of one: a standalone brand.
          if (path.length <= 1 && !onObject) {
            const [idConst] = path;
            const idOwner = idConst === undefined ? undefined : localIdConsts.get(idConst);
            if (idOwner === undefined || literal === null) {
              ctx.report({ node, messageId: 'brandElsewhere' });
              return;
            }

            const expected = brandTextDeriveTransformer({
              path: [idOwner, 'id'],
            });
            if (actual !== expected) {
              ctx.report({
                node,
                messageId: 'localIdBrandText',
                data: { actual, expected, owner: idOwner },
                fix: (fixer) => fixer.replaceText(literal, `'${expected}'`),
              });
            }
            return;
          }

          const expected = astExpectedBrandTextTransformer({ node, fieldListOwners });
          if (
            isContract &&
            !isLayer &&
            literal !== null &&
            expected !== null &&
            actual !== expected
          ) {
            ctx.report({
              node,
              messageId: 'wrongBrandText',
              data: { actual, expected },
              fix: (fixer) => fixer.replaceText(literal, `'${expected}'`),
            });
          }
          return;
        }

        // An object schema: `z.object(…)` (or strict/loose), or a derive call on another contract.
        if (!isContract || isLayer || !isAstObjectSchemaGuard({ node })) {
          return;
        }

        const path = astBrandPathTransformer({ node });
        const [ownerName] = path;
        if (ownerName === undefined) {
          return;
        }

        const anchor = astObjectBrandAnchorTransformer({ node });
        if (path.length === 1 && fieldListOwners.has(ownerName)) {
          if (anchor === null) {
            ctx.report({
              node,
              messageId: 'fieldListBranded',
              data: { name: ownerName, owner: fieldListOwners.get(ownerName) },
            });
          }
          return;
        }

        const expected = astExpectedBrandTextTransformer({ node, fieldListOwners });
        if (anchor === null || expected === null) {
          return;
        }

        ctx.report({
          node,
          messageId: 'objectNoBrand',
          data: { file: baseName, expected },
          fix: (fixer) => fixer.insertTextAfter(anchor, `.brand<'${expected}'>()`),
        });
      },
    };
  },
});
