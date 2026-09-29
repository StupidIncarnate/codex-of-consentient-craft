/**
 * PURPOSE: Checks if a function body contains contract.parse() calls
 *
 * USAGE:
 * const funcNode = // AST node for: () => userContract.parse({ name: 'John' })
 * if (isAstFunctionUsesContractParseGuard({ funcNode })) {
 *   // Function uses contract.parse() in return or variable declaration
 * }
 * // Returns true if function body contains direct or spread contract.parse() calls
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isAstContractParseCallGuard } from '../is-ast-contract-parse-call/is-ast-contract-parse-call-guard';
import { isAstObjectContractParseSpreadGuard } from '../is-ast-object-contract-parse-spread/is-ast-object-contract-parse-spread-guard';

export const isAstFunctionUsesContractParseGuard = ({
  funcNode,
}: {
  funcNode?: TSESTree.Node;
}): boolean => {
  if (funcNode === undefined) {
    return false;
  }

  const body = 'body' in funcNode ? funcNode.body : undefined;
  if (!body) {
    return false;
  }

  // body can be an array (BlockStatement.body) or a single node (arrow function expression)
  if (Array.isArray(body)) {
    return false; // This shouldn't happen at this level
  }

  // Handle arrow function with expression body: () => contract.parse({})
  if (body.type === AST_NODE_TYPES.CallExpression) {
    return isAstContractParseCallGuard({ node: body });
  }

  // Handle arrow function with expression body: () => ({ ...contract.parse({}) })
  if (body.type === AST_NODE_TYPES.ObjectExpression) {
    return isAstObjectContractParseSpreadGuard({ node: body });
  }

  // Handle arrow function or regular function with block body: () => { return contract.parse({}) }
  if (body.type === AST_NODE_TYPES.BlockStatement && Array.isArray(body.body)) {
    // Check if contract.parse() is called anywhere in the function
    const hasContractParse = body.body.some((statement) => {
      // Check return statements
      if (statement.type === AST_NODE_TYPES.ReturnStatement && statement.argument) {
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
      if (statement.type === AST_NODE_TYPES.VariableDeclaration) {
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
