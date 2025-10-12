Read

- `@packages/standards/project-standards.md`
- `@packages/standards/testing-standards.md`

Based on `User Input` go explore current rules are in: `packages/eslint-plugin/src/brokers/rule` and determine if
you need to add user's input as a new rule or if you need to craft it into an existing rule.

After your determination, add the functionality and tests.

Only ensure tests pass. Do not run lint, do not run typecheck and do not modify any files outside
`packages/eslint-plugin/src/`.

Do not look at anything in `packages/standards/proxy-mocking`

## User Input

$ARGUMENTS