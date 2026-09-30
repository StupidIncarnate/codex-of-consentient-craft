import { architectureTestingPatternsBroker } from './architecture-testing-patterns-broker';
import { architectureTestingPatternsBrokerProxy } from './architecture-testing-patterns-broker.proxy';

type ContentText = string;

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

      expect(result).toMatch(
        /^\*\*When to parameterize:\*\* 3 or more cases whose body, setup and assertion shape are identical and only the literal input differs — union variants, enum members, status matrices, error codes, boundary values\. The test proves one rule holds for every member of a set\.$/mu,
      );
      expect(result).toMatch(
        /^\*\*When NOT to parameterize \(DAMP wins\):\*\* setup differs between cases, assertion shape differs beyond a simple mapping, each case carries a distinct meaning deserving its own sentence-length name, or there are only 2 cases\.$/mu,
      );
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

    it('VALID: {} => forbids .toBeNull() and names .toBe(null) as its replacement', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      // `toBeNull` is banned by `ban-weak-existence-matchers`, whose list this table does not
      // feed, so the row went missing while the lint rule stayed real. An audit of 19 sub-agent
      // briefs found a hand-written brief was the only place in the system a worker learned it —
      // which reaches whichever worker its operator happened to remember, and no one else.
      expect(result).toMatch(/^\| `\.toBeNull\(\)` \| `\.toBe\(null\)` \|$/mu);

      // The same rule bans toBeTruthy/toBeFalsy with the same replacements; pin the row that
      // already carries them so a table edit cannot drop the half that was never missing.
      expect(result).toMatch(
        /^\| `\.toBeTruthy\(\)` \/ `\.toBeFalsy\(\)` \| `\.toBe\(true\)` \/ `\.toBe\(false\)` \|$/mu,
      );
    });

    it('VALID: {} => requires bringToFront before any geometry measurement in an e2e', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      // A backgrounded Playwright page reports every node as invisible with a zero-ish box, which
      // reads as a product bug and has burned real debugging time. Pin the whole four-step
      // remedy: a partial one (bringToFront with no forced frame) still measures a stale layout.
      const trapNeedle =
        'A page that is not the active tab reads `document.visibilityState === "hidden"`, and Chromium then stops committing layout frames';
      const remedyNeedle =
        "call `page.bringToFront()`, take a `page.screenshot()` to force a frame, assert `document.visibilityState` is `'visible'`, and only then measure.";

      expect(result).toMatch(/^### Bring the Page to the Front Before Measuring Geometry$/mu);
      expect(
        result.slice(result.indexOf(trapNeedle), result.indexOf(trapNeedle) + trapNeedle.length),
      ).toBe(trapNeedle);
      expect(
        result.slice(
          result.indexOf(remedyNeedle),
          result.indexOf(remedyNeedle) + remedyNeedle.length,
        ),
      ).toBe(remedyNeedle);
      expect(result).toMatch(
        /^const visibilityState = await page\.evaluate\(\(\) => document\.visibilityState\);$/mu,
      );
    });

    it('VALID: {} => includes proxy architecture section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Proxy Architecture$/mu);
      expect(result).toMatch(/^### Core Rule$/mu);
      expect(result).toMatch(
        /^\*\*Mock only what the I\/O trap or MSW catches\. Everything else runs REAL\.\*\*$/mu,
      );
    });

    it('VALID: {} => includes what gets mocked diagram', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### What Gets Mocked vs What Runs Real$/mu);
      expect(result).toMatch(/^Widget Test:$/mu);
      expect(result).toMatch(/^Widget\s+\(REAL\)\s+← Test renders this$/mu);
      expect(result).toMatch(/^\s+├─ Date\.now\(\)\s+\(MOCKED\)\s+← Mock global function$/mu);
    });

    it('VALID: {} => includes quick reference table', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Quick Reference: What Needs Proxies\?$/mu);
      expect(result).toMatch(
        /^\| Contracts\s+\| ❌ No\s+\| Use stubs \(\.stub\.ts files\)\. An outside type comes from the gateway's stub, imported from its own file\s+\|$/mu,
      );
      expect(result).toMatch(
        /^\| Brokers\s+\| ✅ Sometimes\s+\| Compose the proxies of the gateway wrappers the broker calls, each imported from its own `\.proxy` file, and provide semantic setup\. Empty proxy if no dependencies mocked\s+\|$/mu,
      );
      expect(result).toMatch(
        /^\| Middleware\s+\| ✅ Yes\s+\| Delegate to gateway wrapper proxies\s+\|$/mu,
      );
    });

    it('VALID: {} => includes detailed proxy patterns reference', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Detailed Proxy Patterns$/mu);
      expect(result).toMatch(
        /^\*\*Detailed proxy patterns for each folder type\*\* - Use `get-folder-detail\(\{ folderType: "\.\.\." \}\)` to see specific examples: brokers, bindings, widgets, responders, middleware, state, guards\.$/mu,
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
      expect(result).toMatch(
        /^\*\*When to assign child proxy to variable:\*\* you call methods on it \(the delegation pattern\), or you use it in the return object\.$/mu,
      );
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
      expect(result).toMatch(
        /^An unaddressed `callsMatching\(\[\]\)` has no `\.at\(\)`\/index — address it, or assert the whole list\.$/mu,
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
        /^\*\*Staging is SHARED across every proxy mocking the same function\*\* — one function, one behaviour\. Two proxies describing it at equally low specificity COLLIDE and the later registration silently wins everywhere — the shape recurs whenever two callers share one Node API: `readline\.createInterface` \(stdout reader vs file tailer\), `fs\.readdirSync` \(filenames vs `\{withFileTypes: true\}`\), `path\.join` \(sticky default vs one-shot queue\)\. Fix with a DISCRIMINATING address — a predicate, or just more arguments \(an argument-count mismatch auto-fails to match\) — never by reordering construction, which restores the order-dependency this removes\. Two DIFFERENT results for the SAME address is what `onceFor` is for; staging both as `calledWith` means the later wins on the first call, silently disabling the sequence\.$/mu,
      );
    });

    it('VALID: {} => documents the address-per-target table for common mock targets', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^\*\*Where's the address, per target:\*\*$/mu);
      expect(result).toMatch(
        /^\| `fs` reads\/writes \(`readFile`, `writeFile`, `existsSync`, `readdir`, …\) \| the PATH \(arg 0\); write body is arg 1 \(`callsMatching\(\[path\]\)\.at\(-1\)\?\.\[1\]`\) \|$/mu,
      );
      expect(result).toMatch(
        /^\| `crypto\.randomUUID`, `Date\.now`, `Date\.prototype\.toISOString`, `Math\.random`, `process\.cwd` \| NO argument — `calledWith\(\[\]\)` is honest, not lazy \|$/mu,
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
        /^\*\*CRITICAL:\*\* Integration tests are \*\*ONLY for startup files and flows\*\*\. Use `\.integration\.test\.ts` extension, colocated with the file under test — never in a separate test directory\.$/mu,
      );
    });

    it('VALID: {} => includes recipes and ingredients section defining both terms', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Recipes and Ingredients$/mu);
      expect(result).toMatch(
        /^A recipe is a named, composable way to put the app into a known state\. A siegelense `seed` step calls it, an e2e spec calls it, and an integration test calls it — the same recipe works everywhere, because a recipe only builds a plan and never decides who runs it\.$/mu,
      );
      expect(result).toMatch(
        /^An ingredient is one entity's routes — its create, read, update and delete operations\. Every ingredient declares `copies:`, naming the production code its routes imitate\. When an ingredient's route breaks, `copies:` is where to look first: diff what it copies against what it writes, because a route that no longer matches production is the usual cause\.$/mu,
      );
    });

    it('VALID: {} => tells a recipe author to name inputs after their field and declare returned fields', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Writing a recipe$/mu);
      expect(result).toMatch(
        /^Write a recipe so an agent who has read only `docs --for walking` can pick it up and use it correctly — nothing more\.$/mu,
      );
      expect(result).toMatch(
        /^- \*\*Name each input after the field it fills\.\*\* An input called `guildId` fills a `guildId` field, so a caller can guess the shape without opening the recipe\.$/mu,
      );
      expect(result).toMatch(
        /^- \*\*Give each input, and each field the recipe returns, a one-line meaning\.\*\* A bare key name like `guildId` says nothing about what value goes in or what comes out\.$/mu,
      );
      expect(result).toMatch(
        /^- \*\*Declare every field the recipe hands back to later steps\.\*\* A `seed` step names its own result with `as` \(`\{ "step": "seed", "recipe": "<name>", "as": "g" \}`\), and every step after it reaches into that handle — `\{g\.guildId\}`, `\{g\.guildSlug\}`\. An undeclared field is a field the next step cannot know exists\.$/mu,
      );
    });

    it('VALID: {} => tells a recipe author to keep makes honest, compose first, and prove with a real run', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^- \*\*Keep `makes` honest\.\*\* `makes` states the count of each thing the recipe creates\. A recipe that creates three quests and reports one hides state an assertion will trip over later\.$/mu,
      );
      expect(result).toMatch(
        /^- \*\*Seed TWO of anything an assertion must tell apart\.\*\* A recipe that seeds only one of something makes "the right one" and "the first one" the same value, so an off-by-index bug passes against it and a clean result proves nothing\.$/mu,
      );
      expect(result).toMatch(
        /^- \*\*Compose existing recipes before writing a new one\.\*\* Two existing recipes often already combine into the state a new task needs\. A new recipe where two would compose makes the book bigger without making it more capable\.$/mu,
      );
      expect(result).toMatch(
        /^- \*\*Prove each recipe with a real run\.\*\* Run it against a throwaway instance and read back what it produced\. An unproven recipe does not fail loudly — it manufactures a defect that does not exist, because nobody checked its claimed state against its real one\.$/mu,
      );
      expect(result).toMatch(
        /^The `CLAUDE\.md` in a repo's own `hydration-recipes` package is where that repo records the specifics of its own recipes and ingredients — which ones exist, what each one copies, and anything particular to that repo's state\.$/mu,
      );
    });

    it('VALID: {} => includes argument coverage section heading and the every-argument list', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Argument Coverage for Entry Points$/mu);
      expect(result).toMatch(
        /^\*\*Every documented argument of an entry point needs a test\.\*\* Covering the entry point's default invocation is not covering the entry point — a flag no test ever sets is a flag no test ever proves works\.$/mu,
      );
      expect(result).toMatch(/^- Each value of a documented enum flag\.$/mu);
      expect(result).toMatch(/^- The refusal when a required flag is missing\.$/mu);
    });

    it('VALID: {} => bans parser-only argument tests and boundary mocks, and restates the rule', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^\*\*A test that exercises only the argument PARSER does not cover the argument\.\*\* Asserting that a flag parses into the right field proves the parser works, not that the flag does anything\. The test must reach the BEHAVIOUR the argument selects — the effect the documentation promises, not the value on the way in\.$/mu,
      );
      expect(result).toMatch(
        /^\*\*A test that stages a boundary with a shape the real producer never emits passes while the feature is broken\.\*\* Where a flow's argument crosses a package boundary, the coverage that counts is an integration test running the real code on both sides\. A unit test whose mock is the only description of that boundary describes the mock, not the boundary, and the two can drift apart with nothing to catch it — a mock invented to match the caller's assumptions, not the producer's real output, is how a documented flag ships broken\.$/mu,
      );
      expect(result).toMatch(
        /^\*\*Restated:\*\* a green suite that never drove a flag through its real path is not evidence the flag works\. Cover the default invocation AND the full argument surface — every documented flag, every enum value, every required-flag refusal, every mutually exclusive or co-required combination — crossing every package boundary for real\.$/mu,
      );
    });

    it('VALID: {} => includes no hooks or conditionals section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## No Hooks or Conditionals$/mu);

      // The ban is SCOPED, and an unscoped reading is what sends a session hand-rolling inline
      // setup for a child process an integration suite has to start once. Pin both halves.
      const unitNeedle =
        '**CRITICAL:** in a UNIT test, `beforeEach`, `afterEach`, `beforeAll` and `afterAll` are forbidden';
      const exemptionNeedle =
        '**An integration or e2e test MAY use them, and the lint config says so**';
      const windowNeedle =
        '**Reach for `beforeAll` there when a cost belongs to the SUITE rather than to a test.**';

      expect(
        result.slice(result.indexOf(unitNeedle), result.indexOf(unitNeedle) + unitNeedle.length),
      ).toBe(unitNeedle);
      expect(
        result.slice(
          result.indexOf(exemptionNeedle),
          result.indexOf(exemptionNeedle) + exemptionNeedle.length,
        ),
      ).toBe(exemptionNeedle);
      expect(
        result.slice(
          result.indexOf(windowNeedle),
          result.indexOf(windowNeedle) + windowNeedle.length,
        ),
      ).toBe(windowNeedle);
    });

    it('VALID: {} => includes the edit-blocking lint rules section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();
      const messageNeedle = 're-submit the ENTIRE corrected edit, not a surgical follow-up';
      const ruleNeedle = '`@dungeonmaster/ban-invented-failures`';

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
        /^\*\*A statics proxy is empty\.\*\* It mutates nothing, because a constant is immutable\. To exercise an edge value, pass it into the function under test\. Use `registerSpyOn` only for a getter\.$/mu,
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
        /^Use `StartEndpointMock` for \*\*any test that needs to mock HTTP responses\*\* — broker tests, widget integration tests, or any layer that ultimately calls a fetch gateway wrapper\. \*\*Always via the broker proxy layer\*\* — never call it directly in a test file\.$/mu,
      );
    });

    it('VALID: {} => includes e2e testing section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## E2E Testing \(Playwright\)$/mu);
      expect(result).toMatch(/^### Assert the Full Transition$/mu);
    });

    it('VALID: {} => states e2e is Playwright exclusively, colocated in the e2e-eligible package', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^### e2e = Playwright Exclusively, Colocated in the E2E-Eligible Package$/mu,
      );
      expect(result).toMatch(
        /^\*\*`e2e` means Playwright — nothing else\.\*\* A non-Playwright \(Jest\) test that exercises a slice end-to-end is named \*\*integration\*\* \(`\.integration\.test\.ts`\), never "e2e"\.$/mu,
      );
      expect(result).toMatch(
        /^\*\*e2es are `\*\.e2e\.ts`, colocated in the entry flow's folder of the e2e-eligible package\.\*\* A package is e2e-eligible when its `packageType` is `frontend-react` or `frontend-ink`\. Each e2e lives in the flow\/route folder where the test starts — its `page\.goto` target: `<e2e-eligible-package>\/src\/flows\/<route>\/<feature>\.e2e\.ts`\. Where the test STARTS is where it lives, even when it bridges two e2e-eligible packages\.$/mu,
      );
      expect(result).toMatch(
        /^\*\*The Playwright config \+ package-specific harnesses live in the e2e-eligible package\.\*\* `<e2e-eligible-package>\/playwright\.config\.ts` \(`testMatch: '\*\*\/\*\.e2e\.ts'`\) and `<e2e-eligible-package>\/test\/harnesses\/` own the e2e stack\. The `testing` package holds ONLY cross-package reshareables \(register-mock, shared stubs, `installTestbedCreateBroker`\) — it does NOT own e2e config, harnesses, or specs\.$/mu,
      );
      expect(result).toMatch(
        /^\*\*Nest Playwright's `outputDir` and Vite's `cacheDir` under the run's port\*\* — `test-results\/<port>`, `node_modules\/\.vite-<port>` — or parallel walks wipe each other's traces and cache\. Ward reaps both, so it costs no disk\.$/mu,
      );
    });

    it('VALID: {} => requires the webServer command to be a no-watch script, and names both Vite knobs', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### The Dev Server a Run Starts Must Not Watch Files$/mu);
      expect(result).toMatch(
        /^Playwright's `webServer` command must name a NO-WATCH script, and the block must set `reuseExistingServer: false`\. A watcher that RESTARTS the process drops the port mid-suite, so in-flight requests get a bare 500 with an EMPTY body and several unrelated specs fail at once\. A watcher that HOT-RELOADS reloads the page a spec is asserting on — a blank screenshot, then a timeout\. \*\*For Vite, `hmr: false` alone is not enough: add `watch: null`\.\*\* The scaffolded `playwright\.config\.ts` carries the whole rule in its comments\.$/mu,
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

    it('VALID: {} => bans any/as/@ts-ignore and names the one allowed escape hatch', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^\*\*Never silence a type error with `any`, `as`, or `@ts-ignore`\.\*\* One escape hatch is allowed:$/mu,
      );
      expect(result).toMatch(
        /^- \[ \] No `any`, `as` or `@ts-ignore` used to silence a type error$/mu,
      );
    });

    it('VALID: {} => names the two kinds of mocked things and leaves pass-throughs real', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^1\. \*\*A call the I\/O trap or MSW catches\*\* - compose the gateway wrapper's proxy, imported from its own file, in the proxy of the file that calls the wrapper\. A pass-through wrapper \(one that only re-exports an outside function, such as `path`\) runs real and has no proxy\.$/mu,
      );
      expect(result).toMatch(
        /^Mocked: what the I\/O trap or MSW catches, and globals a test pins\. Everything else runs real\.$/mu,
      );
    });

    it('VALID: {} => gives a constructor calledWith([]) only to a function that takes no arguments', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^A constructor-level `calledWith\(\[\]\)` belongs only to a function that takes no arguments \(`randomUUID`, `Date\.now`, `process\.cwd`\), where `\[\]` is the only address there is\. A function that takes arguments never gets a constructor default: an unstaged call must throw, so the I\/O trap can name the call the proxy forgot\. `ban-proxy-empty-called-with` and `ban-proxy-catch-all-defaults` refuse both the empty address and a predicate that is always true\.$/mu,
      );
    });

    it('VALID: {} => shows a plain value staged by its address and a composed gateway proxy', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^A loose string or number needs no brand and no stub in a mock: `handle\.calledWith\(\[filePath\]\)\.resolves\('content'\)`\.$/mu,
      );
      expect(result).toMatch(
        /^import \{ readFileProxy \} from '#gateway\/node\/fs__promises\/read-file\/read-file\.proxy';$/mu,
      );
      expect(result).toMatch(
        /^proxy\.returns\(\{path: '\/repo\/config\.json', contents: '\{\}'\}\);$/mu,
      );
    });

    it('VALID: {} => says MSW loads in every package from the root Jest base config', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^\*\*MSW lifecycle:\*\* MSW loads in every package, server included, from the root Jest base config, and `StartEndpointMockSetup` handles start, per-test handler reset and close\. A package adds no setup file for it\.$/mu,
      );
      expect(result).toMatch(
        /^import \{ fetchJsonProxy \} from '#gateway\/browser\/fetch\/fetch-json\/fetch-json\.proxy';$/mu,
      );
    });

    it('VALID: {} => includes the gateway proxies and test support section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Gateway Proxies and Test Support$/mu);
      expect(result).toMatch(/^### Import each stub and proxy from its own file$/mu);
      expect(result).toMatch(
        /^No production barrel exports a stub or a proxy\. A test or proxy file imports each one from the file beside the thing it fakes: `@dungeonmaster\/orchestrator\/startup\/start-orchestrator\.proxy`, `#gateway\/node\/fs\/file-missing-error\/file-missing-error\.stub`\. A stub of our own type parses through its contract; a stub of an outside type comes from the gateway, imported from its own file\.$/mu,
      );
    });

    it('VALID: {} => tells a proxy to compose the gateway wrapper proxy, never re-mock it', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^The proxy of a file that calls a gateway wrapper composes that wrapper's proxy, imported from the `\.proxy` file beside the wrapper\. A pass-through wrapper runs real and has no proxy\. Tests import outside packages through the gateway too\.$/mu,
      );
      expect(result).toMatch(
        /^import \{ globProxy \} from '#gateway\/npm\/glob\/glob\/glob\.proxy';$/mu,
      );
      expect(result).toMatch(
        /^A caller's proxy never `registerMock`s the wrapper's underlying outside function itself: only the wrapper's own proxy does that\.$/mu,
      );
    });

    it('VALID: {} => bans catch-all answers and names the two opt-in shapes that stay', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### No catch-all answers$/mu);
      expect(result).toMatch(
        /^No `calledWith\(\[\]\)`, and no predicate that is always true, in a proxy constructor for a function that takes arguments\. Stage each call by its arguments, so a call the proxy forgot throws\. Two opt-in shapes stay inside that rule because nothing stages them by default: a scenario method that answers any path for a virtual file tree \(`setupImplementation`\), and a wrapper proxy's lower-ranked fallback addressed by the path alone \(`returnsOnceFallback` on `readFileProxy`\)\. Every exact stage outranks both\.$/mu,
      );
    });

    it('VALID: {} => teaches the gateway stub for a gateway-branded field', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^### A contract field branded `'#Gateway<Type>'` takes the gateway's stub$/mu,
      );
      expect(result).toMatch(
        /^A stub argument for such a field takes the gateway's stub, imported from its own file\. A partial fake does not compile\.$/mu,
      );
      expect(result).toMatch(
        /^const result = UseQuestSummaryResultStub\(\{ error: ErrorStub\(\) \}\);$/mu,
      );
    });

    it('VALID: {} => builds failures from a named scenario or a recorded-failure stub', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^A failure comes from a wrapper proxy's named scenario, such as `readFileProxy\(\)\.missing\(\{ path \}\)`, or from a recorded-failure stub in the gateway, such as `FileMissingErrorStub`\. Never a hand-made `Error`: its shape is the one you imagined, not the one Node produces, and `ban-invented-failures` refuses it\.$/mu,
      );
      expect(result).toMatch(/^fileProxy\.missing\(\{ path: '\/repo\/config\.json' \}\);$/mu);
    });

    it('VALID: {} => forbids mocking another workspace package export and names its shipped proxy', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^Never `registerMock` another workspace package's export\. Compose the proxy it ships beside its API, such as `StartOrchestratorProxy`\. `ban-workspace-export-mocks` refuses the mock\.$/mu,
      );
      expect(result).toMatch(
        /^import \{ StartOrchestratorProxy \} from '@dungeonmaster\/orchestrator\/startup\/start-orchestrator\.proxy';$/mu,
      );
    });

    it('VALID: {} => states the first two home sandbox rules and that os.homedir needs no mock', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Jest Home Sandbox$/mu);
      expect(result).toMatch(
        /^1\. \*\*Do not mock `os\.homedir\(\)` for isolation\.\*\* `os\.homedir` needs no mock for isolation; it already returns the sandbox\. Mock it only to pin a value\.$/mu,
      );
      expect(result).toMatch(
        /^2\. \*\*A proxy that needs an expected path under the home calls the real `homedir\(\)`,\*\* as it calls `join`\.$/mu,
      );
    });

    it('VALID: {} => states the last three home sandbox rules', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(
        /^3\. \*\*The sandbox `HOME` is one directory for the whole run, shared by every worker\.\*\* Never assume it is empty\. Write under a directory the test owns, such as a testbed from `installTestbedCreateBroker`\.$/mu,
      );
      expect(result).toMatch(
        /^4\. \*\*To give a spawned process a different home, pass it in that spawn's options:\*\* `env: \{ \.\.\.process\.env, HOME: dir \}`\. Assigning `process\.env\.HOME` inside a test does nothing\.$/mu,
      );
      expect(result).toMatch(
        /^5\. \*\*A test that changes `DUNGEONMASTER_HOME` restores it and never deletes it\.\*\*$/mu,
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
