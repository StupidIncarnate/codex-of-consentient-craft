/**
 * PURPOSE: Defines the kind of non-file action a step can target — verification, command, sweep-check, custom
 *
 * USAGE:
 * stepFocusActionKindContract.parse('verification');
 * // Returns: StepFocusActionKind
 *
 * verification — Run a tool and assert a result (ward, grep predicate, deployment health check)
 * command — Execute a shell command or build invocation (terraform apply, npm build)
 * sweep-check — Verify a scope predicate matches the desired state (no matches of pattern X across glob Y)
 * custom — Anything else that does not fit the above
 */

import { z } from 'zod';

export const stepFocusActionKindContract = z.enum([
  'verification',
  'command',
  'sweep-check',
  'custom',
]);

export type StepFocusActionKind = z.infer<typeof stepFocusActionKindContract>;
