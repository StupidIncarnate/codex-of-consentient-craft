/**
 * PURPOSE: Immutable configuration for harness constructor side-effects validation
 *
 * USAGE:
 * import { harnessLifecycleStatics } from '../../statics/harness-lifecycle/harness-lifecycle-statics';
 * // harnessLifecycleStatics.allowedHooks — Jest/Playwright lifecycle hooks allowed in harness constructors
 */

export const harnessLifecycleStatics = {
  allowedHooks: ['beforeEach', 'afterEach', 'beforeAll', 'afterAll'] as const,
  allowedHookSet: new Set(['beforeEach', 'afterEach', 'beforeAll', 'afterAll']),
  allowedNodeBuiltins: ['fs', 'path', 'os'] as const,
  allowedNodeBuiltinSet: new Set(['fs', 'path', 'os']),
} as const;
