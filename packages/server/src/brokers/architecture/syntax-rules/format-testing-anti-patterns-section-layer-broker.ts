/**
 * PURPOSE: Formats the testing anti-patterns section of the universal syntax rules markdown
 *
 * USAGE:
 * const lines = formatTestingAntiPatternsSectionLayerBroker();
 * // Returns array of markdown lines for testing anti-patterns rules
 */
import type { MarkdownSectionLines } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { markdownSectionLinesContract } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { universalSyntaxRulesStatics } from '../../../statics/universal-syntax-rules/universal-syntax-rules-statics';

export const formatTestingAntiPatternsSectionLayerBroker = (): MarkdownSectionLines => {
  const { testing } = universalSyntaxRulesStatics;
  const { antiPatterns } = testing;

  return markdownSectionLinesContract.parse([
    '## Testing Anti-Patterns',
    '',
    '### Assertion Anti-Patterns',
    '',
    `- **Property Bleedthrough**: ${antiPatterns.assertions.propertyBleedthrough}`,
    `- **Existence-Only Checks**: ${antiPatterns.assertions.existenceOnlyChecks}`,
    `- **Count-Only Checks**: ${antiPatterns.assertions.countOnlyChecks}`,
    `- **Weak Matchers**: ${antiPatterns.assertions.weakMatchers}`,
    '',
    '**Violations:**',
    ...antiPatterns.assertions.violations.map((violation) => `- ❌ \`${violation}\``),
    '',
    `**Correct Approach**: ${antiPatterns.assertions.correctApproach}`,
    '',
    '### Mock/Proxy Anti-Patterns',
    '',
    `- **Direct Mock Manipulation**: ${antiPatterns.mockingAndProxies.directMockManipulation}`,
    `- **Mocking Application Code**: ${antiPatterns.mockingAndProxies.mockingApplicationCode}`,
    `- **Manual Mock Cleanup**: ${antiPatterns.mockingAndProxies.manualMockCleanup}`,
    `- **jest.spyOn() for Modules**: ${antiPatterns.mockingAndProxies.jestSpyOnModules}`,
    `- **Shared Proxy Instances**: ${antiPatterns.mockingAndProxies.sharedProxyInstances}`,
    '',
    '**Violations:**',
    ...antiPatterns.mockingAndProxies.violations.map((violation) => `- ❌ \`${violation}\``),
    '',
    `**Correct Approach**: ${antiPatterns.mockingAndProxies.correctApproach}`,
    '',
    '### Type Safety Anti-Patterns',
    '',
    `- **Type Escape Hatches**: ${antiPatterns.typeSafety.typeEscapeHatches}`,
    '',
    '**Violations:**',
    ...antiPatterns.typeSafety.violations.map((violation) => `- ❌ \`${violation}\``),
    '',
    `**Correct Approach**: ${antiPatterns.typeSafety.correctApproach}`,
    '',
    '### Test Organization Anti-Patterns',
    '',
    `- **Testing Implementation**: ${antiPatterns.testOrganization.testingImplementation}`,
    `- **Shared Test State**: ${antiPatterns.testOrganization.sharedTestState}`,
    `- **Unit Testing DSL Logic**: ${antiPatterns.testOrganization.unitTestingDslLogic}`,
    `- **Comment Organization**: ${antiPatterns.testOrganization.commentOrganization}`,
    '',
    '**Violations:**',
    ...antiPatterns.testOrganization.violations.map((violation) => `- ❌ \`${violation}\``),
    '',
    `**Correct Approach**: ${antiPatterns.testOrganization.correctApproach}`,
    '',
  ]);
};
