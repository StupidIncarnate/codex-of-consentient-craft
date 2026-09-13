/**
 * PURPOSE: Stamps the node a report should point at onto an already-built violation, so a rule can
 * assemble the message/messageId/data payload separately from the AST location it belongs to.
 *
 * USAGE:
 * const violation = astToViolationTransformer({
 *   node: astNode,
 *   violation: RuleViolationStub({ message: 'Expected export name to match filename', messageId: 'invalidName' }),
 * });
 * // Returns { node, message, messageId, data }
 *
 * WHEN-TO-USE: When reporting ESLint rule violations from custom rules
 */
import type { AstNode } from '../../contracts/ast-node/ast-node-contract';
import type { RuleViolation } from '../../contracts/rule-violation/rule-violation-contract';

export const astToViolationTransformer = ({
  node,
  violation,
}: {
  node: AstNode;
  violation: RuleViolation;
}): RuleViolation => ({
  node,
  message: violation.message,
  messageId: violation.messageId,
  data: violation.data,
});
