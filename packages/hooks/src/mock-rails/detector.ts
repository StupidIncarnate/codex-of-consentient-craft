import type { MockDetection, TestType } from './types';
import { findMatchingPatterns } from './registry';

/**
 * Detect test type from file path
 */
export function detectTestType(filePath: string): TestType {
  if (/\.e2e\.test\.ts$/.test(filePath)) {
    return 'e2e';
  }

  if (/\.integration\.test\.ts$/.test(filePath)) {
    return 'integration';
  }

  if (/\.test\.ts$/.test(filePath)) {
    return 'unit';
  }

  // Default to unit if we can't determine
  return 'unit';
}

/**
 * Extract mock patterns from code content
 */
export function extractMockPatterns(content: string): MockDetection[] {
  const detections: MockDetection[] = [];

  for (const pattern of findMatchingPatterns(content)) {
    const matches = content.matchAll(new RegExp(pattern.pattern.source, 'g'));

    for (const match of matches) {
      if (match.index !== undefined) {
        // Find the line number containing this match
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        const lineStart = beforeMatch.lastIndexOf('\n') + 1;
        const column = match.index - lineStart + 1;

        detections.push({
          pattern,
          line: lineNumber,
          column,
          matchedCode: match[0],
        });
      }
    }
  }

  return detections;
}

/**
 * Find all jest.mock() calls in code
 */
export function findJestMocks(content: string): Array<{
  line: number;
  column: number;
  module: string;
  mockType: 'full' | 'partial';
  matchedCode: string;
}> {
  const mocks: Array<{
    line: number;
    column: number;
    module: string;
    mockType: 'full' | 'partial';
    matchedCode: string;
  }> = [];

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const jestMockMatch = line.match(/jest\.mock\(['"]([^'"]+)['"]\)/);

    if (jestMockMatch) {
      const column = line.indexOf('jest.mock') + 1;
      const module = jestMockMatch[1];
      if (!module) continue;
      const mockType = 'full'; // jest.mock() is always a full mock

      mocks.push({
        line: i + 1,
        column,
        module,
        mockType,
        matchedCode: jestMockMatch[0],
      });
    }
  }

  return mocks;
}

/**
 * Find all jest.spyOn() calls in code
 */
export function findJestSpies(content: string): Array<{
  line: number;
  column: number;
  target: string;
  method: string;
  matchedCode: string;
}> {
  const spies: Array<{
    line: number;
    column: number;
    target: string;
    method: string;
    matchedCode: string;
  }> = [];

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Match patterns like jest.spyOn(target, 'method') or jest.spyOn(module.object, 'method')
    const spyMatch = line.match(/jest\.spyOn\(\s*([^,]+)\s*,\s*['"]([^'"]+)['"]\s*\)/);

    if (spyMatch) {
      const column = line.indexOf('jest.spyOn') + 1;
      const target = spyMatch[1]?.trim();
      const method = spyMatch[2];
      const matchedCode = spyMatch[0];

      if (!target || !method || !matchedCode) continue;

      spies.push({
        line: i + 1,
        column,
        target,
        method,
        matchedCode,
      });
    }
  }

  return spies;
}

/**
 * Detect if code is mocking application code (relative imports)
 */
export function detectApplicationCodeMocks(content: string): MockDetection[] {
  const applicationMocks: MockDetection[] = [];
  const patterns = findMatchingPatterns(content);

  // Find patterns specifically for application code
  const appCodePatterns = patterns.filter((pattern) => pattern.category === 'application-code');

  for (const pattern of appCodePatterns) {
    const matches = content.matchAll(new RegExp(pattern.pattern.source, 'g'));

    for (const match of matches) {
      if (match.index !== undefined) {
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        const lineStart = beforeMatch.lastIndexOf('\n') + 1;
        const column = match.index - lineStart + 1;

        applicationMocks.push({
          pattern,
          line: lineNumber,
          column,
          matchedCode: match[0],
        });
      }
    }
  }

  return applicationMocks;
}

/**
 * Analyze mock complexity and suggest improvements
 */
