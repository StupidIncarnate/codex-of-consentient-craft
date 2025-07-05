// Configuration options for quest state builder

import { Component } from './quest-state-machine';

export interface StateOptions {
  // Error injection
  withErrors?: boolean;
  withBlockers?: boolean;
  
  // Partial completion
  partialOnly?: boolean;
  percentComplete?: number;
  
  // Custom components
  customComponents?: Array<{
    name: string;
    description: string;
    dependencies?: string[];
  }>;
  
  // Specific error scenarios
  errorType?: 'syntax' | 'type' | 'lint' | 'test' | 'build';
  errorLocation?: string;
  errorMessage?: string;
  
  // Review options
  reviewIssues?: Array<{
    severity: 'minor' | 'major' | 'critical';
    file: string;
    message: string;
  }>;
  
  // Test options
  testCoverage?: string;
  failingTests?: string[];
  
  // Time simulation
  simulatedDuration?: number; // minutes
  
  // Agent-specific options
  agentOptions?: {
    verbose?: boolean;
    skipValidation?: boolean;
  };
}

export interface PreparedEnvironment {
  questId: string;
  questPath: string;
  trackerPath: string;
  files: string[];
  currentPhase: string;
  expectedNextAction: string;
  readyComponents?: Component[];
  blockers?: string[];
}

export interface FileContent {
  path: string;
  content: string;
  type: 'implementation' | 'test' | 'config' | 'documentation';
}

export interface ProjectTemplate {
  type: 'simple' | 'typescript' | 'monorepo';
  fileExtension: '.ts';  // Always TypeScript
  structure: {
    src: boolean;
    tests: boolean;
    packages?: string[]; // For monorepo
  };
  configs: {
    typescript: boolean;
    eslint: boolean;
    jest: boolean;
    prettier?: boolean;
  };
  scripts: Record<string, string>;
}

// Default component templates based on quest type
export const ComponentTemplates = {
  math: [
    { name: 'add', description: 'function that adds two numbers' },
    { name: 'subtract', description: 'function that subtracts two numbers' },
    { name: 'multiply', description: 'function that multiplies two numbers' },
    { name: 'divide', description: 'function that divides two numbers' }
  ],
  
  api: [
    { name: 'config', description: 'configuration module' },
    { name: 'logger', description: 'logging utility', dependencies: ['config'] },
    { name: 'database', description: 'database connection', dependencies: ['config'] },
    { name: 'userService', description: 'user management service', dependencies: ['database', 'logger'] }
  ],
  
  utils: [
    { name: 'validators', description: 'input validation functions' },
    { name: 'formatters', description: 'data formatting utilities' },
    { name: 'helpers', description: 'general helper functions' }
  ],
  
  simple: [
    { name: 'isEven', description: 'returns true if number is even' },
    { name: 'isOdd', description: 'returns true if number is odd' }
  ]
};

