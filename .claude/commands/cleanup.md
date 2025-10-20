# CRITICAL: Ad-hoc Interface Cleanup Procedure for ESLint Rule Brokers

## MISSION

Clean up ONE rule broker file at a time by removing ad-hoc interface definitions and
using the shared `Tsestree` contract type instead.

## STRICT RULES - VIOLATION WILL BREAK THE CODEBASE

### DO NOT:

1. ❌ Work on multiple files at once - ONE FILE AT A TIME ONLY
2. ❌ Search for other files to clean up - I will tell you which file
3. ❌ Look at other rule brokers or suggest improvements
4. ❌ Refactor anything beyond removing the ad-hoc interfaces
5. ❌ Use escape hatches like `as unknown as SomeType`
6. ❌ Add eslint-disable comments
7. ❌ Skip running tests after changes
8. ❌ Move on to another file if tests fail

### ALWAYS DO:

1. ✅ Work ONLY on the file I specify
2. ✅ Follow the procedure below EXACTLY in order
3. ✅ Run tests after EVERY change
4. ✅ Fix type errors by extending the contract, not by casting
5. ✅ Keep the code compiling at each step

---

## PROCEDURE (Follow EXACTLY in this order)

### STEP 1: Identify What's Needed

1. Read the target rule broker file I specify
2. Find all ad-hoc interfaces and inline type assertions (`as { type: string; ... }`)
3. List ALL properties used across ALL ad-hoc types in that file
4. Check which properties already exist in
   `packages/eslint-plugin/src/contracts/tsestree/tsestree-contract.ts`

### STEP 2: Extend the Contract (if needed)

1. For any properties NOT in the contract, add them to `tsestree-contract.ts`:
    - Add to `RecursiveNodeOutput` interface
    - Add to `RecursiveNodeInput` interface
    - Add to the `recursiveBase` Zod schema
    - Add to the root `tsestreeContract` Zod schema

2. Property type patterns:
    - Single node: `property?: RecursiveNodeOutput | null | undefined`
    - Array of nodes: `properties?: RecursiveNodeOutput[] | undefined`
    - Union (like `body`): `body?: RecursiveNodeOutput | RecursiveNodeOutput[] | null |
  undefined`
    - String: `name?: string | undefined`
    - Unknown: `value?: unknown`

3. Run tests for the contract to verify it still works

### STEP 3: Remove Ad-hoc Interfaces

1. Delete interface definitions at the top of the file (e.g., `interface FunctionLike`,
   etc.)
2. Update function signatures to use `Tsestree` instead of the ad-hoc type
3. Remove type casts: change `const x = node as FunctionLike` to just use `node`
   directly
4. Add null checks where needed: `if (!node.params || ...)` instead of assuming
   properties exist

### STEP 4: Remove Inline Type Assertions

1. Find all `as { type: string; ... }` patterns
2. Replace with direct property access on `Tsestree` nodes
3. Add type guards if needed (e.g., `Array.isArray(body)` for union types)

### STEP 5: Test and Verify

1. Run the tests for ONLY the file you modified: `npm test
  --workspace=@questmaestro/eslint-plugin -- {file-name}.test.ts`
2. Tests MUST pass - if they don't, fix type errors by extending the contract or adding
   proper guards
3. Do NOT move to the next file until tests pass

---

## EXAMPLE

**Bad approach (DO NOT DO THIS):**

  ```typescript
  // Escape hatch - FORBIDDEN
const statements = (body.body as unknown) as unknown[];

Good
approach:
    // Proper type guard
    if (Array.isArray(body.body)) {
        const hasContractParse = body.body.some((statement: unknown) => {
  ```

---
WHEN YOU'RE DONE WITH ONE FILE

Report:

1. "File {name} cleanup complete"
2. "All tests passing"
3. "Ready for next file"

Then WAIT for me to give you the next file. DO NOT search for or suggest other files.

---
CURRENT STATE

Contract location: packages/eslint-plugin/src/contracts/tsestree/tsestree-contract.ts

## PROCESS THE FOLLOWING USER REQUEST

Read:

- `@packages/standards/project-standards.md`
- `packages/standards/testing-standards.md`

and then:

$ARGUMENTS