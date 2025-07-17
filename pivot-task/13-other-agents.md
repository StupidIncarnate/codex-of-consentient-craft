# Task 13: Other Agents Updates

## Objective
Update Siegemaster, Lawbringer, and Spiritmender agents to work with the CLI system, removing gate systems and focusing on their core purposes.

## Dependencies
- Task 10: Agent Prompts (for output format)
- Task 08: Report Parsing (for report structures)

## Implementation

### 1. Siegemaster Simplification

**File: src/cli/siegemaster/gap-analyzer.ts**
```typescript
import { SiegemasterReport } from '../report-parser';

export interface TestGap {
  file: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  suggestedTests?: string[];
}

export interface TestCoverageAnalysis {
  overall: number;
  byFile: Record<string, number>;
  gaps: TestGap[];
  existingTests: string[];
  recommendations: string[];
}

/**
 * Analyzes test coverage and identifies gaps
 */
export async function analyzeTestCoverage(
  filesCreated: string[],
  testFramework: string
): Promise<TestCoverageAnalysis> {
  const analysis: TestCoverageAnalysis = {
    overall: 0,
    byFile: {},
    gaps: [],
    existingTests: [],
    recommendations: [],
  };
  
  // Group files by test vs implementation
  const implFiles = filesCreated.filter(f => !isTestFile(f));
  const testFiles = filesCreated.filter(f => isTestFile(f));
  
  analysis.existingTests = testFiles;
  
  // Check each implementation file for corresponding tests
  for (const implFile of implFiles) {
    const expectedTestFile = getExpectedTestFile(implFile, testFramework);
    const hasTest = testFiles.some(tf => 
      tf === expectedTestFile || tf.includes(getBaseFileName(implFile))
    );
    
    if (!hasTest) {
      analysis.gaps.push({
        file: implFile,
        description: `No test file found for ${implFile}`,
        priority: 'high',
        suggestedTests: [expectedTestFile],
      });
      analysis.byFile[implFile] = 0;
    } else {
      // Estimate coverage (in real implementation, would analyze actual coverage)
      analysis.byFile[implFile] = 75; // Placeholder
    }
  }
  
  // Calculate overall coverage
  const coverageValues = Object.values(analysis.byFile);
  analysis.overall = coverageValues.length > 0
    ? Math.round(coverageValues.reduce((a, b) => a + b, 0) / coverageValues.length)
    : 0;
  
  // Generate recommendations
  if (analysis.overall < 80) {
    analysis.recommendations.push(
      'Overall test coverage is below 80%. Consider adding more tests.'
    );
  }
  
  if (analysis.gaps.length > 0) {
    analysis.recommendations.push(
      `Found ${analysis.gaps.length} files without tests. Create test files for complete coverage.`
    );
  }
  
  // Check for integration tests
  const hasIntegrationTests = testFiles.some(f => 
    f.includes('.integration.') || f.includes('.e2e.')
  );
  
  if (!hasIntegrationTests && implFiles.length > 3) {
    analysis.recommendations.push(
      'Consider adding integration tests to verify component interactions.'
    );
  }
  
  return analysis;
}

/**
 * Checks if a file is a test file
 */
function isTestFile(filename: string): boolean {
  return filename.includes('.test.') || 
         filename.includes('.spec.') ||
         filename.includes('.e2e.') ||
         filename.includes('.integration.');
}

/**
 * Gets expected test file name for an implementation file
 */
function getExpectedTestFile(implFile: string, testFramework: string): string {
  const base = implFile.replace(/\.(ts|js|tsx|jsx)$/, '');
  const ext = implFile.match(/\.(ts|js|tsx|jsx)$/)?.[0] || '.ts';
  
  switch (testFramework) {
    case 'jest':
      return `${base}.test${ext}`;
    case 'mocha':
      return `${base}.spec${ext}`;
    case 'vitest':
      return `${base}.test${ext}`;
    default:
      return `${base}.test${ext}`;
  }
}

/**
 * Gets base file name without extension
 */
function getBaseFileName(filename: string): string {
  return filename
    .split('/')
    .pop()!
    .replace(/\.(test|spec|e2e|integration)?\.(ts|js|tsx|jsx)$/, '');
}

/**
 * Formats Siegemaster instructions
 */
export function formatSiegemasterInstructions(
  questTitle: string,
  filesCreated: string[],
  testFramework: string
): string {
  return `## Quest: ${questTitle}

