/**
 * PURPOSE: True when the spec's own `env`, or some process's `args`, `env` or `readyPath`, still
 * carries the given `{token}` literally — every place `laneBootBroker` runs a value through
 * `lanePlaceholderSubstituteTransformer` or `laneEnvSubstituteTransformer`. Gates workspace
 * resolution — real disk I/O, and a genuine throw when the kind matches none or several packages —
 * so it runs ONLY for a token something in the spec actually needs. A spec with no http-backend
 * process in a repo that never built one must still boot.
 *
 * USAGE:
 * isLaneSpecTokenReferencedGuard({ spec: LaneSpecStub(), token: '{apiWorkspace}' });
 * // Returns true when the spec's env, or some process's args/env/readyPath, contains that token
 */
import type { LaneSpec } from '../../contracts/lane-spec/lane-spec-contract';

export const isLaneSpecTokenReferencedGuard = ({
  spec,
  token,
}: {
  spec?: LaneSpec;
  token?: string;
}): boolean => {
  if (spec === undefined || token === undefined) {
    return false;
  }
  if (Object.values(spec.env).some((value) => value?.includes(token) ?? false)) {
    return true;
  }
  return spec.processes.some(
    (laneProcess) =>
      laneProcess.args.some((arg) => arg.includes(token)) ||
      Object.values(laneProcess.env).some((value) => value?.includes(token) ?? false) ||
      (laneProcess.readyPath?.includes(token) ?? false),
  );
};
