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
      expect(result).toContain('Mock only at I/O boundaries');
      expect(result).toMatch(/^## Core Principles/mu);
    });

    it('VALID: {} => includes type safety section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Type Safety/mu);
      expect(result).toContain('ReturnType<typeof StubName>');
      expect(result).toContain('Test files AND proxy files CANNOT import types from contracts.');
    });

    it('VALID: {} => includes DAMP > DRY principle', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### DAMP > DRY/mu);
      expect(result).toContain('Descriptive And Meaningful');
    });

    it('VALID: {} => includes test behavior not implementation', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Test Behavior, Not Implementation/mu);
      expect(result).toContain('VALID: {price: 100, tax: 0.1} => returns 110');
    });

    it('VALID: {} => includes unit vs integration tests', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Unit Tests vs Integration Tests/mu);
      expect(result).toContain('Unit Test (mock dependencies)');
      expect(result).toContain('Integration Test (real dependencies)');
    });

    it('VALID: {} => includes 100% branch coverage', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### 100% Branch Coverage/mu);
      expect(result).toContain('manually verify test cases');
    });

    it('VALID: {} => includes test structure section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Test Structure/mu);
      expect(result).toContain('Always use describe blocks');
      expect(result).toContain('VALID:');
      expect(result).toContain('INVALID:');
    });

    it('VALID: {} => includes core assertions section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Core Assertions/mu);
      expect(result).toContain('Use toStrictEqual for all objects/arrays');
      expect(result).toContain('toMatchObject');
    });

    it('VALID: {} => includes proxy architecture section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Proxy Architecture/mu);
      expect(result).toMatch(/^### Core Rule/mu);
      expect(result).toContain('Mock only at I/O boundaries. Everything else runs REAL.');
    });

    it('VALID: {} => includes what gets mocked diagram', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### What Gets Mocked vs What Runs Real/mu);
      expect(result).toContain('Widget Test:');
      expect(result).toContain('REAL');
      expect(result).toContain('MOCKED');
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
      expect(result).toContain('Use `get-folder-detail({ folderType: "..."');
      expect(result).toContain('Empty Proxy Pattern');
      expect(result).toContain('Record<PropertyKey, never>');
    });

    it('VALID: {} => includes create-per-test pattern', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Create-Per-Test Pattern/mu);
      expect(result).toContain('Create a fresh proxy in each test');
      expect(result).toContain('Proxies set up mocks in their constructor');
    });

    it('VALID: {} => includes child proxy creation', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Child Proxy Creation/mu);
      expect(result).toContain('When to assign child proxy to variable');
    });

    it('VALID: {} => includes global function mocking', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^### Global Function Mocking/mu);
      expect(result).toContain('Date.now()');
      expect(result).toContain('crypto.randomUUID()');
    });

    it('VALID: {} => includes stub factories section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Stub Factories/mu);
      expect(result).toContain('Complete stub patterns in contracts/ folder detail');
      expect(result).toContain('Use `get-folder-detail({ folderType: "contracts"');
    });

    it('VALID: {} => includes mocking mechanics section with registerMock', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Mocking Mechanics/mu);
      expect(result).toContain('registerMock');
      expect(result).toContain('Stack-based dispatch');
      expect(result).toContain('MockHandle API');
    });

    it('VALID: {} => includes integration testing section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Integration Testing/mu);
      expect(result).toContain('Integration tests are **ONLY for startup files**');
      expect(result).toContain('.integration.test.ts');
    });

    it('VALID: {} => includes no hooks or conditionals section', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## No Hooks or Conditionals/mu);
      expect(result).toContain('beforeEach');
      expect(result).toContain('afterEach');
    });

    it('VALID: {} => includes common anti-patterns reference', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Common Anti-Patterns/mu);
      expect(result).toContain('Common testing anti-patterns are documented in syntax rules');
      expect(result).toContain('Use `get-syntax-rules()`');
    });

    it('VALID: {} => includes summary checklist', () => {
      architectureTestingPatternsBrokerProxy();

      const result: ContentText = architectureTestingPatternsBroker();

      expect(result).toMatch(/^## Summary Checklist/mu);
      expect(result).toContain('Created fresh proxy in test');
      expect(result).toContain('Used ReturnType<typeof Stub>');
    });
  });
});
