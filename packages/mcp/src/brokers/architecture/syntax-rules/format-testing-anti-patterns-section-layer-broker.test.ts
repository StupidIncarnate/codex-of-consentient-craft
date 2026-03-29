import { formatTestingAntiPatternsSectionLayerBroker } from './format-testing-anti-patterns-section-layer-broker';
import { formatTestingAntiPatternsSectionLayerBrokerProxy } from './format-testing-anti-patterns-section-layer-broker.proxy';

describe('formatTestingAntiPatternsSectionLayerBroker', () => {
  it('VALID: {} => returns testing anti-patterns section with header', () => {
    formatTestingAntiPatternsSectionLayerBrokerProxy();
    const result = formatTestingAntiPatternsSectionLayerBroker();

    expect(result[0]).toBe('## Testing Anti-Patterns');
  });

  it('VALID: {} => includes all four category headers', () => {
    formatTestingAntiPatternsSectionLayerBrokerProxy();
    const result = formatTestingAntiPatternsSectionLayerBroker();

    const content = result.join('\n');

    expect(content).toMatch(/^### Assertion Anti-Patterns/mu);
    expect(content).toMatch(/^### Mock\/Proxy Anti-Patterns/mu);
    expect(content).toMatch(/^### Type Safety Anti-Patterns/mu);
    expect(content).toMatch(/^### Test Organization Anti-Patterns/mu);
  });

  it('VALID: {} => includes assertion anti-pattern violations', () => {
    formatTestingAntiPatternsSectionLayerBrokerProxy();
    const result = formatTestingAntiPatternsSectionLayerBroker();

    const content = result.join('\n');

    expect(content).toContain('toMatchObject');
    expect(content).toContain('toBeDefined');
    expect(content).toContain('toHaveLength');
  });

  it('VALID: {} => includes mocking anti-pattern violations', () => {
    formatTestingAntiPatternsSectionLayerBrokerProxy();
    const result = formatTestingAntiPatternsSectionLayerBroker();

    const content = result.join('\n');

    expect(content).toContain('jest.mocked');
    expect(content).toContain('jest.mock');
    expect(content).toContain('jest.clearAllMocks');
  });

  it('VALID: {} => includes type safety anti-pattern violations', () => {
    formatTestingAntiPatternsSectionLayerBrokerProxy();
    const result = formatTestingAntiPatternsSectionLayerBroker();

    const content = result.join('\n');

    expect(content).toContain('any');
    expect(content).toContain('@ts-ignore');
  });

  it('VALID: {} => includes test organization anti-pattern violations', () => {
    formatTestingAntiPatternsSectionLayerBrokerProxy();
    const result = formatTestingAntiPatternsSectionLayerBroker();

    const content = result.join('\n');

    expect(content).toContain('jest.spyOn');
    expect(content).toContain('beforeEach');
  });

  it('VALID: {} => includes correct approach guidance for each category', () => {
    formatTestingAntiPatternsSectionLayerBrokerProxy();
    const result = formatTestingAntiPatternsSectionLayerBroker();

    const content = result.join('\n');

    expect(content).toContain('Correct Approach');
    expect(content).toContain('toStrictEqual');
    expect(content).toContain('semantic methods');
    expect(content).toContain('ReturnType<typeof Stub>');
    expect(content).toContain('describe blocks');
  });
});
