/**
 * PURPOSE: Checks if an array of AST statements contains any meaningful operation (call, throw, assignment, etc.)
 *
 * USAGE:
 * const meaningful = hasMeaningfulStatementLayerBroker({ statements });
 * // Returns true if any statement is a function call, throw, assignment, or non-undefined return
 */
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const hasMeaningfulStatementLayerBroker = ({
  statements,
}: {
  statements: Tsestree[];
}): boolean => {
  for (const statement of statements) {
    // ThrowStatement is always meaningful
    if (statement.type === 'ThrowStatement') {
      return true;
    }

    // ReturnStatement with a non-undefined argument is meaningful
    if (statement.type === 'ReturnStatement') {
      const { argument } = statement;

      // return; or return undefined; — not meaningful
      if (!argument) {
        continue;
      }

      if (argument.type === 'Identifier' && argument.name === 'undefined') {
        continue;
      }

      // return <something else> — meaningful
      return true;
    }

    // ExpressionStatement wrapping a CallExpression or AssignmentExpression
    if (statement.type === 'ExpressionStatement') {
      const { expression } = statement;

      if (expression?.type === 'CallExpression') {
        return true;
      }

      if (expression?.type === 'AssignmentExpression') {
        return true;
      }

      if (expression?.type === 'UpdateExpression') {
        return true;
      }

      if (expression?.type === 'AwaitExpression') {
        return true;
      }

      continue;
    }

    // VariableDeclaration — meaningful (assigning something)
    if (statement.type === 'VariableDeclaration') {
      return true;
    }

    // Control flow statements — meaningful
    if (
      statement.type === 'IfStatement' ||
      statement.type === 'SwitchStatement' ||
      statement.type === 'ForStatement' ||
      statement.type === 'ForInStatement' ||
      statement.type === 'ForOfStatement' ||
      statement.type === 'WhileStatement' ||
      statement.type === 'TryStatement'
    ) {
      return true;
    }
  }

  return false;
};
