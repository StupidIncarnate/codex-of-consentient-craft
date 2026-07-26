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
        /^describe\.each\(PAUSEABLE_STATUSES\)\('pause-capable status: %s', \(status\) => \{$/mu,
      );
    });

    it('VALID: {} => includes subset-membership expected values guidance', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^\*\*Subset-membership expected values:\*\* When `it\.each` iterates the full list and each case's expected value is "is this member in a subset\?" \(e\.g\., "is this status pauseable\?"\), derive the subset by filtering the same statics source\. One statics source drives BOTH the iteration list AND the expected-subset set — don't hand-maintain a second hardcoded copy\.$/mu,
      );
      expect(result).toMatch(
        /^\s*expect\(isQuestPauseableQuestStatusGuard\(\{ status \}\)\)\.toBe\(PAUSEABLE_STATUSES\.has\(status\)\);$/mu,
      );
    });

    it('VALID: {} => includes literals-in-expect vs it.each distinction', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^\*\*Literals in `expect\(\.\.\.\)` vs `it\.each\(\.\.\.\)`:\*\*$/mu);
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
        /^\*\*Why registerMock over jest\.mock\/jest\.spyOn\?\*\* What a mock gives back is decided by the ARGUMENTS it was called with, and that configuration is shared across every proxy mocking the same function — one function, one behaviour, the way prod behaves\. Reading two different paths in one test gives two different results because the paths differ, not because of the order the reads happen in\. With raw `jest\.mock\(\)`, the second proxy would overwrite the first\.$/mu,
      );
      expect(result).toMatch(/^\*\*MockHandle API:\*\*$/mu);
    });

    it('VALID: {} => documents argument-addressed staging', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^\| `handle\.calledWith\(\[args\]\)` \| Describe a call \+ what it gets back; applies to EVERY matching call \|$/mu,
      );
      expect(result).toMatch(
        /^\| `handle\.onceFor\(\[args\]\)` \| Same, applies ONCE — when identical calls must get different results \|$/mu,
      );
      expect(result).toMatch(
        /^\| `handle\.callsMatching\(\[args\]\)` \| Which calls actually happened with these arguments \(use in assertions\) \|$/mu,
      );
      expect(result).toMatch(/^\*\*How arguments are compared:\*\*$/mu);
    });

    it('VALID: {} => documents callsMatching as a fresh snapshot and returns vs resolves', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^`calledWith` \/ `onceFor` return `\{ returns, resolves, rejects, throws, implement \}` — `\.returns\(\)`\/`\.throws\(\)` hand back the value\/error as-is, `\.resolves\(\)`\/`\.rejects\(\)` wrap it in a Promise \(staging async with `\.returns\(\)` hands back a raw value the caller then calls `\.then\(\)` on\)\. `callsMatching\(\[args\]\)` is a FRESH SNAPSHOT per call, not a live reference — capture it once and poll it and later calls never show up\.$/mu,
      );
    });

    it('VALID: {} => documents shared staging collisions and the discriminating-address fix', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^\*\*Staging is SHARED across every proxy mocking the same function\*\* — one function, one behaviour\. Two proxies describing it at equally low specificity COLLIDE and the later registration silently wins everywhere: seen with `readline\.createInterface` \(stdout reader vs file tailer\), `fs\.readdirSync` \(filenames vs `\{withFileTypes:true\}`\), `path\.join` \(sticky description vs one-shot queue\), an argument-less broker composing three describers\. Fix with a DISCRIMINATING address — a predicate, or just more arguments \(an argument-count mismatch auto-fails to match\) — never by reordering construction, which restores the order-dependency this removes\. Two DIFFERENT results for the SAME address is what `onceFor` is for; staging both as `calledWith` means the later wins on the first call, silently disabling the sequence\.$/mu,
      );
    });

    it('VALID: {} => documents registerSpyOn as a SpyOnHandle alias of MockHandle', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### registerSpyOn — Spy on Global Object Methods$/mu);
      expect(result).toMatch(
        /^`registerSpyOn` spies on methods of global objects \(process, Date, crypto, Math, etc\.\) and returns a `SpyOnHandle` — an alias of `MockHandle`, with the identical `calledWith`\/`onceFor`\/`callsMatching` API\. Throw-on-unmatched is unconditional, EXCEPT `registerSpyOn\(\{ passthrough: true \}\)`, where the real implementation is the catch-all and never throws\.$/mu,
      );
    });

    it('VALID: {} => includes integration testing section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Integration Testing$/mu);
      expect(result).toMatch(
        /^\*\*CRITICAL:\*\* Integration tests are \*\*ONLY for startup files and flows\*\*\. Use `\.integration\.test\.ts` extension\.$/mu,
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

    it('VALID: {} => includes the edit-blocking lint rules section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();
      const messageNeedle = 're-submit the ENTIRE corrected edit, not a surgical follow-up';
      const ruleNeedle = '`@dungeonmaster/ban-primitives`';

      expect(result).toMatch(/^## Lint Rules That BLOCK Your Edit \(pre-edit hook\)$/mu);
      expect(
        result.slice(
          result.indexOf(messageNeedle),
          result.indexOf(messageNeedle) + messageNeedle.length,
        ),
      ).toBe(messageNeedle);
      expect(
        result.slice(result.indexOf(ruleNeedle), result.indexOf(ruleNeedle) + ruleNeedle.length),
      ).toBe(ruleNeedle);
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

    it('VALID: {} => states e2e is Playwright exclusively, colocated in the UI package', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### e2e = Playwright Exclusively, Colocated in the UI Package$/mu);
      expect(result).toMatch(
        /^\*\*`e2e` means Playwright — nothing else\.\*\* A non-Playwright \(Jest\) test that exercises a slice end-to-end is named \*\*integration\*\* \(`\.integration\.test\.ts`\), never "e2e"\.$/mu,
      );
      expect(result).toMatch(
        /^\*\*e2es are `\*\.e2e\.ts`, colocated in the entry flow's folder of the UI package\.\*\* Each e2e lives in the flow\/route folder where the test starts — its `page\.goto` target: `packages\/web\/src\/flows\/<route>\/<feature>\.e2e\.ts`\. Where the test STARTS is where it lives, even when it bridges two UIs\.$/mu,
      );
      expect(result).toMatch(
        /^\*\*The Playwright config \+ UI-specific harnesses live in the UI package\.\*\* `packages\/web\/playwright\.config\.ts` \(`testMatch: '\*\*\/\*\.e2e\.ts'`\) and `packages\/web\/test\/harnesses\/` own the e2e stack\. The `testing` package holds ONLY cross-package reshareables \(register-mock, shared stubs, `installTestbedCreateBroker`\) — it does NOT own e2e config, harnesses, or specs\.$/mu,
      );
      expect(result).toMatch(
        /^\*\*e2e imports are web-relative\.\*\* Spec files import `\{ test, expect, wireHarnessLifecycle \}` and the named harnesses from the UI package's own `test\/` \(e\.g\. `test\/harnesses\/e2e-fixtures`\), NOT from `@dungeonmaster\/testing\/e2e`\.$/mu,
      );
    });

    it('VALID: {} => harness section colocates e2e specs and web-relative fixtures', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^- `\*\.e2e\.ts` \/ `\*\.integration\.test\.ts` → harnesses and contracts\/stubs only$/mu,
      );
      expect(result).toMatch(
        /^\*\*For Playwright:\*\* Spec files use `wireHarnessLifecycle\(\)` from test fixtures\. Spec files MUST import `\{ test, expect \}` from the UI package's web-relative e2e fixtures \(e\.g\. `test\/harnesses\/e2e-fixtures`\), NOT from `@playwright\/test` and NOT from `@dungeonmaster\/testing\/e2e`\.$/mu,
      );
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
