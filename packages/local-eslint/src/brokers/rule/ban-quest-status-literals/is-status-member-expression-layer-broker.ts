/**
 * PURPOSE: Checks if an AST node is a MemberExpression accessing `.status` on an allowlisted quest/work-item holder identifier (e.g., `quest.status`, `workItem.status`, `postResult.quest.status`).
 *
 * USAGE:
 * isStatusMemberExpressionLayerBroker({ node, extraAllowlist: [] });
 * // Returns true if node is `quest.status` or a dotted holder (`postResult.quest.status`).
 *
 * WHEN-TO-USE: Only the ban-quest-status-literals rule should call this.
 */
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { matchesStatusHolderIdentifierGuard } from '../../../guards/matches-status-holder-identifier/matches-status-holder-identifier-guard';

export const isStatusMemberExpressionLayerBroker = ({
  node,
  extraAllowlist,
}: {
  node?: TSESTree.Node | null;
  extraAllowlist?: readonly string[];
}): boolean => {
  if (node === null || node === undefined || node.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }
  const { property } = node;
  if (property.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }
  if (property.name !== 'status') {
    return false;
  }

  const { object } = node;

  // Case 1: `quest.status` — object is an Identifier.
  if (object.type === AST_NODE_TYPES.Identifier) {
    return matchesStatusHolderIdentifierGuard(
      extraAllowlist === undefined
        ? { identifierName: object.name }
        : {
            identifierName: object.name,
            extraAllowlist,
          },
    );
  }

  // Case 2: `postResult.quest.status` — object is a MemberExpression whose terminal property is the holder name.
  if (object.type === AST_NODE_TYPES.MemberExpression) {
    const innerProperty = object.property;
    if (innerProperty.type !== AST_NODE_TYPES.Identifier) {
      return false;
    }
    return matchesStatusHolderIdentifierGuard(
      extraAllowlist === undefined
        ? { identifierName: innerProperty.name }
        : {
            identifierName: innerProperty.name,
            extraAllowlist,
          },
    );
  }

  return false;
};