// Agent report templates
export const AgentReportTemplates = {

  pathseeker: (questTitle: string, components: any[], status: string = 'SUCCESS') => [
    '=== PATHSEEKER REPORT ===',
    `Status: ${status}`,
    `Quest: ${questTitle}`,
    `Timestamp: ${new Date().toISOString()}`,
    '',
    'Quest Details:',
    `- Title: ${questTitle}`,
    '- Description: Generated test quest',
    '- Complexity: medium',
    '- Tags: [test, automated]',
    '',
    'Discovery Findings:',
    '{',
    '  "requestType": "feature",',
    '  "codebaseContext": "TypeScript project with standard structure",',
    '  "technicalRequirements": "Node.js, TypeScript, Jest"',
    '}',
    '',
    'Components Found:',
    '[',
    ...components.map((c, i) => 
      `  {` +
      `    "name": "${c.name}",` +
      `    "description": "${c.description}",` +
      `    "files": ["src/${c.name}.ts", "tests/${c.name}.test.ts"],` +
      `    "dependencies": ${JSON.stringify(c.dependencies || [])},` +
      `    "complexity": "medium",` +
      `    "status": "queued"` +
      `  }${i < components.length - 1 ? ',' : ''}`
    ),
    ']',
    '',
    'Key Decisions Made:',
    '{',
    '  "architecture": "modular TypeScript components",',
    '  "testing": "Jest unit tests",',
    '  "build": "standard npm scripts"',
    '}',
    '',
    'Implementation Notes:',
    '- Use TypeScript for type safety',
    '- Follow existing project conventions',
    '- Include comprehensive tests',
    '',
    '=== END REPORT ==='
  ],

  codeweaver: (component: string, status: string) => [
    '=== CODEWEAVER IMPLEMENTATION REPORT ===',
    `Component: ${component}`,
    `Status: ${status}`,
    `Timestamp: ${new Date().toISOString()}`,
    '',
    'Files Created:',
    `- src/${component.split(' ')[1]}.ts`,
    `- src/${component.split(' ')[1]}.test.ts`,
    '',
    'Implementation Summary:',
    '- Methods: 1 public function implemented',
    '- Key Features: Type-safe implementation',
    '- Architecture: Functional pattern with named exports',
    '',
    'Test Coverage:',
    '- Unit Tests: 5 tests',
    '- Coverage: 100% branches',
    '- All edge cases covered',
    '',
    'Integration Points:',
    '- Exports: Named function export',
    '- Dependencies: None',
    '- Interfaces: Simple function signature',
    '',
    'Ward Status: Passing',
    '',
    'Technical Decisions:',
    '- Used TypeScript for type safety',
    '- Implemented comprehensive error handling',
    '- Added JSDoc documentation',
    '=== END REPORT ==='
  ],

  lawbringer: (issues: any[], status: string) => [
    '=== LAWBRINGER REVIEW REPORT ===',
    'Phase: Code Review',
    `Status: ${status}`,
    `Timestamp: ${new Date().toISOString()}`,
    '',
    'Review Summary:',
    `- Total Issues: ${issues.length}`,
    `- Critical: ${issues.filter(i => i.severity === 'critical').length}`,
    `- Major: ${issues.filter(i => i.severity === 'major').length}`,
    `- Minor: ${issues.filter(i => i.severity === 'minor').length}`,
    '',
    'Files Reviewed:',
    ...new Set(issues.map(i => `- ${i.file}`)),
    '',
    issues.length > 0 ? 'Issues Found:' : 'No issues found',
    ...issues.map(i => `- [${i.severity.toUpperCase()}] ${i.file}: ${i.message}`),
    '',
    'Recommendations:',
    '- Maintain consistent code style',
    '- Add more comprehensive error handling',
    '- Consider edge cases in tests',
    '=== END REPORT ==='
  ],

  siegemaster: (coverage: string, testFiles: string[]) => [
    '=== SIEGEMASTER TEST REPORT ===',
    'Phase: Integration Testing',
    'Status: Complete',
    `Timestamp: ${new Date().toISOString()}`,
    '',
    'Test Creation Summary:',
    ...testFiles.map(f => `- Created: ${f}`),
    '',
    'Test Results:',
    `- Coverage: ${coverage}`,
    '- All tests passing',
    '- No flaky tests detected',
    '',
    'Test Categories:',
    '- Unit tests: Complete',
    '- Integration tests: Complete',
    '- Edge cases: Covered',
    '',
    'Performance:',
    '- Test execution time: 2.3s',
    '- No memory leaks detected',
    '=== END REPORT ==='
  ],

  spiritmender: (blockers: any[], fixed: boolean) => [
    '=== SPIRITMENDER HEALING REPORT ===',
    'Phase: Error Resolution',
    `Status: ${fixed ? 'Resolved' : 'In Progress'}`,
    `Timestamp: ${new Date().toISOString()}`,
    '',
    'Issues Identified:',
    ...blockers.map(b => `- ${b.type}: ${b.description}`),
    '',
    fixed ? 'Resolutions Applied:' : 'Attempting Resolutions:',
    ...blockers.map(b => `- Fixed: ${b.description}`),
    '',
    'Changes Made:',
    '- Updated type definitions',
    '- Fixed import statements',
    '- Resolved linting errors',
    '',
    'Verification:',
    '- All tests passing',
    '- Build successful',
    '- No linting errors',
    '=== END REPORT ==='
  ]
};

