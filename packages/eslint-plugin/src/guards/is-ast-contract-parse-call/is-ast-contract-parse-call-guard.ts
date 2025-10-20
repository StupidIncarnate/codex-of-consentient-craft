import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

export const isAstContractParseCallGuard = ({ node }: { node?: Tsestree }): boolean => {
  if (node === undefined || node.type !== 'CallExpression' || !node.callee) {
    return false;
  }

  const { callee } = node;
  if (callee.type !== 'MemberExpression') {
    return false;
  }

  const { object, property } = callee;
  return Boolean(
    object &&
      object.type === 'Identifier' &&
      object.name &&
      object.name.endsWith('Contract') &&
      property &&
      property.type === 'Identifier' &&
      property.name === 'parse',
  );
};