export function analyzeMockComplexity(content: string): {
  simpleObjectMocks: number;
  eventEmitterMocks: number;
  fullModuleMocks: number;
  complexity: 'low' | 'medium' | 'high';
  suggestions: string[];
} {
  const fullModuleMocks = (content.match(/jest\.mock\(['"][^'"]+['"]\)/g) || []).length;
  const simpleObjectMocks = (content.match(/mockReturnValue\s*\(\s*\{[^}]*\}\s*\)/g) || []).length;
  const eventEmitterMocks = (content.match(/EventEmitter|PassThrough|Readable|Writable/g) || [])
    .length;

  const suggestions: string[] = [];
  let complexity: 'low' | 'medium' | 'high' = 'low';

  if (fullModuleMocks > 5) {
    complexity = 'high';
    suggestions.push('Consider reducing full module mocks - they hide integration issues');
  } else if (fullModuleMocks > 2) {
    complexity = 'medium';
    suggestions.push('Review full module mocks for necessity');
  }

  if (simpleObjectMocks > eventEmitterMocks && simpleObjectMocks > 3) {
    suggestions.push('Consider using EventEmitter-based mocks for more realistic behavior');
  }

  if (fullModuleMocks + simpleObjectMocks > 10) {
    complexity = 'high';
    suggestions.push(
      'High mock count suggests this might benefit from integration testing approach',
    );
  }

  return {
    simpleObjectMocks,
    eventEmitterMocks,
    fullModuleMocks,
    complexity,
    suggestions,
  };
}

/**
 * Check if content contains async testing patterns
 */
export function detectAsyncPatterns(content: string): {
  hasAsyncTests: boolean;
  hasPromiseMocks: boolean;
  hasTimeoutMocks: boolean;
  suggestions: string[];
} {
  const hasAsyncTests = /await|\.resolves\.|\.rejects\./.test(content);
  const hasPromiseMocks = /mockResolvedValue|mockRejectedValue/.test(content);
  const hasTimeoutMocks = /setTimeout|setInterval|jest\.useFakeTimers/.test(content);

  const suggestions: string[] = [];

  if (hasAsyncTests && !hasPromiseMocks) {
    suggestions.push('Consider using mockResolvedValue/mockRejectedValue for async mocks');
  }

  if (hasTimeoutMocks && !content.includes('jest.runAllTimers')) {
    suggestions.push('Remember to advance timers in tests using jest.runAllTimers()');
  }

  return {
    hasAsyncTests,
    hasPromiseMocks,
    hasTimeoutMocks,
    suggestions,
  };
}

/**
 * Extract import statements to understand dependencies
 */
export function extractImports(content: string): Array<{
  line: number;
  module: string;
  type: 'named' | 'default' | 'namespace';
  imports: string[];
}> {
  const imports: Array<{
    line: number;
    module: string;
    type: 'named' | 'default' | 'namespace';
    imports: string[];
  }> = [];

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Named imports: import { a, b } from 'module'
    const namedMatch = line.match(/import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/);
    if (namedMatch) {
      const importNamesStr = namedMatch[1];
      const module = namedMatch[2];
      if (!importNamesStr || !module) continue;

      const importNames = importNamesStr.split(',').map((name) => name.trim());
      imports.push({
        line: i + 1,
        module,
        type: 'named',
        imports: importNames,
      });
      continue;
    }

    // Default import: import name from 'module'
    const defaultMatch = line.match(/import\s+([^{][^\s]+)\s+from\s+['"]([^'"]+)['"]/);
    if (defaultMatch) {
      const importName = defaultMatch[1];
      const module = defaultMatch[2];
      if (!importName || !module) continue;

      imports.push({
        line: i + 1,
        module,
        type: 'default',
        imports: [importName],
      });
      continue;
    }

    // Namespace import: import * as name from 'module'
    const namespaceMatch = line.match(/import\s+\*\s+as\s+([^\s]+)\s+from\s+['"]([^'"]+)['"]/);
    if (namespaceMatch) {
      const namespaceName = namespaceMatch[1];
      const module = namespaceMatch[2];
      if (!namespaceName || !module) continue;

      imports.push({
        line: i + 1,
        module,
        type: 'namespace',
        imports: [namespaceName],
      });
    }
  }

  return imports;
}
