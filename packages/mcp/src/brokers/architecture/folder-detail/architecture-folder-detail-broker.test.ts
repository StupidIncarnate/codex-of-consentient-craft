import { architectureFolderDetailBroker } from './architecture-folder-detail-broker';
import { architectureFolderDetailBrokerProxy } from './architecture-folder-detail-broker.proxy';

describe('architectureFolderDetailBroker', () => {
  describe('brokers folder type', () => {
    it('VALID: {folderType: "brokers"} => returns complete broker documentation', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'brokers' as never,
      });

      expect(result).toBe(`# brokers/ Folder Type

## Purpose

Business logic orchestration. Compose adapters, guards, transformers to implement domain operations.

## File Structure

**Pattern:** \`brokers/[domain]/[action]/[domain]-[action]-broker.ts\`

**Folder Depth:** 2 levels


## Naming Conventions

**File Suffix:** \`-broker.ts\`

**Export Suffix:** \`Broker\` (camelCase)


## Import Rules

**Can import from:**

- \`brokers/\`
- \`adapters/\`
- \`contracts/\`
- \`statics/\`
- \`errors/\`
- \`guards/\`
- \`transformers/\`


## Required Files

**Proxy Required:** Yes

- Implementation: \`{name}-broker.ts\`

- Test: \`{name}-broker.test.ts\`

- Proxy: \`{name}-broker.proxy.ts\`


## Special Features

**Layer Files Allowed:** Yes - Complex logic can be decomposed into \`{name}-layer-{suffix}\` files

**Ad-hoc Types Forbidden:** All types must come from contracts


## Critical Constraints

**MUST:**
- Use kebab-case filenames
- Export with \`export const\` arrow functions
- Include PURPOSE and USAGE metadata comments
- Co-locate test files with implementation

**MUST (Testing):**
- Create \`.proxy.ts\` file for test setup
- Mock only I/O boundaries (adapters)
- All business logic runs real in tests

**MUST NOT:**
- Define inline types or interfaces
- Use raw primitives (string, number) in signatures
- All types must come from contracts/

**IMPORT RESTRICTIONS:**
- Only import from: \`brokers/\`, \`adapters/\`, \`contracts/\`, \`statics/\`, \`errors/\`, \`guards/\`, \`transformers/\`
- Importing from other layers violates architecture

**COMPLEXITY:**
- Keep files under 300 lines
- If exceeding, decompose into layer files
- Each layer file has own proxy and tests

## Learn More

See \`packages/standards/define/project-standards.md\` for detailed examples and patterns.
`);
    });
  });

  describe('contracts folder type', () => {
    it('VALID: {folderType: "contracts"} => returns complete contracts documentation', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'contracts' as never,
      });

      expect(result).toBe(`# contracts/ Folder Type

## Purpose

Type definitions and validation schemas using Zod. All data structures must be defined here with branded types.

## File Structure

**Pattern:** \`contracts/[domain]/[domain]-contract.ts\`

**Folder Depth:** 1 level


## Naming Conventions

**File Suffix:** \`-contract.ts\` or \`.stub.ts\`

**Export Suffix:** \`Contract\` (camelCase)


## Import Rules

**Can import from:**

- \`statics/\`
- \`errors/\`
- \`contracts/\`
- \`zod\`
- \`@questmaestro/shared/@types\`


## Required Files

**Proxy Required:** No

- Implementation: \`{name}-contract.ts\`

- Test: \`{name}-contract.test.ts\`


## Special Features

**Regex Allowed:** Yes - Can use regex literals


## Critical Constraints

**MUST:**
- Use kebab-case filenames
- Export with \`export const\` arrow functions
- Include PURPOSE and USAGE metadata comments
- Co-locate test files with implementation

**IMPORT RESTRICTIONS:**
- Only import from: \`statics/\`, \`errors/\`, \`contracts/\`, \`zod\`, \`@questmaestro/shared/@types\`
- Importing from other layers violates architecture

## Learn More

See \`packages/standards/define/project-standards.md\` for detailed examples and patterns.
`);
    });
  });

  describe('guards folder type', () => {
    it('VALID: {folderType: "guards"} => returns complete guards documentation', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'guards' as never,
      });

      expect(result).toBe(`# guards/ Folder Type

## Purpose

Pure boolean functions that validate conditions. Return true/false, no side effects.

## File Structure

**Pattern:** \`guards/[domain]/[domain]-guard.ts\`

**Folder Depth:** 1 level


## Naming Conventions

**File Suffix:** \`-guard.ts\`

**Export Suffix:** \`Guard\` (camelCase)


## Import Rules

**Can import from:**

- \`contracts/\`
- \`statics/\`
- \`errors/\`
- \`guards/\`
- \`transformers/\`


## Required Files

**Proxy Required:** No

- Implementation: \`{name}-guard.ts\`

- Test: \`{name}-guard.test.ts\`


## Special Features

**Regex Allowed:** Yes - Can use regex literals

**Ad-hoc Types Forbidden:** All types must come from contracts


## Critical Constraints

**MUST:**
- Use kebab-case filenames
- Export with \`export const\` arrow functions
- Include PURPOSE and USAGE metadata comments
- Co-locate test files with implementation

**MUST NOT:**
- Define inline types or interfaces
- Use raw primitives (string, number) in signatures
- All types must come from contracts/

**IMPORT RESTRICTIONS:**
- Only import from: \`contracts/\`, \`statics/\`, \`errors/\`, \`guards/\`, \`transformers/\`
- Importing from other layers violates architecture

## Learn More

See \`packages/standards/define/project-standards.md\` for detailed examples and patterns.
`);
    });
  });

  describe('statics folder type', () => {
    it('VALID: {folderType: "statics"} => returns complete statics documentation', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'statics' as never,
      });

      expect(result).toBe(`# statics/ Folder Type

## Purpose

Immutable configuration values and constants. Single source of truth for magic numbers, limits, and unchanging data.

## File Structure

**Pattern:** \`statics/[domain]/[domain]-statics.ts\`

**Folder Depth:** 1 level


## Naming Conventions

**File Suffix:** \`-statics.ts\`

**Export Suffix:** \`Statics\` (camelCase)


## Import Rules

**Cannot import from any other layers** - Pure domain entities


## Required Files

**Proxy Required:** No

- Implementation: \`{name}-statics.ts\`

- Test: \`{name}-statics.test.ts\`


## Special Features

**Ad-hoc Types Forbidden:** All types must come from contracts


## Critical Constraints

**MUST:**
- Use kebab-case filenames
- Export with \`export const\` arrow functions
- Include PURPOSE and USAGE metadata comments
- Co-locate test files with implementation

**MUST NOT:**
- Define inline types or interfaces
- Use raw primitives (string, number) in signatures
- All types must come from contracts/

## Learn More

See \`packages/standards/define/project-standards.md\` for detailed examples and patterns.
`);
    });
  });

  describe('startup folder type', () => {
    it('VALID: {folderType: "startup"} => returns complete startup documentation', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'startup' as never,
      });

      expect(result).toBe(`# startup/ Folder Type

## Purpose

Application initialization and configuration. Entry points, server startup, CLI commands.

## File Structure

**Pattern:** \`startup/start-[name].ts\`

**Folder Depth:** 0 levels


## Naming Conventions

**File Suffix:** \`.ts\`


## Import Rules

**Can import from anywhere** - Orchestration/startup files


## Required Files

**Proxy Required:** No

- Implementation: \`{name}.ts\`

- Test: \`{name}.test.ts\`


## Special Features

**Ad-hoc Types Forbidden:** All types must come from contracts


## Critical Constraints

**MUST:**
- Use kebab-case filenames
- Export with \`export const\` arrow functions
- Include PURPOSE and USAGE metadata comments
- Co-locate test files with implementation

**MUST NOT:**
- Define inline types or interfaces
- Use raw primitives (string, number) in signatures
- All types must come from contracts/

## Learn More

See \`packages/standards/define/project-standards.md\` for detailed examples and patterns.
`);
    });
  });

  describe('unknown folder type', () => {
    it('VALID: {folderType: "unknown-type"} => returns error message', () => {
      architectureFolderDetailBrokerProxy();

      const result = architectureFolderDetailBroker({
        folderType: 'unknown-type' as never,
      });

      expect(result).toBe(`# Unknown Folder Type: unknown-type

No configuration found for this folder type.`);
    });
  });
});
