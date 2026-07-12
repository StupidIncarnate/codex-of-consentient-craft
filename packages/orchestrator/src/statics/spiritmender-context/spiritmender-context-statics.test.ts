import { spiritmenderContextStatics } from './spiritmender-context-statics';

describe('spiritmenderContextStatics', () => {
  it('VALID: exported value => has expected structure with all context keys', () => {
    expect(spiritmenderContextStatics).toStrictEqual({
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
      roleFailure: {
        instructions: `## Instructions
An implementation agent could not complete or verify its slice and reported the finding below as a code failure (not a plan gap). Read the finding, reproduce the problem, and fix the root cause in the affected files. If a test is wrong, correct it red-first — watch it fail on the current code — before fixing the implementation; never weaken a test to make it green. A fresh run of the same agent follows you to continue its work, so fix the root cause, not the symptom, and leave the slice building. Run ward scoped to the files you touched (\`npm run ward -- -- <the files you fixed>\`) to verify.`,
      },
      postBlightwardenFailure: {
        instructions: `## Instructions
Blightwarden may have intentionally removed code; check \`git log\` before re-adding deletions. You are fixing ward failures (lint, type-check, or test errors) in specific files AFTER a Blightwarden pass that may have deleted dead exports, consolidated duplicates, or removed unreachable branches. Before reverting any deletion, inspect recent commits to confirm the removal was intentional. Fix the underlying issue (update call sites, adjust tests, etc.) rather than restoring deleted code. Run the verification command after each fix to confirm resolution.`,
      },
    });
  });

  it('VALID: wardFailure => instructions has expected content', () => {
    expect(spiritmenderContextStatics.wardFailure.instructions).toBe(
      `## Instructions
You are fixing ward failures (lint, type-check, or test errors) in specific files. Examine each error message to understand the root cause. Check git diff to see recent changes that may have introduced the issue. Fix errors in dependency order: compilation → type errors → test failures → lint. Run the verification command after each fix to confirm resolution.`,
    );
  });

  it('VALID: buildFailure => instructions has expected content', () => {
    expect(spiritmenderContextStatics.buildFailure.instructions).toBe(
      `## Instructions
The project build command failed. No specific files are listed — you must investigate. Read the error output below to identify which files have compilation errors. Check git diff to see what changed recently. Trace import chains if errors reference missing exports. After fixing, run the verification command to confirm the build passes.`,
    );
  });

  it('VALID: devServerStartFailure => instructions has expected content', () => {
    expect(spiritmenderContextStatics.devServerStartFailure.instructions).toBe(
      `## Instructions
The dev server failed to start. No specific files are listed — you must investigate. Read the error below. Common causes: port conflict, missing dependency, config error, build artifact issue, syntax error in entry point. Check the dev command, project config files, and recent git changes. Fix the root cause. After fixing, run the verification command to confirm the dev server starts.`,
    );
  });

  it('VALID: lawbringerFailure => instructions has expected content', () => {
    expect(spiritmenderContextStatics.lawbringerFailure.instructions).toBe(
      `## Instructions
A code review agent (lawbringer) found issues it could not auto-fix in the listed files. Read the failure summary below for context on what is wrong. Examine the files, understand the issue, and fix it. Run ward scoped to those files (\`npm run ward -- -- <the listed files>\`) to verify.`,
    );
  });

  it('VALID: siegemasterFailure => instructions has expected content', () => {
    expect(spiritmenderContextStatics.siegemasterFailure.instructions).toBe(
      `## Instructions
A manual-QA agent (Siegemaster) ran the real system by hand and found the flow broken — a failed observable, a path the implementation never finished (an unbuilt control, an unreachable terminal, a stub / TODO), a path that breaks under timing/chaos/config/abuse, or a test that passes while the flow is genuinely broken (a false-positive green). The finding below is your spec — Siegemaster changes NO files, so you own the fix, and when the finding is marked INCOMPLETE you own building the missing piece. Reproduce the finding first. If a test was green while the flow was broken, correct that test so it FAILS on the current (unfixed) code — watch it go red — then fix the implementation until it passes; never weaken a test to make it green. If the finding is a real break or an INCOMPLETE/unbuilt path with no covering test, add the failing test red-first, then build or fix the implementation until it passes. A fresh Siegemaster re-walks the flow after you, so fix the root cause, not the symptom. Run ward scoped to the files you touched (\`npm run ward -- -- <the files>\`) to verify.`,
    );
  });

  it('VALID: postBlightwardenFailure => instructions has expected content', () => {
    expect(spiritmenderContextStatics.postBlightwardenFailure.instructions).toBe(
      `## Instructions
Blightwarden may have intentionally removed code; check \`git log\` before re-adding deletions. You are fixing ward failures (lint, type-check, or test errors) in specific files AFTER a Blightwarden pass that may have deleted dead exports, consolidated duplicates, or removed unreachable branches. Before reverting any deletion, inspect recent commits to confirm the removal was intentional. Fix the underlying issue (update call sites, adjust tests, etc.) rather than restoring deleted code. Run the verification command after each fix to confirm resolution.`,
    );
  });
});
