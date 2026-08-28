/**
 * PURPOSE: Answers "did the CALLER type these paths, or did git produce them" — the distinction
 * `config.passthrough` alone cannot make, because `commandRunLayerGitScopeBroker` writes a
 * `--changed`/`--staged` diff into that very field. Reach for this over `isFileScopeRequestedGuard`
 * whenever a rule may only bind paths a human named: that guard says a file scope was asked for at
 * all, this one says WHO asked. A git diff legitimately carries root-level files nothing lints, so a
 * rule that reddens on "nothing processed it" would break ordinary `--staged` runs if it could not
 * tell the two apart.
 *
 * USAGE:
 * isExplicitPathScopeGuard({ config: WardConfigStub({ passthrough: ['scripts/x.mjs'] }) });
 * // Returns: true
 * isExplicitPathScopeGuard({ config: WardConfigStub({ staged: true, passthrough: ['src/a.ts'] }) });
 * // Returns: false — the paths came from the diff, not from the caller
 *
 * THE GIT FLAGS ARE CHECKED, NOT JUST `passthrough`, so the answer does not depend on whether the
 * caller hands over the config from BEFORE or AFTER the git scope layer: `changed`/`staged` survive
 * that layer untouched, so a git-derived scope reads as git-derived either way.
 *
 * A CLASSIFICATION IS OWED FOR EVERY FIELD, and `satisfies Record<keyof WardConfig, WardPathOrigin>`
 * collects it — the same build-time trap `isFileScopeRequestedGuard` sets, for a different question.
 * A field added to `wardConfigContract` without an origin fails `tsc`; so does one removed. A second
 * way to name paths therefore cannot be added without deciding whether a human typed it.
 */

import type { WardConfig } from '../../contracts/ward-config/ward-config-contract';

type WardPathOrigin = 'callerTyped' | 'gitDerived' | 'notAFileScope';

const PATH_ORIGIN_BY_FIELD = {
  only: 'notAFileScope',
  onlyTests: 'notAFileScope',
  changed: 'gitDerived',
  staged: 'gitDerived',
  passthrough: 'callerTyped',
} as const satisfies Record<keyof WardConfig, WardPathOrigin>;

const FIELDS = Object.keys(PATH_ORIGIN_BY_FIELD) as (keyof WardConfig)[];

const GIT_DERIVED_FIELDS = FIELDS.filter((field) => PATH_ORIGIN_BY_FIELD[field] === 'gitDerived');
const CALLER_TYPED_FIELDS = FIELDS.filter((field) => PATH_ORIGIN_BY_FIELD[field] === 'callerTyped');

export const isExplicitPathScopeGuard = ({ config }: { config?: WardConfig }): boolean => {
  if (config === undefined) {
    return false;
  }

  if (GIT_DERIVED_FIELDS.some((field) => config[field] === true)) {
    return false;
  }

  // An EMPTY list is not an explicit scope for this question, unlike in `isFileScopeRequestedGuard`.
  // There is no path in it to report as unprocessed, and the empty-scope short-circuit has already
  // stopped that run before any check could report anything.
  return CALLER_TYPED_FIELDS.some((field) => {
    const value = config[field];

    return Array.isArray(value) && value.length > 0;
  });
};
