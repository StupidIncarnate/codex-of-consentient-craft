# Feature Specification: E2E Testing Harness for CLI with Headless Claude Mode

**Feature Branch**: `001-e2e-testing`
**Created**: 2026-01-28
**Status**: Draft
**Input**: User description: "Setup E2E testing harness for CLI with headless Claude mode integration for BDD testing of user flows with MCP and hooks access"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quest Creation Without Followup Questions (Priority: P1)

A developer needs to verify that the CLI can create a quest from a simple prompt without requiring additional user interaction. This tests the happy path where the AI agent (ChaosWhisperer) has sufficient information to create a quest directly.

**Why this priority**: This is the core "Add" workflow that validates the full pipeline: user input → Claude spawn → MCP quest creation → screen navigation → list display. If this doesn't work, no other features matter.

**Independent Test**: Can be fully tested by launching the CLI, navigating to Add, entering a prompt, and verifying the quest file exists and the UI shows the list view with the new quest.

**Acceptance Scenarios**:

1. **Given** the CLI is running and on the menu screen, **When** the user selects "Add" and enters "Testing cli workflow, make me a quest without any followup questions. Call it DangerFun", **Then** the CLI should:
   - Navigate to the list screen after quest creation completes
   - Display "DangerFun" in the quest list
   - Have created a quest file in `.dungeonmaster-quests/` containing "DangerFun" in the structure

2. **Given** the CLI has completed quest creation, **When** the list screen is displayed, **Then** the original user prompt text should NOT be visible on screen (prompt should be cleared after submission)

3. **Given** the quest was created successfully, **When** inspecting the quest file, **Then** the file should contain valid JSON with the quest title, status, and required structure fields

---

### User Story 2 - Quest Creation With User Question Flow (Priority: P2)

A developer needs to verify that the CLI correctly handles the `needs-user-input` signal from the MCP workflow. This tests the flow where Claude needs clarification and uses the `signal-back` MCP tool to request user input.

**Why this priority**: This validates the bidirectional communication between Claude and the CLI through MCP signals, which is critical for complex workflows requiring user decisions.

**Independent Test**: Can be fully tested by launching the CLI, navigating to Add, entering a prompt that explicitly requests a question be asked, and verifying the answer screen appears with the correct question.

**Acceptance Scenarios**:

1. **Given** the CLI is running and on the menu screen, **When** the user selects "Add" and enters "Testing cli workflow. I want to do a simple hello world. Ask me the following question using the mcp workflow 'Why hello world?'", **Then** the CLI should navigate to the answer screen displaying the question "Why hello world?"

2. **Given** the answer screen is displayed with a question, **When** inspecting the screen content, **Then** the question text from the `signal-back` MCP call should be visible and editable input should be available

3. **Given** the answer screen is displayed, **When** the user provides an answer and submits, **Then** the Claude session should resume with the user's answer as context

---

### User Story 3 - Test Harness Infrastructure Setup (Priority: P1)

A developer needs a reusable E2E test harness that can programmatically interact with the CLI, spawn headless Claude sessions, and verify outcomes through file system assertions and screen state inspection.

**Why this priority**: Without the harness infrastructure, no E2E tests can be written. This is foundational scaffolding required for all other test scenarios.

**Independent Test**: Can be verified by creating a test file that uses the harness to launch the CLI, send input, and make assertions about the result.

**Acceptance Scenarios**:

1. **Given** the E2E test harness is available, **When** a test initializes a test project, **Then** the harness should create an isolated directory with proper CLI configuration

2. **Given** a test project is initialized, **When** the test launches the CLI in headless mode, **Then** the CLI should start and accept programmatic input

3. **Given** the CLI is running in headless mode, **When** the test sends navigation commands and text input, **Then** the CLI should process them as if a user typed them

4. **Given** a test has completed, **When** cleanup is called, **Then** all temporary files and processes should be removed

---

### Edge Cases

- What happens when Claude times out during quest creation? (E2E should handle timeout and report meaningful error)
- What happens when the MCP server is not running? (E2E should detect and report MCP unavailability)
- What happens when a quest with the same name already exists? (E2E should verify the quest ID sequencing works)
- What happens when the user submits an empty prompt? (E2E should verify validation behavior)
- What happens when the signal-back tool returns malformed JSON? (E2E should verify error handling)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an E2E test harness that can spawn the CLI as a subprocess with headless mode enabled
- **FR-002**: System MUST provide the ability to send keyboard input (navigation keys, text entry, submit) to the CLI subprocess
- **FR-003**: System MUST capture CLI screen output for assertion verification
- **FR-004**: System MUST integrate with real MCP server so that Claude has access to actual MCP tools during tests
- **FR-005**: System MUST integrate with hooks configuration so that test scenarios can verify hook behavior
- **FR-006**: System MUST create isolated test directories for each E2E test to prevent cross-test contamination
- **FR-007**: System MUST wait for specific screen states before proceeding with next input (synchronization)
- **FR-008**: System MUST provide timeout configuration for Claude operations with sensible defaults
- **FR-009**: System MUST clean up test artifacts (files, processes) after test completion
- **FR-010**: System MUST provide assertion helpers for verifying quest file contents
- **FR-011**: System MUST provide assertion helpers for verifying screen content includes/excludes specific text
- **FR-012**: Test scenarios MUST be written in BDD-style (Given/When/Then) for readability

### Key Entities

- **Test Harness**: The orchestrator that manages CLI subprocess lifecycle, input injection, and output capture
- **Test Project**: An isolated directory with CLI configuration that mimics a real user project
- **Screen State**: The current visual output of the CLI at any point in time
- **Quest File**: The JSON file created in `.dungeonmaster-quests/` containing quest data
- **Signal**: MCP tool call output from Claude (complete, needs-user-input, etc.)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: E2E test suite executes both test scenarios (quest creation, user question flow) in under 120 seconds total
- **SC-002**: Tests can reliably detect when CLI has transitioned to a specific screen (list, answer, menu)
- **SC-003**: Tests can verify file system state (quest files exist with correct content)
- **SC-004**: Tests correctly identify the known bug (prompt visible on screen after submission) and fail the relevant assertion
- **SC-005**: Tests are deterministic - running the same test multiple times produces consistent results
- **SC-006**: Test harness documentation enables a new developer to write additional E2E tests within 30 minutes

## Assumptions

- The existing `tests/utils/testbed.ts` can be extended or adapted for E2E purposes
- Claude CLI (`claude` command) is available in the test environment PATH
- The MCP server can be started programmatically or is already running during test execution
- The CLI debug mode (`start-debug.ts`) can be leveraged or extended for E2E testing
- Jest is the test runner and can handle longer-running E2E tests with appropriate timeout configuration
- The CLI uses Ink (React for CLI) which renders to stdout and can be captured
