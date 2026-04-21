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
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Tsestree } from '@dungeonmaster/eslint-plugin';
import { matchesStatusHolderIdentifierGuard } from '../../../guards/matches-status-holder-identifier/matches-status-holder-identifier-guard';

export const isStatusMemberExpressionLayerBroker = ({
  node,
  extraAllowlist,
}: {
  node?: Tsestree | null;
  extraAllowlist?: readonly Identifier[];
}): boolean => {
  if (node === null || node === undefined || node.type !== 'MemberExpression') {
    return false;
  }
  const { property } = node;
  if (property === null || property === undefined || property.type !== 'Identifier') {
    return false;
  }
  if (String(property.name ?? '') !== 'status') {
    return false;
  }

  const { object } = node;
  if (object === null || object === undefined) {
    return false;
  }

  // Case 1: `quest.status` — object is an Identifier.
  if (object.type === 'Identifier') {
    return matchesStatusHolderIdentifierGuard(
      extraAllowlist === undefined
        ? { identifierName: identifierContract.parse(String(object.name ?? '')) }
        : {
            identifierName: identifierContract.parse(String(object.name ?? '')),
            extraAllowlist,
          },
    );
  }

  // Case 2: `postResult.quest.status` — object is a MemberExpression whose terminal property is the holder name.
  if (object.type === 'MemberExpression') {
    const innerProperty = object.property;
    if (
      innerProperty === null ||
      innerProperty === undefined ||
      innerProperty.type !== 'Identifier'
    ) {
      return false;
    }
    return matchesStatusHolderIdentifierGuard(
      extraAllowlist === undefined
        ? { identifierName: identifierContract.parse(String(innerProperty.name ?? '')) }
        : {
            identifierName: identifierContract.parse(String(innerProperty.name ?? '')),
            extraAllowlist,
          },
    );
  }

  return false;
};
