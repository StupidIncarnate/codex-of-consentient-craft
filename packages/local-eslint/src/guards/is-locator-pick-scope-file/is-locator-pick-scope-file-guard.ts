/**
 * PURPOSE: Decides whether a filename sits inside the step-command broker implementations that
 * ban-locator-pick enforces against — everywhere else the rule stays silent, per the caution in
 * siegelense-recipes.md against a rule that looks broader than it is.
 *
 * USAGE:
 * isLocatorPickScopeFileGuard({ filename: '/repo/packages/siegelense/src/brokers/step/click/step-click-broker.ts' })
 * // Returns true
 * isLocatorPickScopeFileGuard({ filename: '/repo/packages/siegelense/src/startup/start-siegelense.ts' })
 * // Returns false
 *
 * WHEN-TO-USE: Only inside the ban-locator-pick rule broker.
 */
import { locatorPickStatics } from '../../statics/locator-pick/locator-pick-statics';

export const isLocatorPickScopeFileGuard = ({ filename }: { filename?: string }): boolean => {
  if (filename === undefined || filename.length === 0) {
    // Synthetic / unknown path — treat as out of scope so the rule stays silent on it.
    return false;
  }

  const normalized = filename.replace(/\\/gu, '/');
  return normalized.includes(locatorPickStatics.scope.inScopePathSubstring);
};
