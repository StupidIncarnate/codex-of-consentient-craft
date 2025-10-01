# questmaestro/eslint-plugin

This a plugin lib that gets published as an npm package that other projects can bring in to get predefined rulesets that
constrain LLM coding and make sure it outputs good code. The configurations in here are also used in this repo to
utilize the same advantages.

## Testing

- **Rule brokers** (`src/brokers/rule/**`) - Tested with ESLint's RuleTester integration tests, not traditional Jest
  unit tests. Tests are co-located (e.g., `explicit-return-types-rule-broker.test.ts`).
- `test/helpers/eslint-rule-tester.ts` - Creates configured RuleTester with TypeScript parser for rule integration
  tests. Uses `require('@typescript-eslint/parser')` at runtime due to module resolution constraints - top-level import
  fails with `moduleResolution: "node"`.