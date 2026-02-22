---
name: code-planning
description: Plan implementation changes before coding. Use when the user requests a new feature, modification, or asks for a plan. Ensures full understanding, discovers existing code, creates detailed file/folder structure with contracts and tests, and gets user approval before implementation.
---

# Implementation Planning

Plan BEFORE writing code. Complete each phase before proceeding to the next.

**Plan output must be TERSE.** No prose. Use tables, one-liners, and compact notation.

---

## Phase 1: Understand Request

Achieve full understanding before any discovery or planning.

1. **Restate** the request in one sentence
2. **Identify ambiguities** - list anything unclear or with multiple interpretations
3. **Ask clarifying questions** using AskUserQuestion:
    - Expected input/output types
    - Which package should contain this
    - Edge cases to handle
    - Error handling expectations
    - Performance requirements (if applicable)

**Do NOT proceed until you have clear answers to all ambiguities.**

---

## Phase 2: Load Architecture

Load the codebase rules that govern file placement and imports.

Use the `get-architecture` MCP tool (no params).

Internalize before proceeding:

- Folder types and when to use each (decision tree)
- Import hierarchy (what can import what)
- Forbidden folders and their replacements
- Entry file naming conventions
- Layer file rules

---

## Phase 3: Discovery

Find existing code related to this request. Extend existing functionality rather than duplicating.

**Search strategies** (use the `discover` MCP tool):

- `{ type: "files", search: "[keyword]" }` - Search by keyword
- `{ type: "files", fileType: "broker", search: "[domain]" }` - Search by file type and domain
- `{ type: "files", path: "packages/[pkg]/src/[folder]" }` - Browse a specific folder

**Questions to answer:**

- Does similar functionality exist? (If yes, extend it with options)
- What existing contracts define related types?
- What adapters wrap the npm packages we'll use?
- What brokers handle related business logic?
- What patterns do similar features follow?

**Only use Read tool when:** The discover tool returns a file but doesn't provide enough implementation detail to
understand how to extend or integrate with it.

---

## Phase 4: Get Folder Details

For each folder type you'll create/modify files in, load the specific rules.

Use the `get-folder-detail` MCP tool for each folder type:

- `{ folderType: "brokers" }`
- `{ folderType: "contracts" }`
- `{ folderType: "adapters" }`

Each call provides:

- Naming conventions for that folder
- Import restrictions
- Proxy file requirements
- Test patterns
- Code structure examples

Call for EVERY folder type in your plan before creating the plan.

---

## Phase 5: Create Plan

Produce a terse implementation plan. Use tables exclusively. No prose paragraphs.

### Files

| Path                                            | Action | Purpose            |
|-------------------------------------------------|--------|--------------------|
| `contracts/user/user-contract.ts`               | NEW    | Input/output types |
| `brokers/user/fetch/user-fetch-broker.ts`       | NEW    | Fetch user by ID   |
| `brokers/user/fetch/user-fetch-broker.proxy.ts` | NEW    | Test proxy         |
| `brokers/user/fetch/user-fetch-broker.test.ts`  | NEW    | Unit tests         |

Actions: `NEW`, `MODIFY`, `DELETE`

### Contracts

| Name         | Shape                                  |
|--------------|----------------------------------------|
| `UserInput`  | `{ id: UserId }`                       |
| `UserOutput` | `{ user: User, fetchedAt: Timestamp }` |

Use branded types. Show nested objects inline.

### Signatures

| Function          | Signature                               |
|-------------------|-----------------------------------------|
| `userFetchBroker` | `({ id: UserId }): Promise<UserOutput>` |
| `isUserGuard`     | `({ value: unknown }): value is User`   |

All parameters use object destructuring.

### Dependencies

| File                   | Imports                            |
|------------------------|------------------------------------|
| `user-fetch-broker.ts` | `user-contract`, `api-get-adapter` |
| `user-contract.ts`     | `zod`                              |

### Tests

One line per test case. Format: `condition -> expected result`

| File                        | Cases                                  |
|-----------------------------|----------------------------------------|
| `user-fetch-broker.test.ts` | valid id -> returns user               |
|                             | missing id -> throws ValidationError   |
|                             | user not found -> throws NotFoundError |
|                             | api error -> propagates with context   |

### Manual Testing (E2E BDD)

These are real E2E flows Claude will execute after implementation to verify the feature works. Not unit tests - actual
user-like verification.

| Type     | Scenario   | Claude Executes                                                    |
|----------|------------|--------------------------------------------------------------------|
| CLI      | Happy path | Run `cli fetch --id 123`, verify output shows user                 |
| CLI      | Error      | Run `cli fetch --id invalid`, verify error message                 |
| DB       | Write      | Call broker, then `SELECT * FROM users WHERE id=...` to verify row |
| API      | Endpoint   | `curl POST /api/users`, verify response + DB state                 |
| Frontend | Flow       | Playwright: navigate to /users, click fetch, verify DOM            |

---

## Phase 6: Review Manual Testing for Claude Execution

After writing BDD scenarios, determine HOW Claude will execute each.

**By feature type:**

| Type        | How Claude Verifies                              |
|-------------|--------------------------------------------------|
| CLI         | Bash: run commands, check stdout/stderr          |
| API         | curl/httpie: hit endpoints, check responses      |
| DB writes   | Run action, then query DB directly               |
| File output | Run action, Read file to verify contents         |
| Frontend    | Playwright/Puppeteer adapter to automate browser |

**For each scenario, specify the exact commands/steps:**

| Scenario       | Execution Steps                                                                           |
|----------------|-------------------------------------------------------------------------------------------|
| CLI happy path | 1. `npm run build` 2. `./bin/cli fetch --id 123` 3. Assert stdout contains "User: John"   |
| DB write       | 1. Call `userCreateBroker({...})` 2. `psql -c "SELECT * FROM users"` 3. Assert row exists |
| Frontend       | 1. `npx playwright test e2e/user-flow.spec.ts` or inline script                           |

**If Claude cannot execute (rare):**

- Mark as `USER MANUAL TEST` with clear instructions
- Example: "Verify push notification appears on physical device"

**If tooling needed:**

1. Check if adapter exists using the `discover` MCP tool:
   `{ type: "files", fileType: "adapter", search: "playwright" }`
2. If not, add adapter to plan Files table
3. Include adapter setup in plan Dependencies

Update Files and Dependencies tables if new tooling required.

---

## Phase 7: Verify Standards

Before presenting, verify plan against architecture rules:

- [ ] No forbidden folders (utils, helpers, lib, common, shared)
- [ ] All contracts use branded Zod types (no raw string/number)
- [ ] All functions use object destructuring for parameters
- [ ] All functions have explicit return types
- [ ] Entry files follow naming: `[folder-path]-[suffix].ts`
- [ ] Layer files only in allowed folders (widgets, brokers, responders)
- [ ] Import hierarchy respected (check get-architecture output)
- [ ] Each file has one primary export
- [ ] Test + proxy files included for all implementations
- [ ] File names are kebab-case

Fix any violations before presenting the plan.

---

## Phase 8: Get Approval

Present the complete plan tables to the user.

Ask: "Does this plan look correct? Any modifications needed?"

**If user requests changes:**

1. Update the plan tables
2. Re-verify against standards (Phase 6)
3. Present updated plan
4. Repeat until approved

**Only after explicit user approval:** Proceed to implementation.