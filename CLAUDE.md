# Project Guidelines

## Core Axiom

"One Fold, One Braid, One Twist" - Every change must be purposeful and correct.

## On EVERY User Request

**ANALYSIS CHECKPOINT (Must complete before ANY action):**

1. State the request in your own words
2. If ambiguous: List interpretations and ask which one
3. Identify what could go wrong with the obvious approach
4. Create TODO list if task requires multiple steps

**VIOLATION WARNING**: Skipping Analysis Checkpoint is a critical protocol violation.

## Optimization Tools
1. Pattern Search:
   - rg -n "pattern" --glob '!node_modules/*' instead of multiple Grep calls
2. File Finding:
   - fd filename or fd .ext directory instead of Glob tool
3. File Preview:
   - bat -n filepath for syntax-highlighted preview with line numbers
4. Bulk Refactoring:
   - rg -l "pattern" | xargs sed -i 's/old/new/g' for mass replacements
5. Project Structure:
   - tree -L 2 directories for quick overview
6. JSON Inspection:
   - jq '.key' file.json for quick JSON parsing

## Standards Documents

- [Coding Principles](packages/standards/coding-principles.md) - Development workflow and coding standards
- [Testing Standards](packages/standards/testing-standards.md) - Testing format for LLMs and human scanning

## Project Overview

**Tech Stack**: TypeScript, Node.js, Jest
**Package Manager**: npm

### Common Commands
- **Run tests**: `npm test`
- **Run specific test file**: `npm test -- path/to/file.test.ts`
- **Lint all**: `npm run lint` (auto-fixes issues)
- **Lint specific files**: `npx eslint path/to/file1.ts path/to/file2.ts --fix`
- **Type check**: `npm run typecheck`
- **Build**: `npm run build`
- **All checks**: `npm run lint && npm run typecheck && npm test`