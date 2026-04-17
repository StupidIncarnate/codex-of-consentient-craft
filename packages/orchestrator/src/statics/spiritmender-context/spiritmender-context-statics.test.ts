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
A code review agent (lawbringer) found issues it could not auto-fix in the listed files. Read the failure summary below for context on what is wrong. Examine the files, understand the issue, and fix it. Run npm run ward on the files to verify.`,
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
A code review agent (lawbringer) found issues it could not auto-fix in the listed files. Read the failure summary below for context on what is wrong. Examine the files, understand the issue, and fix it. Run npm run ward on the files to verify.`,
    );
  });

  it('VALID: postBlightwardenFailure => instructions has expected content', () => {
    expect(spiritmenderContextStatics.postBlightwardenFailure.instructions).toBe(
      `## Instructions
Blightwarden may have intentionally removed code; check \`git log\` before re-adding deletions. You are fixing ward failures (lint, type-check, or test errors) in specific files AFTER a Blightwarden pass that may have deleted dead exports, consolidated duplicates, or removed unreachable branches. Before reverting any deletion, inspect recent commits to confirm the removal was intentional. Fix the underlying issue (update call sites, adjust tests, etc.) rather than restoring deleted code. Run the verification command after each fix to confirm resolution.`,
    );
  });
});
