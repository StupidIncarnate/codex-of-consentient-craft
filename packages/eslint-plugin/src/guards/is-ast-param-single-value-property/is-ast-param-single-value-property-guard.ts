import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstParamSingleValuePropertyGuard = ({
  funcNode,
}: {
  funcNode?: Tsestree;
}): boolean => {
  if (!funcNode?.params || funcNode.params.length === 0) {
    return false;
  }

  const [firstParam] = funcNode.params;
  if (!firstParam) {
    return false;
  }

  // Handle both ObjectPattern and AssignmentPattern wrapping ObjectPattern
  const pattern =
    firstParam.type === 'ObjectPattern'
      ? firstParam
      : firstParam.type === 'AssignmentPattern' && firstParam.left
        ? firstParam.left
        : null;

  if (!pattern || pattern.type !== 'ObjectPattern') {
    return false;
  }

  const { properties } = pattern;
  if (!properties || properties.length !== 1) {
    return false;
  }

  const [prop] = properties;
  if (!prop) {
    return false;
  }

  // Check if it's a single property named 'value'
  return prop.type === 'Property' && prop.key?.type === 'Identifier' && prop.key.name === 'value';
};
