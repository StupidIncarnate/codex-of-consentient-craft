/**
 * PURPOSE: Tells whether an identifier is an object-literal property KEY — `{stdout: 1}`, where
 * `stdout` names a property, and the key half of `{stdout}` shorthand. A key is never checked. A
 * real ESLint AST gives a shorthand's key and value SEPARATE node objects (never the same
 * reference), so the value half is not a key here and is checked: typedParserServicesTransformer
 * resolves it to the outer binding it reads.
 *
 * USAGE:
 * isObjectLiteralKeyLabelLayerBroker({ node });
 * // Returns true for the `stdout` key in `{stdout: 1}` (skip it as a reference)
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const isObjectLiteralKeyLabelLayerBroker = ({ node }: { node: TSESTree.Node }): boolean =>
  node.parent?.type === AST_NODE_TYPES.Property && node.parent.key === node;