Analyze test coverage and identify gaps for the following files:

**Files Created**:
${filesCreated.map(f => `- ${f}`).join('\n')}

**Test Framework**: ${testFramework}

## Your Task

1. Analyze which files have tests and which don't
2. Identify specific test scenarios that are missing
3. Prioritize gaps by importance (high/medium/low)
4. Provide recommendations for improving test coverage

## Important

- Focus ONLY on identifying gaps, do not implement tests
- Consider unit tests, integration tests, and e2e tests
- Check for edge cases and error scenarios
- Verify critical business logic has tests

Do NOT:
- Write test implementations
- Modify any files
- Create new files
`;
}
```

### 2. Lawbringer Simplification

**File: src/cli/lawbringer/standards-enforcer.ts**
```typescript
import { LawbringerReport } from '../report-parser';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface StandardsViolation {
  file: string;
  line?: number;
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface StandardsReview {
  passed: boolean;
  score: number;
  violations: StandardsViolation[];
  fixes: Array<{
    file: string;
    description: string;
  }>;
  wardResults: {
    lint?: 'passed' | 'failed';
    typecheck?: 'passed' | 'failed';
    test?: 'passed' | 'failed';
    all?: 'passed' | 'failed';
  };
}

/**
 * Runs ward commands and analyzes results
 */
export async function runStandardsReview(
  changedFiles: string[],
  wardCommands: any
): Promise<StandardsReview> {
  const review: StandardsReview = {
    passed: false,
    score: 100,
    violations: [],
    fixes: [],
    wardResults: {},
  };
  
  // Run ward:all command
  if (wardCommands.all) {
    try {
      await execAsync(wardCommands.all);
      review.wardResults.all = 'passed';
    } catch (error) {
      review.wardResults.all = 'failed';
      // Parse error output for violations
      const violations = parseWardErrors(error.stderr || error.stdout);
      review.violations.push(...violations);
    }
  }
  
  // Calculate score based on violations
  const errorCount = review.violations.filter(v => v.severity === 'error').length;
  const warningCount = review.violations.filter(v => v.severity === 'warning').length;
  
  review.score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 5));
  review.passed = errorCount === 0;
  
  return review;
}

/**
 * Parses ward command errors into violations
 */
function parseWardErrors(output: string): StandardsViolation[] {
  const violations: StandardsViolation[] = [];
  const lines = output.split('\n');
  
  for (const line of lines) {
    // ESLint format: file.ts:10:5: error: Message (rule-name)
    const eslintMatch = line.match(/^(.+):(\d+):(\d+):\s*(error|warning):\s*(.+)\s*\((.+)\)$/);
    if (eslintMatch) {
      violations.push({
        file: eslintMatch[1],
        line: parseInt(eslintMatch[2]),
        severity: eslintMatch[4] as 'error' | 'warning',
        message: eslintMatch[5],
        rule: eslintMatch[6],
      });
      continue;
    }
    
    // TypeScript format: file.ts(10,5): error TS2322: Message
    const tsMatch = line.match(/^(.+)\((\d+),(\d+)\):\s*error\s*(TS\d+):\s*(.+)$/);
    if (tsMatch) {
      violations.push({
        file: tsMatch[1],
        line: parseInt(tsMatch[2]),
        severity: 'error',
        rule: tsMatch[4],
        message: tsMatch[5],
      });
      continue;
    }
    
    // Jest format: FAIL src/file.test.ts
    const jestMatch = line.match(/^\s*FAIL\s+(.+\.test\..+)$/);
    if (jestMatch) {
      violations.push({
        file: jestMatch[1],
        severity: 'error',
        rule: 'test-failure',
        message: 'Test suite failed',
      });
    }
  }
  
  return violations;
}

/**
 * Formats Lawbringer instructions
 */
export function formatLawbringerInstructions(
  questTitle: string,
  changedFiles: string[],
  wardCommands: any
): string {
  return `## Quest: ${questTitle}

Review code standards and enforce project conventions.

**Changed Files**:
${changedFiles.map(f => `- ${f}`).join('\n')}

