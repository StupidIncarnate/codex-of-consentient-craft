# Project Guidelines

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

- [Project Standards](packages/standards/project-standards.md) - Universal project structure, naming conventions, and
  architectural patterns
- [Testing Standards](packages/standards/testing-standards.md) - Testing format for LLMs and human scanning

## Project Overview

**Tech Stack**: TypeScript, Node.js, Jest
**Package Manager**: npm

**Testing**: Jest mocks are automatically reset/cleared/restored globally before each test via `@questmaestro/testing`
package. No need to manually add `jest.clearAllMocks()` in individual test files - test isolation is enforced
automatically.

### Common Commands
- **Run tests**: `npm test`
- **Run specific test file**: `npm test -- path/to/file.test.ts`
- **Lint all**: `npm run lint` (auto-fixes issues)
- **Lint specific files**: `npm run lint -- path/to/file1.ts path/to/file2.ts --fix`
- **Type check**: `npm run typecheck` (checks entire project with proper tsconfig.json)
- **Build**: `npm run build`
- **All checks**: `npm run lint && npm run typecheck && npm test`