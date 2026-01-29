<!--
SYNC IMPACT REPORT
==================
Version change: 0.0.0 → 1.0.0 (Initial constitution)

Added sections:
- Core Principles (6 principles)
- Technology Constraints
- Development Workflow
- Governance

Templates requiring updates:
- .specify/templates/plan-template.md: ✅ No changes needed (Constitution Check section already present)
- .specify/templates/spec-template.md: ✅ No changes needed (aligned with principles)
- .specify/templates/tasks-template.md: ✅ No changes needed (aligned with principles)

Follow-up TODOs: None
-->

# DungeonMaster Constitution

## Core Principles

### I. Library-First

Every feature MUST start as a standalone library within `packages/`. Libraries MUST be:

- Self-contained with explicit dependencies
- Independently testable via their own test suite
- Documented with clear purpose and API surface
- Free of circular dependencies

**Rationale**: Modular architecture enables parallel development, simplifies testing, and allows selective deployment. The CLI orchestration layer handles discovery and execution; libraries focus on domain logic.

### II. CLI Interface

Every library MUST expose functionality via CLI. All CLI interactions MUST follow:

- Text I/O protocol: stdin/args as input, stdout for results, stderr for errors
- Support for both JSON and human-readable output formats
- Consistent argument naming conventions across commands
- Exit codes: 0 for success, non-zero for failure

**Rationale**: Text-based interfaces enable composability, debugging via logs, and integration with external tools. JSON output supports automation; human-readable output supports interactive use.

### III. Test-First (NON-NEGOTIABLE)

Test-Driven Development is MANDATORY for all feature work:

1. Tests MUST be written before implementation
2. Tests MUST fail before implementation begins (Red phase)
3. Implementation MUST make tests pass (Green phase)
4. Refactoring MUST maintain passing tests (Refactor phase)

**Rationale**: TDD produces testable designs, documents expected behavior, and prevents regression. The red-green-refactor cycle ensures tests verify actual requirements, not implementation artifacts.

### IV. Integration Testing

Focus areas REQUIRING integration tests:

- New library contract tests (API surface verification)
- Contract changes between packages
- Inter-service communication paths
- Shared schemas and data structures

**Rationale**: Unit tests verify components in isolation; integration tests verify components work together. Both are necessary for confidence in the system.

### V. MCP Architecture Tools

All development work MUST begin with MCP tool consultation:

1. Run `get-architecture()` FIRST for every task
2. Use `discover()` before creating new code to check for existing implementations
3. Use `get-folder-detail()` for folder-specific patterns
4. Use `get-syntax-rules()` for syntax conventions
5. Use Read tool ONLY for modifying existing files or analyzing specific implementations

**Rationale**: MCP tools provide canonical patterns and prevent duplication. Consulting architecture first ensures new code aligns with established conventions.

### VI. Simplicity (YAGNI)

All implementations MUST follow simplicity principles:

- Implement only what is explicitly required
- Avoid premature abstraction; three similar lines are better than a premature helper
- No feature flags or backward-compatibility shims when direct changes suffice
- No error handling for scenarios that cannot occur
- Delete unused code completely; no `_unused` variables or `// removed` comments

**Rationale**: Complexity accumulates. Every abstraction, option, and edge-case handler has maintenance cost. Start simple; add complexity only when requirements demand it.

## Technology Constraints

### Stack Requirements

| Component | Requirement |
|-----------|-------------|
| Runtime | Node.js >= 14.0.0 |
| Language | TypeScript (strict mode) |
| Package Manager | npm with workspaces |
| Testing | Jest with `@dungeonmaster/testing` |
| Linting | ESLint with `@dungeonmaster/eslint-plugin` |
| Build | TypeScript compiler (tsc) |

### Workspace Structure

All packages MUST reside in `packages/*/` and:

- Export a `startup/start-install.ts` for CLI discovery
- Define dependencies explicitly in their own `package.json`
- Build to `dist/` directory

### Shared Code Policy

Code used by multiple packages MUST be placed in `@dungeonmaster/shared`:

- After modification: `npm run build --workspace=@dungeonmaster/shared`
- Import pattern: `import {x} from '@dungeonmaster/shared/statics'`

## Development Workflow

### Code Review Requirements

All changes MUST:

1. Pass `npm run ward:all` (lint + typecheck + test)
2. Include tests for new functionality
3. Follow MCP-defined patterns
4. Be reviewed before merge

### Testing Gates

| Gate | Requirement |
|------|-------------|
| Pre-commit | Lint and typecheck pass |
| PR | All tests pass, coverage maintained |
| Merge | ward:all succeeds |

### Integration Test Setup

For file system integration tests, use isolated temp directories:

```typescript
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

const testbed = installTestbedCreateBroker({
  baseName: BaseNameStub({ value: 'my-test' }),
});
// testbed.projectPath - isolated temp directory
// testbed.cleanup() - removes temp directory
```

### Mock Management

Jest mocks auto-reset via `@dungeonmaster/testing`. Manual cleanup is NOT required.

## Governance

### Amendment Procedure

1. Propose amendment via PR with rationale
2. Document impact on existing code
3. Update dependent templates if principles change
4. Increment version according to semantic versioning:
   - MAJOR: Backward-incompatible principle removal or redefinition
   - MINOR: New principle or materially expanded guidance
   - PATCH: Clarifications, wording, typo fixes

### Compliance Review

- All PRs MUST verify compliance with constitution principles
- Complexity beyond constitution guidelines MUST be justified in PR description
- Constitution supersedes conflicting guidance in other documents

### Conflict Resolution

When guidance conflicts:

1. Constitution takes precedence
2. MCP tool output takes precedence over manual patterns
3. Explicit requirements take precedence over inferred patterns

**Version**: 1.0.0 | **Ratified**: 2025-07-03 | **Last Amended**: 2026-01-28
