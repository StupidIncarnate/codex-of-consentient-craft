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

    expect(content).toMatch(/^.*toMatchObject.*$/mu);
    expect(content).toMatch(/^.*toBeDefined.*$/mu);
    expect(content).toMatch(/^.*toHaveLength.*$/mu);
  });

  it('VALID: {} => includes mocking anti-pattern violations', () => {
    formatTestingAntiPatternsSectionLayerBrokerProxy();
    const result = formatTestingAntiPatternsSectionLayerBroker();

    const content = result.join('\n');

    expect(content).toMatch(/^.*jest\.mocked.*$/mu);
    expect(content).toMatch(/^.*jest\.mock.*$/mu);
    expect(content).toMatch(/^.*jest\.clearAllMocks.*$/mu);
  });

  it('VALID: {} => includes type safety anti-pattern violations', () => {
    formatTestingAntiPatternsSectionLayerBrokerProxy();
    const result = formatTestingAntiPatternsSectionLayerBroker();

    const content = result.join('\n');

    expect(content).toMatch(/^.*\bany\b.*$/mu);
    expect(content).toMatch(/^.*@ts-ignore.*$/mu);
  });

  it('VALID: {} => includes test organization anti-pattern violations', () => {
    formatTestingAntiPatternsSectionLayerBrokerProxy();
    const result = formatTestingAntiPatternsSectionLayerBroker();

    const content = result.join('\n');

    expect(content).toMatch(/^.*jest\.spyOn.*$/mu);
    expect(content).toMatch(/^.*beforeEach.*$/mu);
  });

  it('VALID: {} => includes correct approach guidance for each category', () => {
    formatTestingAntiPatternsSectionLayerBrokerProxy();
    const result = formatTestingAntiPatternsSectionLayerBroker();

    const content = result.join('\n');

    expect(content).toMatch(/^.*Correct Approach.*$/mu);
    expect(content).toMatch(/^.*toStrictEqual.*$/mu);
    expect(content).toMatch(/^.*semantic methods.*$/mu);
    expect(content).toMatch(/^.*ReturnType<typeof Stub>.*$/mu);
    expect(content).toMatch(/^.*describe blocks.*$/mu);
  });
});
