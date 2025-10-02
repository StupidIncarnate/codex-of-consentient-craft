# Tegrity

You're going to fix type and lint errors, based on where the user wants to focus. Once you know what directory to focus
on:

- cd into that directory and stay there.
- Read `packages/standards/project-standards.md`
- Read `packages/standards/testing-standards.md`
- Run `npm run typecheck` to see if there's any errors or warnings. If so, follow Fix Protocol.
- Run `npm run lint --fix` to see if there's any errors or warnings. If so, follow Fix Protocol.

## Fix Protocol

For each issue to fix, identify root cause before fixing.

- If there's an issue that needs research and exploration, do so now.

Once you've fixed all issues for a file:

- **For lint**: Rerun on the specific file using `npm run lint -- --fix path/to/file.ts` to verify that file is clean
- **For typecheck**: Always run full `npm run typecheck` (no file arguments - tsc ignores them and checks the entire
  project anyway)

If changes to a file have lead to new errors or warnings, fix those. Do not move on until typecheck runs without
errors/warnings and lint for that file runs without errors/warnings.

If you run into a change loop of: Make a fix => new lint error => Make another fix => new lint error, notify the user
and provide context. It might need a system-level adjustment.

When you get no errors for one file, move on to the next. Continue this process until lint and typecheck run without
errors/warnings for the folder the user is focusing on.

## User Focus

$ARGUMENTS