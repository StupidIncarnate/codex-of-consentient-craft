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
You are fixing ward failures (lint, type-check, or test errors) in specific files. Examine each error message to understand the root cause. Check git diff to see recent changes that may have introduced the issue. Fix errors in dependency order: compilation → type errors → test failures → lint. Run the verification command after each fix to confirm resolution.`,
  },

  buildFailure: {
    instructions: `## Instructions
The project build command failed. No specific files are listed — you must investigate. Read the error output below to identify which files have compilation errors. Check git diff to see what changed recently. Trace import chains if errors reference missing exports. After fixing, run the verification command to confirm the build passes.`,
  },

  devServerStartFailure: {
    instructions: `## Instructions
The dev server failed to start. No specific files are listed — you must investigate. Read the error below. Common causes: port conflict, missing dependency, config error, build artifact issue, syntax error in entry point. Check the dev command, project config files, and recent git changes. Fix the root cause. After fixing, run the verification command to confirm the dev server starts.`,
  },

  lawbringerFailure: {
    instructions: `## Instructions
A code review agent (lawbringer) found issues it could not auto-fix in the listed files. Read the failure summary below for context on what is wrong. Examine the files, understand the issue, and fix it. Run ward scoped to those files (\`npm run ward -- -- <the listed files>\`) to verify.`,
  },

  siegemasterFailure: {
    instructions: `## Instructions
A manual-QA agent (Siegemaster) ran the real system by hand and found the flow broken — a failed observable, a path the implementation never finished (an unbuilt control, an unreachable terminal, a stub / TODO), a path that breaks under timing/chaos/config/abuse, or a test that passes while the flow is genuinely broken (a false-positive green). The finding below is your spec — Siegemaster changes NO files, so you own the fix, and when the finding is marked INCOMPLETE you own building the missing piece. Reproduce the finding first. If a test was green while the flow was broken, correct that test so it FAILS on the current (unfixed) code — watch it go red — then fix the implementation until it passes; never weaken a test to make it green. If the finding is a real break or an INCOMPLETE/unbuilt path with no covering test, add the failing test red-first, then build or fix the implementation until it passes. A fresh Siegemaster re-walks the flow after you, so fix the root cause, not the symptom. Run ward scoped to the files you touched (\`npm run ward -- -- <the files>\`) to verify.`,
  },

  postBlightwardenFailure: {
    instructions: `## Instructions
Blightwarden may have intentionally removed code; check \`git log\` before re-adding deletions. You are fixing ward failures (lint, type-check, or test errors) in specific files AFTER a Blightwarden pass that may have deleted dead exports, consolidated duplicates, or removed unreachable branches. Before reverting any deletion, inspect recent commits to confirm the removal was intentional. Fix the underlying issue (update call sites, adjust tests, etc.) rather than restoring deleted code. Run the verification command after each fix to confirm resolution.`,
  },
} as const;
