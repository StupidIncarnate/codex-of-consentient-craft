import { formatTestingAntiPatternsSectionLayerBroker } from './format-testing-anti-patterns-section-layer-broker';
import { formatTestingAntiPatternsSectionLayerBrokerProxy } from './format-testing-anti-patterns-section-layer-broker.proxy';

describe('formatTestingAntiPatternsSectionLayerBroker', () => {
  it('VALID: {} => returns testing anti-patterns section with header', () => {
    formatTestingAntiPatternsSectionLayerBrokerProxy();
    const result = formatTestingAntiPatternsSectionLayerBroker();

    expect(result[0]).toStrictEqual('## Testing Anti-Patterns');
  });

  it('VALID: {} => includes all four category headers', () => {
    formatTestingAntiPatternsSectionLayerBrokerProxy();
    const result = formatTestingAntiPatternsSectionLayerBroker();

    const content = result.join('\n');
    expect(content).toMatch(/### Assertion Anti-Patterns/u);
    expect(content).toMatch(/### Mock\/Proxy Anti-Patterns/u);
    expect(content).toMatch(/### Type Safety Anti-Patterns/u);
    expect(content).toMatch(/### Test Organization Anti-Patterns/u);
  });

  it('VALID: {} => includes assertion anti-pattern violations', () => {
    formatTestingAntiPatternsSectionLayerBrokerProxy();
    const result = formatTestingAntiPatternsSectionLayerBroker();

    const content = result.join('\n');
    expect(content).toMatch(/toMatchObject/u);
    expect(content).toMatch(/toBeDefined/u);
    expect(content).toMatch(/toHaveLength/u);
  });

  it('VALID: {} => includes mocking anti-pattern violations', () => {
    formatTestingAntiPatternsSectionLayerBrokerProxy();
    const result = formatTestingAntiPatternsSectionLayerBroker();

    const content = result.join('\n');
    expect(content).toMatch(/jest\.mocked/u);
    expect(content).toMatch(/jest\.mock/u);
    expect(content).toMatch(/jest\.clearAllMocks/u);
  });

  it('VALID: {} => includes type safety anti-pattern violations', () => {
    formatTestingAntiPatternsSectionLayerBrokerProxy();
    const result = formatTestingAntiPatternsSectionLayerBroker();

    const content = result.join('\n');
    expect(content).toMatch(/any/u);
    expect(content).toMatch(/@ts-ignore/u);
  });

  it('VALID: {} => includes test organization anti-pattern violations', () => {
    formatTestingAntiPatternsSectionLayerBrokerProxy();
    const result = formatTestingAntiPatternsSectionLayerBroker();

    const content = result.join('\n');
    expect(content).toMatch(/jest\.spyOn/u);
    expect(content).toMatch(/beforeEach/u);
  });

  it('VALID: {} => includes correct approach guidance for each category', () => {
    formatTestingAntiPatternsSectionLayerBrokerProxy();
    const result = formatTestingAntiPatternsSectionLayerBroker();

    const content = result.join('\n');
    expect(content).toMatch(/Correct Approach/u);
    expect(content).toMatch(/toStrictEqual/u);
    expect(content).toMatch(/semantic methods/u);
    expect(content).toMatch(/ReturnType<typeof Stub>/u);
    expect(content).toMatch(/describe blocks/u);
  });
});
