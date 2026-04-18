/**
 * PURPOSE: Determines if an identifier name qualifies as a quest/work-item "status holder" per the ban-status-string-comparisons allowlist (default holders + /Quest$|Item$/ + rule-option extras).
 *
 * USAGE:
 * matchesStatusHolderIdentifierGuard({ identifierName: 'quest', extraAllowlist: [] });
 * // Returns true
 * matchesStatusHolderIdentifierGuard({ identifierName: 'someQuest', extraAllowlist: [] });
 * // Returns true (matches /Quest$/)
 * matchesStatusHolderIdentifierGuard({ identifierName: 'random', extraAllowlist: ['random'] });
 * // Returns true (rule-options extra)
 * matchesStatusHolderIdentifierGuard({ identifierName: 'random', extraAllowlist: [] });
 * // Returns false
 *
 * WHEN-TO-USE: Only the ban-status-string-comparisons rule / its helpers should call this.
 */
import { identifierContract, type Identifier } from '@dungeonmaster/shared/contracts';
import { statusLiteralStatics } from '../../statics/status-literal/status-literal-statics';

const defaultHolderNames: readonly Identifier[] =
  statusLiteralStatics.defaultStatusHolderIdentifiers.map((name) => identifierContract.parse(name));
const holderSuffixRegex = new RegExp(statusLiteralStatics.statusHolderIdentifierSuffixPattern, 'u');

export const matchesStatusHolderIdentifierGuard = ({
  identifierName,
  extraAllowlist,
}: {
  identifierName?: Identifier;
  extraAllowlist?: readonly Identifier[];
}): boolean => {
  if (identifierName === undefined || identifierName.length === 0) {
    return false;
  }
  if (defaultHolderNames.some((name) => name === identifierName)) {
    return true;
  }
  if (extraAllowlist?.some((name) => name === identifierName) === true) {
    return true;
  }
  return holderSuffixRegex.test(identifierName);
};
