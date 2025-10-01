import type {
  MockDetection,
  MockPattern,
  MockRailsConfig,
  MockValidationResult,
  TestType,
} from './types';
import {
  analyzeMockComplexity,
  detectAsyncPatterns,
  detectTestType,
  extractMockPatterns,
} from './detector';
import { findBestAlternative, validatePatternIds } from './registry';

/**
 * Validate mock usage against configuration rules
 */
export function validateMockBoundaries({
  filePath,
  content,
  config,
}: {
  filePath: string;
  content: string;
  config: MockRailsConfig;
}): MockValidationResult {
  if (!config.enabled) {
    return {
      blocked: false,
      message: 'Mock boundary validation is disabled',
      detectedMocks: [],
      violations: [],
      alternatives: [],
    };
  }

  const testType = detectTestType(filePath);
  const allowedPatterns = config.rules[testType];
  const detectedMocks = extractMockPatterns(content);

  // Validate allowed pattern IDs are valid
  const { invalid: invalidPatternIds } = validatePatternIds(allowedPatterns);
  if (invalidPatternIds.length > 0) {
    return {
      blocked: true,
      message: `Configuration error: Invalid pattern IDs: ${invalidPatternIds.join(', ')}`,
      detectedMocks,
      violations: [],
      alternatives: [],
    };
  }

  const violations: MockDetection[] = [];
  const alternatives: { violation: MockDetection; suggested: MockPattern }[] = [];

  // Check each detected mock against allowed patterns
  for (const detection of detectedMocks) {
    if (!allowedPatterns.includes(detection.pattern.id)) {
      violations.push(detection);

      // Find alternative if requested
      if (config.education.showAlternatives) {
        const alternative = findBestAlternative(detection.pattern, allowedPatterns);
        if (alternative) {
          alternatives.push({
            violation: detection,
            suggested: alternative,
          });
        }
      }
    }
  }

  const blocked = violations.length > 0;
  const message = blocked
    ? formatViolationMessage({ violations, alternatives, testType, config })
    : 'All mock patterns are within configured boundaries';

  return {
    blocked,
    message,
    detectedMocks,
    violations,
    alternatives,
  };
}

/**
 * Format educational violation message
 */
function formatViolationMessage({
  violations,
  alternatives,
  testType,
  config,
}: {
  violations: MockDetection[];
  alternatives: { violation: MockDetection; suggested: MockPattern }[];
  testType: TestType;
  config: MockRailsConfig;
}): string {
  if (config.education.level === 'quiet') {
    const violationIds = violations.map((v) => v.pattern.id).join(', ');
    return `Mock boundary violation: Patterns not allowed for ${testType} tests: ${violationIds}`;
  }

  let message = '❌ Mock Boundary Violation\n\n';

  // Group violations by pattern for cleaner output
  const violationGroups = violations.reduce<Record<string, MockDetection[]>>(
    (groups, violation) => {
      const key = violation.pattern.id;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(violation);
      return groups;
    },
    {},
  );

  for (const [patternId, detections] of Object.entries(violationGroups)) {
    const firstDetection = detections[0];
    if (!firstDetection) {
      continue;
    }

    const { pattern } = firstDetection;
    const lines = detections.map((d) => d.line).join(', ');

    message += `Pattern: ${patternId}\n`;
    message += `Lines: ${lines}\n`;
    message += `Test Type: ${testType}\n`;
    message += `Risk Level: ${pattern.risk.toUpperCase()}\n\n`;

    if (config.education.level === 'verbose') {
      message += `Why this matters:\n${pattern.education.why}\n\n`;
      message += `False Positive Risk:\n${pattern.education.falsePositiveRisk}\n\n`;
    }

    // Show alternative if available
    const alternativeInfo = alternatives.find((alt) => alt.violation.pattern.id === patternId);
    if (alternativeInfo) {
      const alt = alternativeInfo.suggested;
      message += `✅ Recommended Alternative: ${alt.id}\n`;

      if (config.education.level === 'verbose') {
        message += `When appropriate: ${alt.education.whenAppropriate}\n\n`;

        if (config.education.showExamples && alt.implementation.code) {
          message += `Example Implementation:\n`;
          if (alt.implementation.imports.length > 0) {
            message += `${alt.implementation.imports.join('\n')}\n\n`;
          }
          message += `${alt.implementation.code}\n\n`;

          if (alt.implementation.setup) {
            message += `Setup:\n${alt.implementation.setup}\n\n`;
          }
        }
      }
    } else {
      message += `🚫 No suitable alternative found for ${testType} tests\n`;
      message += `Consider refactoring to test through system boundaries only\n\n`;
    }

    message += `${'─'.repeat(50)}\n\n`;
  }

  // Add general guidance based on education level
  if (config.education.level === 'verbose') {
    message += `📚 Testing Philosophy:\n`;
    message += `• Unit tests: Mock only at system boundaries (child_process, fs, network)\n`;
    message += `• Integration tests: Use test fixtures and controlled environments\n`;
    message += `• E2E tests: Test against real systems with test data\n\n`;

    message += `Learn more: https://docs.questmaestro.com/testing/mock-boundaries\n`;
  }

  return message;
}

