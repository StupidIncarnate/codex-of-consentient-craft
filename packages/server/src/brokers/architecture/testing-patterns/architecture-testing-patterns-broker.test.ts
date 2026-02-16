import { architectureTestingPatternsBroker } from './architecture-testing-patterns-broker';
import { architectureTestingPatternsBrokerProxy } from './architecture-testing-patterns-broker.proxy';
import type { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

type ContentText = ReturnType<typeof ContentTextStub>;

describe('architectureTestingPatternsBroker', () => {
  describe('generate testing patterns documentation', () => {
    it('VALID: {} => returns markdown with testing philosophy', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(typeof result).toBe('string');
      expect(result).toMatch(/# Testing Patterns & Philosophy/u);
      expect(result).toMatch(/Mock only at I\/O boundaries/u);
      expect(result).toMatch(/## Core Principles/u);
    });

    it('VALID: {} => includes type safety section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/### Type Safety/u);
      expect(result).toMatch(/ReturnType<typeof StubName>/u);
      expect(result).toMatch(/Test files AND proxy files CANNOT import types from contracts\./u);
    });

    it('VALID: {} => includes DAMP > DRY principle', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/### DAMP > DRY/u);
      expect(result).toMatch(/Descriptive And Meaningful/u);
    });

    it('VALID: {} => includes test behavior not implementation', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/### Test Behavior, Not Implementation/u);
      expect(result).toMatch(/VALID: \{price: 100, tax: 0\.1\} => returns 110/u);
    });

    it('VALID: {} => includes unit vs integration tests', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/### Unit Tests vs Integration Tests/u);
      expect(result).toMatch(/Unit Test \(mock dependencies\)/u);
      expect(result).toMatch(/Integration Test \(real dependencies\)/u);
    });

    it('VALID: {} => includes 100% branch coverage', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/### 100% Branch Coverage/u);
      expect(result).toMatch(/manually verify test cases/u);
    });

    it('VALID: {} => includes test structure section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/## Test Structure/u);
      expect(result).toMatch(/Always use describe blocks/u);
      expect(result).toMatch(/VALID:/u);
      expect(result).toMatch(/INVALID_/u);
    });

    it('VALID: {} => includes core assertions section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/## Core Assertions/u);
      expect(result).toMatch(/Use toStrictEqual for all objects\/arrays/u);
      expect(result).toMatch(/toMatchObject/u);
    });

    it('VALID: {} => includes proxy architecture section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/## Proxy Architecture/u);
      expect(result).toMatch(/### Core Rule/u);
      expect(result).toMatch(/Mock only at I\/O boundaries\. Everything else runs REAL\./u);
    });

    it('VALID: {} => includes what gets mocked diagram', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/### What Gets Mocked vs What Runs Real/u);
      expect(result).toMatch(/Widget Test:/u);
      expect(result).toMatch(/REAL/u);
      expect(result).toMatch(/MOCKED/u);
    });

    it('VALID: {} => includes quick reference table', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/### Quick Reference: What Needs Proxies\?/u);
      expect(result).toMatch(/\| Contracts/u);
      expect(result).toMatch(/\| Adapters/u);
      expect(result).toMatch(/\| Brokers/u);
    });

    it('VALID: {} => includes detailed proxy patterns reference', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/### Detailed Proxy Patterns/u);
      expect(result).toMatch(/Use `get-folder-detail\(\{ folderType: "\.\.\."/u);
      expect(result).toMatch(/Empty Proxy Pattern/u);
      expect(result).toMatch(/Record<PropertyKey, never>/u);
    });

    it('VALID: {} => includes create-per-test pattern', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/### Create-Per-Test Pattern/u);
      expect(result).toMatch(/Create a fresh proxy in each test/u);
      expect(result).toMatch(/Proxies set up mocks in their constructor/u);
    });

    it('VALID: {} => includes child proxy creation', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/### Child Proxy Creation/u);
      expect(result).toMatch(/When to assign child proxy to variable/u);
    });

    it('VALID: {} => includes global function mocking', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/### Global Function Mocking/u);
      expect(result).toMatch(/Date\.now\(\)/u);
      expect(result).toMatch(/crypto\.randomUUID\(\)/u);
    });

    it('VALID: {} => includes stub factories section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/## Stub Factories/u);
      expect(result).toMatch(/Complete stub patterns in contracts\/ folder detail/u);
      expect(result).toMatch(/Use `get-folder-detail\(\{ folderType: "contracts"/u);
    });

    it('VALID: {} => includes mocking mechanics section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/## Mocking Mechanics/u);
      expect(result).toMatch(/jest\.mock\(\) \+ jest\.mocked\(\)/u);
      expect(result).toMatch(/jest\.spyOn\(\)/u);
    });

    it('VALID: {} => includes integration testing section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/## Integration Testing/u);
      expect(result).toMatch(/Integration tests are \*\*ONLY for startup files\*\*/u);
      expect(result).toMatch(/\.integration\.test\.ts/u);
    });

    it('VALID: {} => includes no hooks or conditionals section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/## No Hooks or Conditionals/u);
      expect(result).toMatch(/beforeEach/u);
      expect(result).toMatch(/afterEach/u);
    });

    it('VALID: {} => includes common anti-patterns reference', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/## Common Anti-Patterns/u);
      expect(result).toMatch(/Common testing anti-patterns are documented in syntax rules/u);
      expect(result).toMatch(/Use `get-syntax-rules\(\)`/u);
    });

    it('VALID: {} => includes summary checklist', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/## Summary Checklist/u);
      expect(result).toMatch(/Created fresh proxy in test/u);
      expect(result).toMatch(/Used ReturnType<typeof Stub>/u);
    });
  });
});