**Ward Commands**:
- All: ${wardCommands.all || 'not configured'}
- Lint: ${wardCommands.lint || 'not configured'}
- Type Check: ${wardCommands.typecheck || 'not configured'}
- Test: ${wardCommands.test || 'not configured'}

## Your Task

1. Run ward:all command to check standards
2. Analyze any violations found
3. Fix critical issues (errors)
4. Document remaining warnings
5. Ensure CLAUDE.md standards are followed

## Standards to Check

- Code style and formatting
- TypeScript strict mode compliance
- Test coverage requirements
- Documentation standards
- Security best practices
- Performance considerations

## Important

- Fix errors but document warnings
- Don't make unnecessary changes
- Preserve code functionality
- Follow existing patterns
`;
}
```

### 3. Spiritmender Simplification

**File: src/cli/spiritmender/error-fixer.ts**
```typescript
import { SpiritmenderReport } from '../report-parser';

export interface ErrorFix {
  file: string;
  description: string;
  changes: string;
  errorType: 'lint' | 'typecheck' | 'test' | 'build';
}

export interface FixAttempt {
  errors: Array<{
    type: string;
    file: string;
    message: string;
  }>;
  fixes: ErrorFix[];
  remainingIssues: string[];
  wardResults: any;
}

/**
 * Prioritizes errors for fixing
 */
export function prioritizeErrors(errors: string): Array<{
  type: string;
  file: string;
  message: string;
  priority: number;
}> {
  const errorList = parseErrorOutput(errors);
  
  // Priority order:
  // 1. Build/compile errors (highest)
  // 2. Type errors
  // 3. Test failures
  // 4. Lint errors (lowest)
  
  return errorList.map(error => ({
    ...error,
    priority: getErrorPriority(error.type),
  })).sort((a, b) => b.priority - a.priority);
}

/**
 * Parses error output into structured format
 */
function parseErrorOutput(errors: string): Array<{
  type: string;
  file: string;
  message: string;
}> {
  const errorList: Array<{ type: string; file: string; message: string }> = [];
  const lines = errors.split('\n');
  
  let currentType = 'unknown';
  
  for (const line of lines) {
    // Detect error type sections
    if (line.includes('Lint errors:')) currentType = 'lint';
    else if (line.includes('Type errors:')) currentType = 'typecheck';
    else if (line.includes('Test failures:')) currentType = 'test';
    else if (line.includes('Build errors:')) currentType = 'build';
    
    // Parse individual errors
    const fileMatch = line.match(/^(.+\.(ts|js|tsx|jsx))[:(\d]/);
    if (fileMatch) {
      errorList.push({
        type: currentType,
        file: fileMatch[1],
        message: line,
      });
    }
  }
  
  return errorList;
}

/**
 * Gets error priority for fixing order
 */
function getErrorPriority(errorType: string): number {
  switch (errorType) {
    case 'build': return 4;
    case 'typecheck': return 3;
    case 'test': return 2;
    case 'lint': return 1;
    default: return 0;
  }
}

/**
 * Formats Spiritmender instructions
 */
export function formatSpiritmenderInstructions(
  questTitle: string,
  errors: string,
  attemptNumber: number,
  maxAttempts: number,
  previousAttempts?: any[]
): string {
  let instructions = `## Quest: ${questTitle}

Fix ward validation errors (Attempt ${attemptNumber}/${maxAttempts})

## Errors to Fix

\`\`\`
${errors}
\`\`\`

## Your Task

1. Analyze the errors in priority order
2. Fix build/compile errors first
3. Then fix type errors
4. Then fix test failures  
5. Finally fix lint errors
6. Verify fixes don't introduce new errors

## Important

- Make minimal changes to fix errors
- Don't refactor unnecessarily
- Preserve existing functionality
- Test your fixes if possible
`;

  if (previousAttempts && previousAttempts.length > 0) {
    instructions += `
## Previous Attempts

You have tried ${previousAttempts.length} time(s) before. Previous approaches:
`;
    
    for (const attempt of previousAttempts) {
      instructions += `
Attempt ${attempt.attemptNumber}:
- Fixed: ${attempt.fixes?.length || 0} issues
- Remaining: ${attempt.remainingIssues?.length || 0} issues
`;
    }
    
    instructions += `
Try a different approach this time. Consider:
- Are you fixing the root cause or just symptoms?
- Are there configuration issues?
- Do you need to update type definitions?
- Are there missing dependencies?
`;
  }
  
  return instructions;
}

