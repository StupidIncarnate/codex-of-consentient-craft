/**
 * PURPOSE: Defines caller-specific instruction preambles injected into spiritmender $ARGUMENTS
 *
 * USAGE:
 * spiritmenderContextStatics.wardFailure;
 * // Returns the instruction preamble for ward-failure spiritmender launches
 *
 * Each entry documents a distinct orchestrator launch context. The preamble is prepended
 * to the spiritmender's Error Context section so the agent knows how to approach the fix.
 */

export const spiritmenderContextStatics = {
  wardFailure: {
    instructions: `## Instructions
You are fixing ward failures (lint, type-check, or test errors) in specific files.
Examine each error message to understand the root cause. Check git diff to see recent changes that may have introduced the issue.
Fix errors in dependency order: compilation → type errors → test failures → lint.
Run the verification command after each fix to confirm resolution.`,
  },

  buildFailure: {
    instructions: `## Instructions
The project build command failed. No specific files are listed — you must investigate.
Read the error output below to identify which files have compilation errors.
Check git diff to see what changed recently. Trace import chains if errors reference missing exports.
After fixing, run the verification command to confirm the build passes.`,
  },

  devServerStartFailure: {
    instructions: `## Instructions
The dev server failed to start. No specific files are listed — you must investigate.
Read the error below. Common causes: port conflict, missing dependency, config error, build artifact issue, syntax error in entry point.
Check the dev command, project config files, and recent git changes. Fix the root cause.
After fixing, run the verification command to confirm the dev server starts.`,
  },

  lawbringerFailure: {
    instructions: `## Instructions
A code review agent (lawbringer) found issues it could not auto-fix in the listed files.
Read the failure summary below for context on what is wrong.
Examine the files, understand the issue, and fix it. Run npm run ward on the files to verify.`,
  },
} as const;