// File content generators
export const FileGenerators = {
  implementation: (name: string, description: string, withError = false): string => {
    const functionName = name.replace(/\.(ts|js)$/, '');
    
    if (withError) {
      return `/**
 * ${description}
 */
export function ${functionName}(a: number, b: number): number {
  // Intentional error for testing
  return a + b + c; // Error: 'c' is not defined
}
`;
    }

    // Generate based on function name
    let implementation = '';
    
    switch (functionName) {
      case 'add':
        implementation = 'return a + b;';
        break;
      case 'subtract':
        implementation = 'return a - b;';
        break;
      case 'multiply':
        implementation = 'return a * b;';
        break;
      case 'divide':
        implementation = 'if (b === 0) throw new Error("Division by zero");\n  return a / b;';
        break;
      case 'isEven':
        implementation = 'return n % 2 === 0;';
        break;
      case 'isOdd':
        implementation = 'return n % 2 !== 0;';
        break;
      default:
        implementation = '// Implementation here\n  return 0;';
    }

    return `/**
 * ${description}
 */
export function ${functionName}(${functionName.startsWith('is') ? 'n: number' : 'a: number, b: number'}): ${functionName.startsWith('is') ? 'boolean' : 'number'} {
  ${implementation}
}
`;
  },

  test: (name: string, description: string): string => {
    const functionName = name.replace(/\.(ts|js)$/, '');
    const isBoolean = functionName.startsWith('is');
    
    return `import { ${functionName} } from './${functionName}';

describe('${functionName}', () => {
  test('${description}', () => {
    ${isBoolean ? 
      `expect(${functionName}(4)).toBe(true);
    expect(${functionName}(5)).toBe(false);` :
      `expect(${functionName}(2, 3)).toBe(${
        functionName === 'add' ? '5' :
        functionName === 'subtract' ? '-1' :
        functionName === 'multiply' ? '6' :
        '0.666...'
      });`
    }
  });

  test('handles zero', () => {
    ${isBoolean ?
      `expect(${functionName}(0)).toBe(true);` :
      `expect(${functionName}(0, 5)).toBe(${
        functionName === 'add' ? '5' :
        functionName === 'subtract' ? '-5' :
        functionName === 'multiply' ? '0' :
        '0'
      });`
    }
  });

  test('handles negative numbers', () => {
    ${isBoolean ?
      `expect(${functionName}(-2)).toBe(true);
    expect(${functionName}(-3)).toBe(false);` :
      `expect(${functionName}(-2, -3)).toBe(${
        functionName === 'add' ? '-5' :
        functionName === 'subtract' ? '1' :
        functionName === 'multiply' ? '6' :
        '0.666...'
      });`
    }
  });
});
`;
  },

  integration: (components: string[]): string => {
    return `import { ${components.join(', ')} } from '../src';

describe('Integration Tests', () => {
  test('all functions work together', () => {
    const a = 10;
    const b = 5;
    
    const sum = add(a, b);
    const diff = subtract(a, b);
    const product = multiply(a, b);
    const quotient = divide(a, b);
    
    expect(sum).toBe(15);
    expect(diff).toBe(5);
    expect(product).toBe(50);
    expect(quotient).toBe(2);
    
    // Combined operations
    expect(add(multiply(2, 3), divide(8, 2))).toBe(10);
  });

  test('error handling across functions', () => {
    expect(() => divide(5, 0)).toThrow('Division by zero');
  });
});
`;
  }
};