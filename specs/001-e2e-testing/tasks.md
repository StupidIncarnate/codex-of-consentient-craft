# Tasks: E2E Testing Harness for CLI

**Input**: Design documents from `/specs/001-e2e-testing/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: NOT separately requested - the E2E test harness IS the deliverable; test scenarios are the user stories themselves.

**Organization**: Tasks grouped by user story. US3 (Infrastructure) is foundational and must complete before US1/US2 can be implemented.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo workspace**: `packages/*/src/` structure
- Testing utilities: `packages/testing/src/`
- CLI package: `packages/cli/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and structure verification

- [X] T001 Verify existing `packages/testing/` structure supports new contracts/brokers
- [X] T002 [P] Verify `installTestbedCreateBroker` exists at `packages/testing/src/brokers/install-testbed/create/install-testbed-create-broker.ts`
- [X] T003 [P] Verify `@dungeonmaster/shared/@types` has `StubArgument` type for stub patterns

---

## Phase 2: Foundational - Test Harness Infrastructure (User Story 3, Priority: P1)

**Purpose**: Core E2E infrastructure that MUST be complete before test scenarios can be written

**Goal**: Provide a reusable E2E test harness that can programmatically interact with the CLI, spawn headless Claude sessions, and verify outcomes through file system assertions and screen state inspection.

**Independent Test**: Create a minimal test file that uses the harness to launch the CLI, send input, and make assertions about the result.

**Why US3 first**: Without the harness infrastructure, US1 and US2 cannot be implemented. This is the foundational scaffolding.

### Contracts (Depth 1)

- [X] T004 [P] [US3] Create `CliScreenName` branded enum contract in `packages/testing/src/contracts/cli-screen-name/cli-screen-name-contract.ts`
- [X] T005 [P] [US3] Create `CliScreenName` stub in `packages/testing/src/contracts/cli-screen-name/cli-screen-name.stub.ts`
- [X] T006 [P] [US3] Create `ScreenFrame` branded string contract in `packages/testing/src/contracts/screen-frame/screen-frame-contract.ts`
- [X] T007 [P] [US3] Create `ScreenFrame` stub in `packages/testing/src/contracts/screen-frame/screen-frame.stub.ts`
- [X] T008 [P] [US3] Create `E2EScreenState` composite contract in `packages/testing/src/contracts/e2e-screen-state/e2e-screen-state-contract.ts`
- [X] T009 [P] [US3] Create `E2EScreenState` stub in `packages/testing/src/contracts/e2e-screen-state/e2e-screen-state.stub.ts`
- [X] T010 [P] [US3] Create `E2ETestbed` interface contract in `packages/testing/src/contracts/e2e-testbed/e2e-testbed-contract.ts`

### Statics (Depth 1)

- [X] T011 [P] [US3] Create `e2eTimeoutsStatics` in `packages/testing/src/statics/e2e-timeouts/e2e-timeouts-statics.ts`

### Broker (Depth 2)

- [X] T012 [US3] Create `e2eTestbedCreateBroker` in `packages/testing/src/brokers/e2e-testbed/create/e2e-testbed-create-broker.ts` (depends on T004-T011)
- [X] T013 [US3] Create empty proxy in `packages/testing/src/brokers/e2e-testbed/create/e2e-testbed-create-broker.proxy.ts`
- [X] T014 [US3] Create broker unit test in `packages/testing/src/brokers/e2e-testbed/create/e2e-testbed-create-broker.test.ts`

### Exports

- [X] T015 [US3] Export E2E testbed from `packages/testing/src/index.ts` (re-export broker and contracts)

**Checkpoint**: E2E testbed infrastructure complete - test scenarios can now be implemented

---

## Phase 3: User Story 1 - Quest Creation Without Followup (Priority: P1) MVP

**Goal**: Verify CLI can create a quest from a simple prompt without requiring additional user interaction. Tests the happy path where the AI agent has sufficient information to create a quest directly.

**Independent Test**: Launch CLI, navigate to Add, enter prompt, verify quest file exists and UI shows list view with new quest.

### Acceptance Criteria (from spec.md)

1. CLI navigates to list screen after quest creation completes
2. "DangerFun" displayed in quest list
3. Quest file created in `.dungeonmaster-quests/` containing "DangerFun"
4. Original prompt NOT visible on screen after submission
5. Quest file contains valid JSON with title, status, and required structure fields

### Implementation

- [ ] T016 [US1] Add test scenario "quest creation without followup" in `packages/cli/src/startup/start-cli.integration.test.ts`
- [ ] T017 [US1] Implement test: Given CLI on menu, When user selects Add and enters prompt, Then list screen shows with "DangerFun"
- [ ] T018 [US1] Implement assertion: Quest file exists in `.dungeonmaster-quests/` with valid JSON structure
- [ ] T019 [US1] Implement assertion: Original prompt text NOT visible on list screen (tests known bug - expected to fail)

**Checkpoint**: User Story 1 complete - core Add workflow validated

---

## Phase 4: User Story 2 - Quest Creation With User Question Flow (Priority: P2)

**Goal**: Verify CLI correctly handles the `needs-user-input` signal from the MCP workflow when Claude needs clarification.

**Independent Test**: Launch CLI, navigate to Add, enter prompt that explicitly requests a question be asked, verify answer screen appears with the correct question.

### Acceptance Criteria (from spec.md)

1. CLI navigates to answer screen displaying the question "Why hello world?"
2. Question text from `signal-back` MCP call is visible
3. Editable input is available on answer screen
4. (Future) When user provides answer and submits, Claude session resumes with user's answer as context

### Implementation

- [ ] T020 [US2] Add test scenario "quest creation with user question flow" in `packages/cli/src/startup/start-cli.integration.test.ts`
- [ ] T021 [US2] Implement test: Given CLI on menu, When user enters prompt requesting question, Then answer screen shows with "Why hello world?"
- [ ] T022 [US2] Implement assertion: Answer screen contains editable input field
- [ ] T023 [US2] (Optional) Implement test: When user answers and submits, Then Claude session resumes

**Checkpoint**: User Story 2 complete - MCP signal-back flow validated

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, documentation, and validation

- [ ] T024 [P] Add edge case test: Claude timeout during quest creation in `packages/cli/src/startup/start-cli.integration.test.ts`
- [ ] T025 [P] Add edge case test: Empty prompt submission handling
- [ ] T026 Run quickstart.md validation scenarios manually
- [ ] T027 Verify all E2E tests complete in under 120 seconds total (SC-001)
- [ ] T028 Update `packages/testing/README.md` with E2E harness usage (SC-006)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verification only
- **Foundational/US3 (Phase 2)**: Depends on Setup - BLOCKS all test scenarios
- **US1 (Phase 3)**: Depends on Foundational completion
- **US2 (Phase 4)**: Depends on Foundational completion (can parallel with US1)
- **Polish (Phase 5)**: Depends on US1 and US2 completion

### User Story Dependencies

- **User Story 3 (Infrastructure)**: Foundational - must complete first
- **User Story 1 (Quest Creation)**: Can start after US3 complete
- **User Story 2 (Question Flow)**: Can start after US3 complete, independent of US1

### Within User Story 3 (Foundational)

- Contracts (T004-T010) and Statics (T011) can run in parallel
- Broker (T012-T014) depends on all contracts and statics
- Exports (T015) depends on broker

### Parallel Opportunities

**Phase 2 (Foundational) - All contracts and statics in parallel:**
```bash
Task: T004 "Create CliScreenName contract"
Task: T005 "Create CliScreenName stub"
Task: T006 "Create ScreenFrame contract"
Task: T007 "Create ScreenFrame stub"
Task: T008 "Create E2EScreenState contract"
Task: T009 "Create E2EScreenState stub"
Task: T010 "Create E2ETestbed interface"
Task: T011 "Create e2eTimeoutsStatics"
```

**After Foundational - US1 and US2 can run in parallel:**
```bash
# Developer A: User Story 1
Task: T016-T019 "Quest creation without followup tests"

# Developer B: User Story 2
Task: T020-T023 "Quest creation with question flow tests"
```

---

## Implementation Strategy

### MVP First (Infrastructure + User Story 1)

1. Complete Phase 1: Setup (verification)
2. Complete Phase 2: Foundational/US3 (E2E testbed infrastructure)
3. Complete Phase 3: User Story 1 (core quest creation flow)
4. **STOP and VALIDATE**: Run E2E test, verify quest creation works
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 + 2 → E2E harness infrastructure ready
2. Add US1 → Core Add workflow validated → MVP!
3. Add US2 → MCP signal-back flow validated
4. Add Polish → Edge cases, documentation, performance validation

### File Summary

| File | Tasks |
|------|-------|
| `packages/testing/src/contracts/cli-screen-name/cli-screen-name-contract.ts` | T004 |
| `packages/testing/src/contracts/cli-screen-name/cli-screen-name.stub.ts` | T005 |
| `packages/testing/src/contracts/screen-frame/screen-frame-contract.ts` | T006 |
| `packages/testing/src/contracts/screen-frame/screen-frame.stub.ts` | T007 |
| `packages/testing/src/contracts/e2e-screen-state/e2e-screen-state-contract.ts` | T008 |
| `packages/testing/src/contracts/e2e-screen-state/e2e-screen-state.stub.ts` | T009 |
| `packages/testing/src/contracts/e2e-testbed/e2e-testbed-contract.ts` | T010 |
| `packages/testing/src/statics/e2e-timeouts/e2e-timeouts-statics.ts` | T011 |
| `packages/testing/src/brokers/e2e-testbed/create/e2e-testbed-create-broker.ts` | T012 |
| `packages/testing/src/brokers/e2e-testbed/create/e2e-testbed-create-broker.proxy.ts` | T013 |
| `packages/testing/src/brokers/e2e-testbed/create/e2e-testbed-create-broker.test.ts` | T014 |
| `packages/testing/src/index.ts` | T015 |
| `packages/cli/src/startup/start-cli.integration.test.ts` | T016-T025 |
| `packages/testing/README.md` | T028 |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- US3 is foundational despite being "User Story 3" - reordered to Phase 2
- Test scenarios (US1, US2) ARE the tests - no separate test tasks needed
- Verify Jest timeout configured for 120000ms in integration tests
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
