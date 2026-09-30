/**
 * PURPOSE: Tells whether a field parse copies an object's own id into that same object's field, the
 * one re-brand `ban-id-rebrand` allows (`folder: questContract.shape.folder.parse(fields.folder ?? id)`
 * beside the quest's own `id`). The exemption is narrow: the parsed field and an `id` property must be
 * properties of ONE object literal that is itself the argument of a whole-object `.parse(...)` call,
 * and the field parse's argument must read the very expression that `id` property holds. The same
 * function, the same broker or a neighbouring object's id never qualify. The field reaches that
 * literal either as the literal's own property value, or as a const whose name the literal lists.
 * Pure syntax, no type checker: nodes are compared by shape with `parent`, `range` and `loc` left out.
 *
 * USAGE:
 * sameObjectExemptionLayerBroker({ node: fieldParseCallNode });
 * // true for `const folder = c.shape.folder.parse(fields.folder ?? id);` when `c.parse({ id, folder })` follows
 * // false for `mintedBy: c.shape.mintedBy.parse(parent.id)` inside an object that is not parsed with an `id`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { astCollectNodesTransformer } from '../../../transformers/ast-collect-nodes/ast-collect-nodes-transformer';
import { astPropertyKeyNameTransformer } from '../../../transformers/ast-property-key-name/ast-property-key-name-transformer';

export const sameObjectExemptionLayerBroker = ({ node }: { node: unknown }): boolean => {
  // `parent` makes a real node cyclic, so it is read structurally
  const fieldParse = node as TSESTree.Node;

  if (fieldParse.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }

  const [argument] = fieldParse.arguments;
  const { parent } = fieldParse;

  if (argument === undefined) {
    return false;
  }

  const isPropertyValue = parent.type === AST_NODE_TYPES.Property && parent.value === fieldParse;
  const constName =
    parent.type === AST_NODE_TYPES.VariableDeclarator &&
    parent.init === fieldParse &&
    parent.id.type === AST_NODE_TYPES.Identifier
      ? parent.id.name
      : undefined;
  const block =
    parent.type === AST_NODE_TYPES.VariableDeclarator ? parent.parent.parent : undefined;

  const candidateObjects: TSESTree.Node[] = [];
  if (isPropertyValue) {
    candidateObjects.push(parent.parent);
  }
  if (constName !== undefined && block !== undefined) {
    candidateObjects.push(
      ...astCollectNodesTransformer({ node: block, type: AST_NODE_TYPES.ObjectExpression }),
    );
  }

  const argumentMembers = astCollectNodesTransformer({
    node: argument,
    type: AST_NODE_TYPES.MemberExpression,
  });
  // The argument may itself be a member read, so its own property name is excluded too.
  const memberProperties = new Set<TSESTree.Node | undefined>(
    [argument, ...argumentMembers].map((member) =>
      member.type === AST_NODE_TYPES.MemberExpression ? member.property : undefined,
    ),
  );
  const argumentReads = [
    argument,
    ...argumentMembers,
    ...astCollectNodesTransformer({ node: argument, type: AST_NODE_TYPES.Identifier }).filter(
      (identifier) => !memberProperties.has(identifier),
    ),
  ];

  return candidateObjects.some((objectNode) => {
    if (objectNode.type !== AST_NODE_TYPES.ObjectExpression) {
      return false;
    }

    const wholeParse = objectNode.parent;
    const isWholeParseArgument =
      wholeParse.type === AST_NODE_TYPES.CallExpression &&
      wholeParse.arguments[0] === objectNode &&
      wholeParse.callee.type === AST_NODE_TYPES.MemberExpression &&
      !wholeParse.callee.computed &&
      wholeParse.callee.property.type === AST_NODE_TYPES.Identifier &&
      ['parse', 'safeParse', 'parseAsync', 'safeParseAsync'].includes(
        wholeParse.callee.property.name,
      );

    if (!isWholeParseArgument) {
      return false;
    }

    const holdsField = objectNode.properties.some(
      (property) =>
        property.type === AST_NODE_TYPES.Property &&
        (isPropertyValue
          ? property === parent
          : property.value.type === AST_NODE_TYPES.Identifier && property.value.name === constName),
    );
    const idValues = objectNode.properties.flatMap((property) =>
      property.type === AST_NODE_TYPES.Property &&
      property !== parent &&
      astPropertyKeyNameTransformer({ property }) === 'id'
        ? [property.value]
        : [],
    );

    if (!holdsField) {
      return false;
    }

    // One replacer serves both lists; the first `argumentReads.length` keys are the argument's.
    const keys = [...argumentReads, ...idValues].map((read) =>
      JSON.stringify(read, (key: string, value: unknown) =>
        key === 'parent' || key === 'range' || key === 'loc' ? undefined : value,
      ),
    );
    const argumentKeys = new Set(keys.slice(0, argumentReads.length));

    return keys.slice(argumentReads.length).some((idKey) => argumentKeys.has(idKey));
  });
};
