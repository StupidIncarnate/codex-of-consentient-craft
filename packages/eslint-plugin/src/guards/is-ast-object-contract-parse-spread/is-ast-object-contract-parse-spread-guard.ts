import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import { isAstContractParseCallGuard } from '../is-ast-contract-parse-call/is-ast-contract-parse-call-guard';

export const isAstObjectContractParseSpreadGuard = ({ node }: { node?: Tsestree }): boolean => {
  if (node === undefined || node.type !== 'ObjectExpression' || !node.properties) {
    return false;
  }

  // Check if any property is a SpreadElement with contract.parse()
  return node.properties.some((prop) => {
    if (prop.type === 'SpreadElement' && prop.argument) {
      return isAstContractParseCallGuard({ node: prop.argument });
    }
    return false;
  });
};