/**
 * Checks if errors are fixable
 */
export function areErrorsFixable(errors: string): {
  fixable: boolean;
  reason?: string;
} {
  // Check for unfixable errors
  if (errors.includes('Cannot find module') && errors.includes('node_modules')) {
    return {
      fixable: false,
      reason: 'Missing npm dependencies - need manual npm install',
    };
  }
  
  if (errors.includes('EACCES') || errors.includes('Permission denied')) {
    return {
      fixable: false,
      reason: 'Permission errors - need manual intervention',
    };
  }
  
  if (errors.includes('JavaScript heap out of memory')) {
    return {
      fixable: false,
      reason: 'Memory issues - need environment adjustment',
    };
  }
  
  return { fixable: true };
}
```

### 4. Agent Update Summary

**File: src/cli/docs/other-agents-summary.md**
```markdown
# Other Agents Update Summary

## Siegemaster Changes

### Before
- Complex 4-gate system
- Could implement tests
- Progress tracking
- Multiple phases

### After
- Single-purpose: identify test gaps
- No implementation, only analysis
- Clear gap prioritization
- Actionable recommendations

### Key Points
- Analyzes test coverage
- Identifies missing test files
- Suggests test scenarios
- Prioritizes by importance

## Lawbringer Changes

### Before
- Multiple review categories
- Complex scoring system
- Manual standard checks

### After
- Runs ward:all automatically
- Fixes errors found
- Documents warnings
- Simple pass/fail

### Key Points
- Executes ward validation
- Parses error output
- Fixes what it can
- Reports what it can't

## Spiritmender Changes

### Before
- 4-gate system
- Complex error categorization
- Progress tracking

### After
- Direct error fixing
- Priority-based approach
- Limited retry attempts
- Clear fix reporting

### Key Points
- Fixes in priority order
- Build > Type > Test > Lint
- Tracks previous attempts
- Knows unfixable errors

## Common Patterns

All three agents now:
1. Focus on single purpose
2. No gate systems
3. Clear JSON output
4. No progress files
5. Handle failures gracefully
```

## Unit Tests

**File: src/cli/siegemaster/gap-analyzer.test.ts**
```typescript
import { analyzeTestCoverage, formatSiegemasterInstructions } from './gap-analyzer';

describe('SiegemasterGapAnalyzer', () => {
  describe('analyzeTestCoverage', () => {
    it('should identify missing test files', async () => {
      const files = [
        'src/auth/auth-service.ts',
        'src/auth/auth-middleware.ts',
        'src/auth/auth-service.test.ts',
      ];

      const analysis = await analyzeTestCoverage(files, 'jest');

      expect(analysis.gaps).toHaveLength(1);
      expect(analysis.gaps[0].file).toBe('src/auth/auth-middleware.ts');
      expect(analysis.gaps[0].priority).toBe('high');
      expect(analysis.gaps[0].suggestedTests).toContain(
        'src/auth/auth-middleware.test.ts'
      );
    });

    it('should calculate coverage metrics', async () => {
      const files = [
        'src/service.ts',
        'src/service.test.ts',
        'src/controller.ts',
      ];

      const analysis = await analyzeTestCoverage(files, 'jest');

      expect(analysis.byFile['src/service.ts']).toBe(75);
      expect(analysis.byFile['src/controller.ts']).toBe(0);
      expect(analysis.overall).toBeLessThan(50);
    });

    it('should recommend integration tests', async () => {
      const files = [
        'src/auth/service.ts',
        'src/auth/service.test.ts',
        'src/user/service.ts',
        'src/user/service.test.ts',
        'src/api/routes.ts',
        'src/api/routes.test.ts',
      ];

      const analysis = await analyzeTestCoverage(files, 'jest');

      expect(analysis.recommendations).toContain(
        expect.stringContaining('integration tests')
      );
    });
  });

  describe('formatSiegemasterInstructions', () => {
    it('should format instructions with files', () => {
      const instructions = formatSiegemasterInstructions(
        'Add Authentication',
        ['auth.ts', 'auth.test.ts'],
        'jest'
      );

      expect(instructions).toContain('Add Authentication');
      expect(instructions).toContain('- auth.ts');
      expect(instructions).toContain('- auth.test.ts');
      expect(instructions).toContain('jest');
    });
  });
});
```

**File: src/cli/lawbringer/standards-enforcer.test.ts**
```typescript
import { runStandardsReview, parseWardErrors } from './standards-enforcer';
import { exec } from 'child_process';

