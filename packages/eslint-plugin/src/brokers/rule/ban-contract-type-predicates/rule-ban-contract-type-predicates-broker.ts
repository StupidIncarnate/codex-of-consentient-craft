/**
 * PURPOSE: Enforces BR C3: a type predicate (`(value): value is X`) may narrow to a library's own
 * type — that is ordinary discriminated-union narrowing — but never to one of OUR contract types,
 * because minting a branded type with no parse is a cast wearing a guard's clothes. Refuses the
 * predicate's target type when it is imported from a `contracts/` path (a relative import, or a
 * workspace package's `contracts` export), or when it is an indexed type such as `Quest['id']` —
 * indexing into any type for one field's type reaches for a branded piece the same way, so that
 * form is refused regardless of where the indexed object type comes from. Syntax/AST only (no file
 * I/O, no type checker), so it is pre-edit-eligible, unlike `gateway-schema-brand` or
 * `require-gateway-unknown-parse`, which both need the type checker. B14's B5 already bans every
 * other alias of a field's type, so this rule needs only these two direct forms — never an alias
 * chase.
 *
 * USAGE:
 * const rule = ruleBanContractTypePredicatesBroker();
 * // Flags `(value: unknown): value is DungeonmasterHooksConfig => …` when DungeonmasterHooksConfig
 * // imports from a contracts/ path, and `(value): value is Quest['id'] => …` unconditionally;
 * // leaves `(node: TSESTree.Node): node is TSESTree.CallExpression => …` alone (a library type).
 */

import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const ruleBanContractTypePredicatesBroker = (): TSESLint.RuleModule<
  'contractTypePredicate' | 'indexedTypePredicate'
> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'A type predicate may narrow to a library type, never to one of our contract types or an indexed type off one — parse through the contract instead.',
    },
    messages: {
      contractTypePredicate:
        '{{typeName}}, imported from "{{importSource}}", is one of our contract types. A type predicate mints it with no check — parse it through its own contract\'s .safeParse/.parse instead, and read the parsed data on success.',
      indexedTypePredicate:
        '{{typeName}} indexes into a type for one field. A predicate cannot check a branded field safely — parse the owning contract and read the field off the parsed result.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;

    // Populated by every ImportDeclaration before a later TSTypePredicate reads it — imports are
    // always syntactically ahead of their usage, so one forward pass over the file is enough.
    const importSourceByLocalName = new Map<string, string>();

    return {
      ImportDeclaration: (node: TSESTree.ImportDeclaration): void => {
        const sourceValue = typeof node.source.value === 'string' ? node.source.value : undefined;
        if (sourceValue === undefined) {
          return;
        }

        const importSource = sourceValue;

        for (const specifier of node.specifiers) {
          importSourceByLocalName.set(specifier.local.name, importSource);
        }
      },

      TSTypePredicate: (node: TSESTree.TSTypePredicate): void => {
        // `asserts value` (no `is X` at all) carries no typeAnnotation — nothing to judge.
        const targetType = node.typeAnnotation?.typeAnnotation;
        if (targetType === undefined) {
          return;
        }

        const source = ctx.sourceCode;

        // `Quest['id']` — refused regardless of where Quest itself comes from: indexing into any
        // type for one field's type is reaching for a branded piece the same way a direct import
        // does.
        if (targetType.type === AST_NODE_TYPES.TSIndexedAccessType) {
          ctx.report({
            node,
            messageId: 'indexedTypePredicate',
            data: { typeName: source.getText(targetType) },
          });
          return;
        }

        if (targetType.type !== AST_NODE_TYPES.TSTypeReference) {
          return;
        }

        // The root identifier of a (possibly qualified) type name — `TSESTree.CallExpression`
        // roots at `TSESTree`, `Contracts.Quest` roots at `Contracts` — since only the root's own
        // import decides whether the whole chain reaches a contract.
        let typeNameNode = targetType.typeName;
        while (typeNameNode.type === AST_NODE_TYPES.TSQualifiedName) {
          typeNameNode = typeNameNode.left;
        }
        const rootIdentifierName =
          typeNameNode.type === AST_NODE_TYPES.Identifier ? typeNameNode.name : undefined;
        if (rootIdentifierName === undefined) {
          return;
        }

        const importSource = importSourceByLocalName.get(
          rootIdentifierName,
        );

        // Unresolved (a language global like Error, never imported), or an import whose source is
        // not a contracts/ path (a library, a workspace package's non-contracts export, our own
        // type elsewhere) — none of these is what BR C3 is about. String checks, not a regex —
        // brokers/ may not hold a regex literal (enforce-regex-usage confines those to statics,
        // contracts, guards and transformers).
        const isContractsImport =
          importSource !== undefined &&
          (importSource === 'contracts' ||
            importSource.includes('/contracts/') ||
            importSource.endsWith('/contracts') ||
            importSource.startsWith('contracts/'));
        if (!isContractsImport) {
          return;
        }

        ctx.report({
          node,
          messageId: 'contractTypePredicate',
          data: { typeName: source.getText(targetType), importSource },
        });
      },
    };
  },
});