/**
 * Analyze and suggest improvements for test file
 */
export function analyzeTestFile({
  filePath,
  content,
  config,
}: {
  filePath: string;
  content: string;
  config: MockRailsConfig;
}): {
  testType: TestType;
  mockComplexity: ReturnType<typeof analyzeMockComplexity>;
  asyncPatterns: ReturnType<typeof detectAsyncPatterns>;
  suggestions: string[];
  score: {
    overall: number; // 0-100
    breakdown: {
      mockBoundaries: number;
      complexity: number;
      asyncHandling: number;
    };
  };
} {
  const testType = detectTestType(filePath);
  const mockComplexity = analyzeMockComplexity(content);
  const asyncPatterns = detectAsyncPatterns(content);
  const validation = validateMockBoundaries({ filePath, content, config });

  const suggestions: string[] = [...mockComplexity.suggestions, ...asyncPatterns.suggestions];

  // Calculate scores
  const mockBoundariesScore =
    validation.violations.length === 0 ? 100 : Math.max(0, 100 - validation.violations.length * 20);

  const complexityScore =
    mockComplexity.complexity === 'low' ? 100 : mockComplexity.complexity === 'medium' ? 70 : 40;

  const asyncScore = !asyncPatterns.hasAsyncTests ? 100 : asyncPatterns.hasPromiseMocks ? 100 : 60;

  const overall = Math.round((mockBoundariesScore + complexityScore + asyncScore) / 3);

  // Add specific suggestions based on violations
  if (validation.violations.length > 0) {
    const appCodeViolations = validation.violations.filter(
      (v) => v.pattern.category === 'application-code',
    );

    if (appCodeViolations.length > 0) {
      suggestions.push('Stop mocking application code - test through the real modules');
    }

    const extremeRiskViolations = validation.violations.filter((v) => v.pattern.risk === 'extreme');

    if (extremeRiskViolations.length > 0) {
      suggestions.push('Replace extreme-risk mocks that hide integration issues');
    }
  }

  if (mockComplexity.fullModuleMocks > 3) {
    suggestions.push(
      `Consider integration testing approach - ${mockComplexity.fullModuleMocks} full mocks suggest over-mocking`,
    );
  }

  return {
    testType,
    mockComplexity,
    asyncPatterns,
    suggestions: [...new Set(suggestions)], // Remove duplicates
    score: {
      overall,
      breakdown: {
        mockBoundaries: mockBoundariesScore,
        complexity: complexityScore,
        asyncHandling: asyncScore,
      },
    },
  };
}

/**
 * Generate educational report for a test file
 */
export function generateEducationalReport({
  filePath,
  content,
  config,
}: {
  filePath: string;
  content: string;
  config: MockRailsConfig;
}): string {
  const analysis = analyzeTestFile({ filePath, content, config });
  const validation = validateMockBoundaries({ filePath, content, config });

  let report = `📊 Test Analysis Report\n`;
  report += `File: ${filePath}\n`;
  report += `Test Type: ${analysis.testType}\n`;
  report += `Overall Score: ${analysis.score.overall}/100\n\n`;

  // Score breakdown
  report += `Score Breakdown:\n`;
  report += `• Mock Boundaries: ${analysis.score.breakdown.mockBoundaries}/100\n`;
  report += `• Complexity: ${analysis.score.breakdown.complexity}/100\n`;
  report += `• Async Handling: ${analysis.score.breakdown.asyncHandling}/100\n\n`;

  // Mock analysis
  report += `Mock Analysis:\n`;
  report += `• Full Module Mocks: ${analysis.mockComplexity.fullModuleMocks}\n`;
  report += `• Simple Object Mocks: ${analysis.mockComplexity.simpleObjectMocks}\n`;
  report += `• EventEmitter Mocks: ${analysis.mockComplexity.eventEmitterMocks}\n`;
  report += `• Complexity: ${analysis.mockComplexity.complexity}\n\n`;

  // Violations
  if (validation.violations.length > 0) {
    report += `❌ Violations (${validation.violations.length}):\n`;
    for (const violation of validation.violations) {
      report += `• Line ${violation.line}: ${violation.pattern.id} (${violation.pattern.risk} risk)\n`;
    }
    report += '\n';
  }

  // Suggestions
  if (analysis.suggestions.length > 0) {
    report += `💡 Suggestions:\n`;
    for (const suggestion of analysis.suggestions) {
      report += `• ${suggestion}\n`;
    }
    report += '\n';
  }

  // Best practices reminder
  report += `📚 Best Practices:\n`;
  report += `• Mock only at system boundaries (child_process, fs, network)\n`;
  report += `• Use realistic mocks (EventEmitters, streams) not simple objects\n`;
  report += `• Prefer integration tests with controlled environments\n`;
  report += `• Test behavior, not implementation details\n`;

  return report;
}
