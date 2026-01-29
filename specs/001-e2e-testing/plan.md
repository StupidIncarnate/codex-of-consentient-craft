# Implementation Plan: E2E Testing Harness for CLI

**Branch**: `001-e2e-testing` | **Date**: 2026-01-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-e2e-testing/spec.md`

## Summary

Build an E2E testing harness that can run full user flows against the CLI with real MCP integration and Claude headless mode. The harness will extend the existing debug mode infrastructure to support orchestration-level testing, not just widget-level testing. Two test scenarios will validate: (1) quest creation without followup, (2) user question flow via MCP signal-back.

## Technical Context

**Language/Version**: TypeScript (strict mode), Node.js >= 14.0.0
**Primary Dependencies**: Jest, ink-testing-library, child_process (spawn), @dungeonmaster/testing
**Storage**: File system (.dungeonmaster-quests/ directory)
**Testing**: Jest with @dungeonmaster/testing (auto-reset mocks)
**Target Platform**: Node.js CLI (Linux/macOS/Windows)
**Project Type**: Monorepo workspace (packages/*)
**Performance Goals**: Test suite completes in under 120 seconds
**Constraints**: Must run headless (no interactive terminal), must have real MCP access
**Scale/Scope**: 2 initial E2E test scenarios, harness designed for extension

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Check (Phase 0)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Library-First | ✅ PASS | E2E harness will be in `packages/testing` |
| II. CLI Interface | ✅ PASS | Uses existing debug mode JSON protocol |
| III. Test-First (NON-NEGOTIABLE) | ✅ PASS | Test harness enables TDD for CLI features |
| IV. Integration Testing | ✅ PASS | This IS the integration testing infrastructure |
| V. MCP Architecture Tools | ✅ PASS | Used MCP tools during research phase |
| VI. Simplicity (YAGNI) | ✅ PASS | Only building what spec requires |

### Post-Design Check (Phase 1)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Library-First | ✅ PASS | Harness in `packages/testing/src/brokers/e2e/` |
| II. CLI Interface | ✅ PASS | Subprocess stdin/stdout protocol |
| III. Test-First | ✅ PASS | Tests define API before implementation |
| IV. Integration Testing | ✅ PASS | E2E tests verify integrated system |
| V. MCP Architecture Tools | ✅ PASS | Followed folder structure from get-architecture |
| VI. Simplicity | ✅ PASS | No unnecessary abstractions; direct subprocess control |

## Project Structure

### Documentation (this feature)

```text
specs/001-e2e-testing/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── testing/
│   └── src/
│       ├── brokers/
│       │   └── e2e/
│       │       └── harness/
│       │           ├── e2e-harness-broker.ts          # Main harness orchestrator
│       │           ├── e2e-harness-broker.proxy.ts
│       │           └── e2e-harness-broker.test.ts
│       ├── adapters/
│       │   └── claude-headless/
│       │       └── spawn/
│       │           ├── claude-headless-spawn-adapter.ts
│       │           ├── claude-headless-spawn-adapter.proxy.ts
│       │           └── claude-headless-spawn-adapter.test.ts
│       └── contracts/
│           ├── e2e-test-context/
│           │   ├── e2e-test-context-contract.ts
│           │   └── e2e-test-context.stub.ts
│           └── e2e-assertion-result/
│               ├── e2e-assertion-result-contract.ts
│               └── e2e-assertion-result.stub.ts
│
├── cli/
│   └── src/
│       └── startup/
│           └── start-e2e.ts                          # E2E mode entry point (extends debug)
│
tests/
└── e2e/
    ├── quest-creation-no-followup.e2e.test.ts        # Test scenario 1
    └── quest-creation-with-question.e2e.test.ts      # Test scenario 2
```

**Structure Decision**: E2E harness goes in `packages/testing` following library-first principle. Test scenarios go in `tests/e2e/` at repo root since they test the integrated system.

## Complexity Tracking

> No violations - design follows constitution principles.

## Key Design Decisions

### 1. Orchestration-Level Testing Architecture

The existing `start-debug.ts` only tests widget behavior - callbacks fire but orchestration logic is not executed. For true E2E testing, we need to test the full `start-cli.ts` flow.

**Approach**: Create `start-e2e.ts` that:
- Spawns the full CLI in a subprocess (not just the widget)
- Provides programmatic input via stdin
- Captures stdout/stderr for assertions
- Monitors file system for quest creation
- Has access to real MCP server

### 2. Claude Headless Integration

Real E2E tests must spawn actual Claude CLI with MCP access. The harness will:
- Ensure `.mcp.json` is configured in test project
- Spawn Claude with `--output-format stream-json`
- Parse stream-json output to detect signals
- Handle resume sessions via `--resume` flag

### 3. Screen State Synchronization

Tests need to wait for specific screen states before sending next input. Strategy:
- Poll `lastFrame()` until it matches expected pattern
- Use timeout with meaningful error if screen doesn't appear
- Provide helper: `await harness.waitForScreen('list', { contains: 'DangerFun' })`

### 4. Test Isolation

Each E2E test gets:
- Fresh temp directory via `installTestbedCreateBroker`
- Own `.mcp.json` pointing to real MCP server
- Own `.dungeonmaster-quests/` directory
- Cleanup after test completion
