import { architectureTestingPatternsBroker } from './architecture-testing-patterns-broker';
import { architectureTestingPatternsBrokerProxy } from './architecture-testing-patterns-broker.proxy';
import type { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

type ContentText = ReturnType<typeof ContentTextStub>;

describe('architectureTestingPatternsBroker', () => {
  describe('generate testing patterns documentation', () => {
    it('VALID: {} => returns markdown with testing philosophy', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^# Testing Patterns & Philosophy$/mu);
      expect(result).toMatch(/^## Core Principles$/mu);
      expect(result).toMatch(
        /^\*\*Why so strict\?\*\* Loose tests pass when code is broken\. Exact tests catch real bugs\.$/mu,
      );
    });

    it('VALID: {} => includes type safety section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Type Safety$/mu);
      expect(result).toMatch(
        /^Use `ReturnType<typeof StubName>` ONLY when you need the type in function signatures or annotations:$/mu,
      );
      expect(result).toMatch(
        /^\*\*CRITICAL:\*\* Test files AND proxy files CANNOT import types from contracts\.$/mu,
      );
    });

    it('VALID: {} => includes DAMP > DRY principle', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### DAMP > DRY$/mu);
      expect(result).toMatch(
        /^Tests should be \*\*Descriptive And Meaningful\*\*, not DRY\. Each test must be readable standalone without looking at helpers\.$/mu,
      );
    });

    it('VALID: {} => includes parameterize state matrices section heading', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Parameterize State Matrices with `it\.each`$/mu);
      expect(result).toMatch(
        /^\*\*DAMP > DRY still holds\.\*\* But when a test is repeated 3 or more times with the only variation being an input value \(cycling through every status in a union, every enum member, every invalid input variant\), parameterize with `it\.each`, `test\.each`, or `describe\.each`\. The body, setup, and assertion shape must be identical across cases — only literal values change\.$/mu,
      );
    });

    it('VALID: {} => includes parameterize state matrices guidance and example', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^\*\*When to parameterize:\*\*$/mu);
      expect(result).toMatch(/^\*\*When NOT to parameterize \(DAMP wins\):\*\*$/mu);
      expect(result).toMatch(
        /^describe\.each\(\['seek_scope', 'seek_walk', 'in_progress'\] as const\)\($/mu,
      );
    });

    it('VALID: {} => includes test behavior not implementation', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Test Behavior, Not Implementation$/mu);
      expect(result).toMatch(/^it\("VALID: \{price: 100, tax: 0\.1\} => returns 110"\)$/mu);
    });

    it('VALID: {} => includes unit vs integration tests', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Unit Tests vs Integration Tests$/mu);
      expect(result).toMatch(/^\*\*Unit Test \(mock dependencies\):\*\*$/mu);
      expect(result).toMatch(/^\*\*Integration Test \(real dependencies\):\*\*$/mu);
    });

    it('VALID: {} => includes 100% branch coverage', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### 100% Branch Coverage$/mu);
      expect(result).toMatch(
        /^\*\*You must manually verify test cases against implementation code\.\*\* Jest's `--coverage` can miss logical branches\.$/mu,
      );
    });

    it('VALID: {} => includes test structure section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Test Structure$/mu);
      expect(result).toMatch(/^\*\*Always use describe blocks\*\* - never comments:$/mu);
      expect(result).toMatch(/^- `VALID:` - Expected success paths$/mu);
      expect(result).toMatch(
        /^- `INVALID:` - Validation failures \(single or multiple fields\)$/mu,
      );
    });

    it('VALID: {} => includes core assertions section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Core Assertions$/mu);
      expect(result).toMatch(
        /^\*\*Use toStrictEqual for all objects\/arrays\*\* - catches property bleedthrough:$/mu,
      );
      expect(result).toMatch(
        /^expect\(result\)\.toMatchObject\(\{id: '123'\}\); \/\/ Extra properties pass$/mu,
      );
    });

    it('VALID: {} => includes proxy architecture section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Proxy Architecture$/mu);
      expect(result).toMatch(/^### Core Rule$/mu);
      expect(result).toMatch(
        /^\*\*Mock only at I\/O boundaries\. Everything else runs REAL\.\*\*$/mu,
      );
    });

    it('VALID: {} => includes what gets mocked diagram', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### What Gets Mocked vs What Runs Real$/mu);
      expect(result).toMatch(/^Widget Test:$/mu);
      expect(result).toMatch(/^│ Widget\s+\(REAL\)\s+│ ← Test renders this$/mu);
      expect(result).toMatch(/^│\s+├─ Date\.now\(\)\s+\(MOCKED\)\s+│ ← Mock global function$/mu);
    });

    it('VALID: {} => includes quick reference table', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Quick Reference: What Needs Proxies\?$/mu);
      expect(result).toMatch(
        /^\| Contracts\s+\| ❌ No\s+\| Use stubs \(\.stub\.ts files\) - includes service objects with methods\s+\|$/mu,
      );
      expect(result).toMatch(
        /^\| Adapters\s+\| ✅ Sometimes\s+\| \*\*Mock npm dependency\*\* \(axios, fs, etc\.\)\. Empty proxy if no mocking needed \(simple re-exports\)\s*\|$/mu,
      );
      expect(result).toMatch(
        /^\| Brokers\s+\| ✅ Sometimes\s+\| Compose adapter proxies, provide semantic setup\. Empty proxy if no dependencies mocked\s+\|$/mu,
      );
    });

    it('VALID: {} => includes detailed proxy patterns reference', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Detailed Proxy Patterns$/mu);
      expect(result).toMatch(
        /^\*\*Detailed proxy patterns for each folder type\*\* - Use `get-folder-detail\(\{ folderType: "\.\.\." \}\)` to see specific examples:$/mu,
      );
      expect(result).toMatch(/^\*\*Empty Proxy Pattern:\*\*$/mu);
      expect(result).toMatch(
        /^export const pureTransformerProxy = \(\): Record<PropertyKey, never> => \(\{\}\);$/mu,
      );
    });

    it('VALID: {} => includes create-per-test pattern', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Create-Per-Test Pattern$/mu);
      expect(result).toMatch(
        /^\*\*CRITICAL:\*\* Create a fresh proxy in each test\. Proxies set up mocks in their constructor\.$/mu,
      );
    });

    it('VALID: {} => includes child proxy creation', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Child Proxy Creation$/mu);
      expect(result).toMatch(/^\*\*When to assign child proxy to variable:\*\*$/mu);
    });

    it('VALID: {} => includes global function mocking', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Global Function Mocking$/mu);
      expect(result).toMatch(
        /^\*\*Common globals:\*\* Date\.now\(\), crypto\.randomUUID\(\), Math\.random\(\), console\.\*$/mu,
      );
    });

    it('VALID: {} => includes stub factories section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Stub Factories$/mu);
      expect(result).toMatch(
        /^\*\*Complete stub patterns in contracts\/ folder detail\*\* - Use `get-folder-detail\(\{ folderType: "contracts" \}\)`\.$/mu,
      );
    });

    it('VALID: {} => includes mocking mechanics section with registerMock', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Mocking Mechanics$/mu);
      expect(result).toMatch(
        /^\*\*Use `registerMock` for all mocking in proxy files\.\*\* It replaces `jest\.mock\(\)`\/`jest\.mocked\(\)`\/`jest\.spyOn\(\)`\.$/mu,
      );
      expect(result).toMatch(
        /^\*\*Why registerMock over jest\.mock\/jest\.spyOn\?\*\* Stack-based dispatch lets multiple proxies mock the same `jest\.fn\(\)` without collision\. When a broker proxy composes two adapter proxies that both mock the same npm function, `registerMock` routes each call to the correct proxy based on the call stack\. With raw `jest\.mock\(\)`, the second proxy would overwrite the first\.$/mu,
      );
      expect(result).toMatch(/^\*\*MockHandle API:\*\*$/mu);
    });

    it('VALID: {} => includes integration testing section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Integration Testing$/mu);
      expect(result).toMatch(
        /^\*\*CRITICAL:\*\* Integration tests are \*\*ONLY for startup files\*\*\. They validate that startup files correctly wire up the entire application\. Use `\.integration\.test\.ts` extension\.$/mu,
      );
    });

    it('VALID: {} => includes no hooks or conditionals section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## No Hooks or Conditionals$/mu);
      expect(result).toMatch(
        /^\*\*CRITICAL:\*\* `beforeEach`, `afterEach`, `beforeAll`, `afterAll` are forbidden\. All setup and teardown must be inline in each test\.$/mu,
      );
    });

    it('VALID: {} => includes proxy encapsulation rule', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Proxy Encapsulation Rule$/mu);
      expect(result).toMatch(
        /^\*\*CRITICAL:\*\* Proxies must expose semantic methods, NOT child proxies\. Tests should never chain through multiple proxy levels\.$/mu,
      );
    });

    it('VALID: {} => includes statics proxy pattern', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Statics Proxy Pattern$/mu);
      expect(result).toMatch(
        /^\*\*Statics proxies\*\* override immutable values for edge case testing\. Use `Reflect\.set\(\)` to mutate readonly constants at runtime, or `registerSpyOn` for getters\.$/mu,
      );
    });

    it('VALID: {} => includes no magic numbers section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## No Magic Numbers$/mu);
      expect(result).toMatch(
        /^\*\*Extract magic numbers to statics files\.\*\* Tests and implementation should reference statics, not inline constants\.$/mu,
      );
    });

    it('VALID: {} => no-magic-numbers section covers lists and enumerations too', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^\*\*Same principle applies to lists and enumerations\.\*\* When a test iterates over a finite set of values \(every status in a union, every enum member, every kind of minion\), it MUST import the canonical list from its single source of truth — a `\*-statics\.ts`, a Zod schema's `\.options`, or an exported readonly array — and filter\/partition from it\. Never re-type the members inline\. Hardcoded arrays rot the moment someone adds a new member: the new member is silently omitted from the test, and "100% coverage" becomes a lie\.$/mu,
      );
      expect(result).toMatch(
        /^\*\*If the canonical list doesn't exist yet, promote it first\.\*\* A test that enumerates a finite set of values and has no existing single-source-of-truth is a signal to move the array into a `\*-statics\.ts` \(or lean on the Zod schema's `\.options` for enums\), then import it from both the test and the production code\. "What are all the possible values\?" becomes a single grep, and future additions automatically flow to every consumer that imports the list\.$/mu,
      );
    });

    it('VALID: {} => includes endpoint mock section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## EndpointMock \(HTTP Mocking for Frontend Tests\)$/mu);
      expect(result).toMatch(
        /^Use `StartEndpointMock` for \*\*any test that needs to mock HTTP responses\*\* — broker tests, widget integration tests, or any layer that ultimately calls a fetch adapter\.$/mu,
      );
    });

    it('VALID: {} => includes e2e testing section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## E2E Testing \(Playwright\)$/mu);
      expect(result).toMatch(/^### Assert the Full Transition$/mu);
    });

    it('VALID: {} => includes harness pattern section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Test Infrastructure \(Harness Pattern\)$/mu);
      expect(result).toMatch(/^### The `\.harness\.ts` Pattern$/mu);
    });

    it('VALID: {} => includes common anti-patterns reference', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Common Anti-Patterns$/mu);
      expect(result).toMatch(
        /^\*\*Common testing anti-patterns are documented in syntax rules\*\* - Use `get-syntax-rules\(\)` for complete list with examples\.$/mu,
      );
      expect(result).toMatch(
        /^See `get-syntax-rules\(\)` testing\.antiPatterns section for detailed violations and correct approaches\.$/mu,
      );
    });

    it('VALID: {} => includes summary checklist', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Summary Checklist$/mu);
      expect(result).toMatch(/^- \[ \] Created fresh proxy in test \(not shared\)$/mu);
      expect(result).toMatch(
        /^- \[ \] Used ReturnType<typeof Stub> for types \(not contract imports\)$/mu,
      );
    });
  });
});
