/**
 * PURPOSE: Determines if an identifier name qualifies as a quest/work-item "status holder" per the ban-quest-status-literals allowlist (default holders + /Quest$|Item$/ + rule-option extras).
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
 * WHEN-TO-USE: Only the ban-quest-status-literals rule / its helpers should call this.
 */
import { statusLiteralStatics } from '../../statics/status-literal/status-literal-statics';

const defaultHolderNames: readonly string[] =
  statusLiteralStatics.defaultStatusHolderIdentifiers.map((name) => name);
const holderSuffixRegex = new RegExp(statusLiteralStatics.statusHolderIdentifierSuffixPattern, 'u');

export const matchesStatusHolderIdentifierGuard = ({
  identifierName,
  extraAllowlist,
}: {
  identifierName?: string;
  extraAllowlist?: readonly string[];
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
