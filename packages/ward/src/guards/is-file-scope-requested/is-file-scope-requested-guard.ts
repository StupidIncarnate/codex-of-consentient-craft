/**
 * PURPOSE: Answers "did this run ASK for a file scope" from the config's own fields, so the callers
 * that must refuse to widen a run — `commandRunBroker`'s empty-scope short-circuit above all — never
 * spell a flag name themselves. Reach for this over reading `config.passthrough` directly whenever
 * the question is about the REQUEST; `Array.isArray(passthrough) && length > 0` answers the separate
 * question of whether that request RESOLVED to files, and the two disagree exactly where the bug is.
 *
 * USAGE:
 * isFileScopeRequestedGuard({ config: WardConfigStub({ staged: true }) });
 * // Returns: true
 * isFileScopeRequestedGuard({ config: WardConfigStub({ only: ['lint'] }) });
 * // Returns: false — `--only` picks check types, not files
 *
 * A CLASSIFICATION IS OWED FOR EVERY FIELD, and `satisfies Record<keyof WardConfig, WardScopeKind>`
 * is what collects it: a field added to `wardConfigContract` without a kind here fails `tsc` with
 * "Property '<name>' is missing", and a kind spelled outside the union fails on the value. A field
 * REMOVED from the contract fails too — the excess-property check `satisfies` runs on this object
 * literal has nowhere to put the leftover. That is the whole point of a table rather than an `||`
 * chain: an `||` chain of flag names goes stale silently, and a file scope read as absent is read
 * as the WHOLE REPO.
 */

import type { WardConfig } from '../../contracts/ward-config/ward-config-contract';

type WardScopeKind = 'fileScope' | 'typeFilter' | 'testNameFilter';

const SCOPE_KIND_BY_FIELD = {
  only: 'typeFilter',
  onlyTests: 'testNameFilter',
  changed: 'fileScope',
  staged: 'fileScope',
  passthrough: 'fileScope',
} as const satisfies Record<keyof WardConfig, WardScopeKind>;

const FILE_SCOPE_FIELDS = (Object.keys(SCOPE_KIND_BY_FIELD) as (keyof WardConfig)[]).filter(
  (field) => SCOPE_KIND_BY_FIELD[field] === 'fileScope',
);

export const isFileScopeRequestedGuard = ({ config }: { config?: WardConfig }): boolean => {
  if (config === undefined) {
    return false;
  }

  return FILE_SCOPE_FIELDS.some((field) => {
    const value = config[field];

    // An EMPTY list still counts as a request. It is a file scope that resolved to nothing, and the
    // caller that treats it as "no scope" runs the whole repo — the exact outcome this guard exists
    // to keep unreachable. `false` is the mirror case: a flag explicitly turned off asks for nothing.
    return value !== undefined && value !== false;
  });
};
