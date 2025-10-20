import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import { isAstContractParseCallGuard } from '../is-ast-contract-parse-call/is-ast-contract-parse-call-guard';
import { isAstObjectContractParseSpreadGuard } from '../is-ast-object-contract-parse-spread/is-ast-object-contract-parse-spread-guard';

export const isAstFunctionUsesContractParseGuard = ({
  funcNode,
}: {
  funcNode?: Tsestree;
}): boolean => {
  if (funcNode === undefined) {
    return false;
  }

  const { body } = funcNode;
  if (!body) {
    return false;
  }

  // body can be an array (BlockStatement.body) or a single node (arrow function expression)
  if (Array.isArray(body)) {
    return false; // This shouldn't happen at this level
  }

  // Handle arrow function with expression body: () => contract.parse({})
  if (body.type === 'CallExpression') {
    return isAstContractParseCallGuard({ node: body });
  }

  // Handle arrow function with expression body: () => ({ ...contract.parse({}) })
  if (body.type === 'ObjectExpression') {
    return isAstObjectContractParseSpreadGuard({ node: body });
  }

  // Handle arrow function or regular function with block body: () => { return contract.parse({}) }
  if (body.type === 'BlockStatement' && body.body && Array.isArray(body.body)) {
    // Check if contract.parse() is called anywhere in the function
    const hasContractParse = body.body.some((statement) => {
      // Check return statements
      if (statement.type === 'ReturnStatement' && statement.argument) {
        // Direct call: return contract.parse({})
        if (isAstContractParseCallGuard({ node: statement.argument })) {
          return true;
        }
        // Spread in object: return { ...contract.parse({}), other: 'props' }
        if (isAstObjectContractParseSpreadGuard({ node: statement.argument })) {
          return true;
        }
      }

      // Check variable declarations: const validated = contract.parse({})
      if (statement.type === 'VariableDeclaration' && statement.declarations) {
        return statement.declarations.some((decl) => {
          if (decl.init) {
            return isAstContractParseCallGuard({ node: decl.init });
          }
          return false;
        });
      }

      return false;
    });

    return hasContractParse;
  }

  return false;
};
