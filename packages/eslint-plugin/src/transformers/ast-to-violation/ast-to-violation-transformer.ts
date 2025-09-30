import type { AstNode } from '../../contracts/ast-node/ast-node-contract';
import type { RuleViolation } from '../../contracts/rule-violation/rule-violation-contract';

export const astToViolationTransformer = ({
  node,
  message,
  messageId,
  data,
}: {
  node: AstNode;
  message: RuleViolation['message'];
  messageId?: RuleViolation['messageId'];
  data?: Record<string, unknown>;
}): RuleViolation => ({
  node,
  message,
  messageId,
  data,
});