jest.mock('child_process');

describe('LawbringerStandardsEnforcer', () => {
  describe('runStandardsReview', () => {
    it('should handle successful ward run', async () => {
      (exec as any).mockImplementation((cmd, cb) => cb(null, { stdout: 'All passed' }));

      const review = await runStandardsReview(
        ['file.ts'],
        { all: 'npm run ward:all' }
      );

      expect(review.passed).toBe(true);
      expect(review.score).toBe(100);
      expect(review.wardResults.all).toBe('passed');
    });

    it('should parse ward failures', async () => {
      const errorOutput = `
file.ts:10:5: error: Missing semicolon (semi)
file.ts(20,10): error TS2322: Type 'string' is not assignable to type 'number'
      `;

      (exec as any).mockImplementation((cmd, cb) => 
        cb({ stderr: errorOutput }, null)
      );

      const review = await runStandardsReview(
        ['file.ts'],
        { all: 'npm run ward:all' }
      );

      expect(review.passed).toBe(false);
      expect(review.violations).toHaveLength(2);
      expect(review.violations[0].rule).toBe('semi');
      expect(review.violations[1].rule).toBe('TS2322');
    });
  });
});
```

**File: src/cli/spiritmender/error-fixer.test.ts**
```typescript
import { prioritizeErrors, areErrorsFixable } from './error-fixer';

describe('SpiritmenderErrorFixer', () => {
  describe('prioritizeErrors', () => {
    it('should prioritize build errors highest', () => {
      const errors = `
Build errors:
src/index.ts: Cannot find module

Type errors:
src/auth.ts(10,5): error TS2322: Type error

Lint errors:
src/util.ts:5:10: Missing semicolon
      `;

      const prioritized = prioritizeErrors(errors);

      expect(prioritized[0].type).toBe('build');
      expect(prioritized[0].priority).toBe(4);
      expect(prioritized[1].type).toBe('typecheck');
      expect(prioritized[2].type).toBe('lint');
    });
  });

  describe('areErrorsFixable', () => {
    it('should detect unfixable npm errors', () => {
      const errors = "Cannot find module 'express' in node_modules";
      
      const result = areErrorsFixable(errors);

      expect(result.fixable).toBe(false);
      expect(result.reason).toContain('npm install');
    });

    it('should detect permission errors', () => {
      const errors = "EACCES: Permission denied";
      
      const result = areErrorsFixable(errors);

      expect(result.fixable).toBe(false);
      expect(result.reason).toContain('Permission');
    });

    it('should allow fixable errors', () => {
      const errors = "src/file.ts:10:5: Missing semicolon";
      
      const result = areErrorsFixable(errors);

      expect(result.fixable).toBe(true);
    });
  });
});
```

## Validation Criteria

1. **Siegemaster**
   - [ ] Only analyzes, doesn't implement
   - [ ] Identifies missing test files
   - [ ] Prioritizes test gaps
   - [ ] Provides clear recommendations

2. **Lawbringer**
   - [ ] Runs ward commands
   - [ ] Parses error output
   - [ ] Fixes errors automatically
   - [ ] Reports remaining issues

3. **Spiritmender**
   - [ ] Fixes errors by priority
   - [ ] Handles multiple attempts
   - [ ] Detects unfixable errors
   - [ ] Reports all changes

4. **Common Updates**
   - [ ] Removed gate systems
   - [ ] JSON output format
   - [ ] No progress tracking
   - [ ] Clear error handling

5. **Integration**
   - [ ] Works with CLI spawning
   - [ ] Handles blocked states
   - [ ] Reports retrospectives
   - [ ] Validates output

## Next Steps

After completing this task:
1. Update agent markdown files
2. Test simplified behavior
3. Verify JSON output
4. Test error scenarios
5. Proceed to [14-voidpoker-integration.md](14-voidpoker-integration.md)