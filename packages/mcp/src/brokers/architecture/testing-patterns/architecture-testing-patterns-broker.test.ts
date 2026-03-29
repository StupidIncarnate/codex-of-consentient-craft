import { architectureTestingPatternsBroker } from './architecture-testing-patterns-broker';
import { architectureTestingPatternsBrokerProxy } from './architecture-testing-patterns-broker.proxy';
import type { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

type ContentText = ReturnType<typeof ContentTextStub>;

describe('architectureTestingPatternsBroker', () => {
  describe('generate testing patterns documentation', () => {
    it('VALID: {} => returns markdown with testing philosophy', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^# Testing Patterns & Philosophy/mu);
      expect(result).toMatch(/^.*Mock only at I\/O boundaries.*$/mu);
      expect(result).toMatch(/^## Core Principles/mu);
    });

    it('VALID: {} => includes type safety section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Type Safety/mu);
      expect(result).toMatch(/^.*ReturnType<typeof StubName>.*$/mu);
      expect(result).toMatch(
        /^.*Test files AND proxy files CANNOT import types from contracts\./mu,
      );
    });

    it('VALID: {} => includes DAMP > DRY principle', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### DAMP > DRY/mu);
      expect(result).toMatch(/^.*Descriptive And Meaningful.*$/mu);
    });

    it('VALID: {} => includes test behavior not implementation', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Test Behavior, Not Implementation/mu);
      expect(result).toMatch(/^.*VALID: \{price: 100, tax: 0\.1\} => returns 110.*$/mu);
    });

    it('VALID: {} => includes unit vs integration tests', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Unit Tests vs Integration Tests/mu);
      expect(result).toMatch(/^.*Unit Test \(mock dependencies\).*$/mu);
      expect(result).toMatch(/^.*Integration Test \(real dependencies\).*$/mu);
    });

    it('VALID: {} => includes 100% branch coverage', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### 100% Branch Coverage/mu);
      expect(result).toMatch(/^.*manually verify test cases.*$/mu);
    });

    it('VALID: {} => includes test structure section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Test Structure/mu);
      expect(result).toMatch(/^.*Always use describe blocks.*$/mu);
      expect(result).toMatch(/^.*VALID:.*$/mu);
      expect(result).toMatch(/^.*INVALID_.*$/mu);
    });

    it('VALID: {} => includes core assertions section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Core Assertions/mu);
      expect(result).toMatch(/^.*Use toStrictEqual for all objects\/arrays.*$/mu);
      expect(result).toMatch(/^.*toMatchObject.*$/mu);
    });

    it('VALID: {} => includes proxy architecture section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Proxy Architecture/mu);
      expect(result).toMatch(/^### Core Rule/mu);
      expect(result).toMatch(/^.*Mock only at I\/O boundaries\. Everything else runs REAL\..*$/mu);
    });

    it('VALID: {} => includes what gets mocked diagram', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### What Gets Mocked vs What Runs Real/mu);
      expect(result).toMatch(/^.*Widget Test:.*$/mu);
      expect(result).toMatch(/^.*REAL.*$/mu);
      expect(result).toMatch(/^.*MOCKED.*$/mu);
    });

    it('VALID: {} => includes quick reference table', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Quick Reference: What Needs Proxies\?/mu);
      expect(result).toMatch(/^\| Contracts/mu);
      expect(result).toMatch(/^\| Adapters/mu);
      expect(result).toMatch(/^\| Brokers/mu);
    });

    it('VALID: {} => includes detailed proxy patterns reference', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Detailed Proxy Patterns/mu);
      expect(result).toMatch(/^.*Use `get-folder-detail\(\{ folderType: "\.\.\."/mu);
      expect(result).toMatch(/^.*Empty Proxy Pattern.*$/mu);
      expect(result).toMatch(/^.*Record<PropertyKey, never>.*$/mu);
    });

    it('VALID: {} => includes create-per-test pattern', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Create-Per-Test Pattern/mu);
      expect(result).toMatch(/^.*Create a fresh proxy in each test.*$/mu);
      expect(result).toMatch(/^.*Proxies set up mocks in their constructor.*$/mu);
    });

    it('VALID: {} => includes child proxy creation', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Child Proxy Creation/mu);
      expect(result).toMatch(/^.*When to assign child proxy to variable.*$/mu);
    });

    it('VALID: {} => includes global function mocking', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Global Function Mocking/mu);
      expect(result).toMatch(/^.*Date\.now\(\).*$/mu);
      expect(result).toMatch(/^.*crypto\.randomUUID\(\).*$/mu);
    });

    it('VALID: {} => includes stub factories section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Stub Factories/mu);
      expect(result).toMatch(/^.*Complete stub patterns in contracts\/ folder detail.*$/mu);
      expect(result).toMatch(/^.*Use `get-folder-detail\(\{ folderType: "contracts".*$/mu);
    });

    it('VALID: {} => includes mocking mechanics section with registerMock', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Mocking Mechanics/mu);
      expect(result).toMatch(/^.*registerMock.*$/mu);
      expect(result).toMatch(/^.*Stack-based dispatch.*$/mu);
      expect(result).toMatch(/^.*MockHandle API.*$/mu);
    });

    it('VALID: {} => includes integration testing section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Integration Testing/mu);
      expect(result).toMatch(/^.*Integration tests are \*\*ONLY for startup files\*\*.*$/mu);
      expect(result).toMatch(/^.*\.integration\.test\.ts.*$/mu);
    });

    it('VALID: {} => includes no hooks or conditionals section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## No Hooks or Conditionals/mu);
      expect(result).toMatch(/^.*beforeEach.*$/mu);
      expect(result).toMatch(/^.*afterEach.*$/mu);
    });

    it('VALID: {} => includes common anti-patterns reference', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Common Anti-Patterns/mu);
      expect(result).toMatch(/^.*Common testing anti-patterns are documented in syntax rules.*$/mu);
      expect(result).toMatch(/^.*Use `get-syntax-rules\(\)`.*$/mu);
    });

    it('VALID: {} => includes summary checklist', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Summary Checklist/mu);
      expect(result).toMatch(/^.*Created fresh proxy in test.*$/mu);
      expect(result).toMatch(/^.*Used ReturnType<typeof Stub>.*$/mu);
    });
  });
});
