# Task 16: Ward Validation

## Objective
Implement ward:all validation gates that run after each agent to ensure code quality.

## Dependencies
- Task 06: Quest Execution (for integration points)
- Task 03: Config Management (for ward commands)

## Implementation

### 1. Ward Runner

**File: src/cli/ward/ward-runner.ts**
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { loadConfig } from '../config-manager';
import chalk from 'chalk';

const execAsync = promisify(exec);

export interface WardResult {
  success: boolean;
  command: string;
  duration: number;
  output?: string;
  errors?: string;
  errorDetails?: WardErrorDetails;
}

export interface WardErrorDetails {
  lintErrors: ErrorDetail[];
  typeErrors: ErrorDetail[];
  testErrors: ErrorDetail[];
  buildErrors: ErrorDetail[];
  otherErrors: ErrorDetail[];
}

export interface ErrorDetail {
  file: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning';
  message: string;
  rule?: string;
}

/**
 * Runs ward:all validation
 */
export async function runWardAll(): Promise<WardResult> {
  console.log(chalk.gray('\n🛡️  Running ward validation...'));
  
  const startTime = Date.now();
  const config = await loadConfig();
  const wardCommand = config.project.wardCommands.all;
  
  if (!wardCommand) {
    return {
      success: false,
      command: 'none',
      duration: 0,
      errors: 'No ward:all command configured. Run "questmaestro discover" to set up.',
    };
  }
  
  try {
    const { stdout, stderr } = await execAsync(wardCommand, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
    });
    
    const duration = Date.now() - startTime;
    
    console.log(chalk.green('✅ Ward validation passed'));
    
    return {
      success: true,
      command: wardCommand,
      duration,
      output: stdout + stderr,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorOutput = error.stdout + error.stderr;
    
    console.log(chalk.red('❌ Ward validation failed'));
    
    // Parse error details
    const errorDetails = parseWardErrors(errorOutput);
    
    return {
      success: false,
      command: wardCommand,
      duration,
      errors: errorOutput,
      errorDetails,
    };
  }
}

/**
 * Runs individual ward commands
 */
export async function runWardCommand(
  commandType: 'lint' | 'typecheck' | 'test'
): Promise<WardResult> {
  const config = await loadConfig();
  const command = config.project.wardCommands[commandType];
  
  if (!command) {
    return {
      success: false,
      command: 'none',
      duration: 0,
      errors: `No ${commandType} command configured`,
    };
  }
  
  console.log(chalk.gray(`\n🛡️  Running ${commandType}...`));
  
  const startTime = Date.now();
  
  try {
    const { stdout, stderr } = await execAsync(command);
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      command,
      duration,
      output: stdout + stderr,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    return {
      success: false,
      command,
      duration,
      errors: error.stdout + error.stderr,
    };
  }
}

/**
 * Parses ward error output into structured format
 */
export function parseWardErrors(output: string): WardErrorDetails {
  const details: WardErrorDetails = {
    lintErrors: [],
    typeErrors: [],
    testErrors: [],
    buildErrors: [],
    otherErrors: [],
  };
  
  const lines = output.split('\n');
  let currentCategory: keyof WardErrorDetails = 'otherErrors';
  
  for (const line of lines) {
    // Detect error categories
    if (line.includes('ESLint') || line.includes('Linting')) {
      currentCategory = 'lintErrors';
    } else if (line.includes('TypeScript') || line.includes('tsc')) {
      currentCategory = 'typeErrors';
    } else if (line.includes('Jest') || line.includes('Test') || line.includes('FAIL')) {
      currentCategory = 'testErrors';
    } else if (line.includes('Build') || line.includes('Compile')) {
      currentCategory = 'buildErrors';
    }
    
    // Parse individual errors
    const error = parseErrorLine(line);
    if (error) {
      details[currentCategory].push(error);
    }
  }
  
  return details;
}

/**
 * Parses a single error line
 */
function parseErrorLine(line: string): ErrorDetail | null {
  // ESLint format: file.ts:10:5: error: Message (rule-name)
  const eslintMatch = line.match(/^(.+?):(\d+):(\d+):\s*(error|warning):\s*(.+?)\s*\((.+?)\)$/);
  if (eslintMatch) {
    return {
      file: eslintMatch[1].trim(),
      line: parseInt(eslintMatch[2]),
      column: parseInt(eslintMatch[3]),
      severity: eslintMatch[4] as 'error' | 'warning',
      message: eslintMatch[5].trim(),
      rule: eslintMatch[6],
    };
  }
  
  // TypeScript format: file.ts(10,5): error TS2322: Message
  const tsMatch = line.match(/^(.+?)\((\d+),(\d+)\):\s*error\s*(TS\d+):\s*(.+)$/);
  if (tsMatch) {
    return {
      file: tsMatch[1].trim(),
      line: parseInt(tsMatch[2]),
      column: parseInt(tsMatch[3]),
      severity: 'error',
      rule: tsMatch[4],
      message: tsMatch[5].trim(),
    };
  }
  
  // Jest format: FAIL src/file.test.ts
  const jestMatch = line.match(/^\s*FAIL\s+(.+\.test\..+)$/);
  if (jestMatch) {
    return {
      file: jestMatch[1].trim(),
      severity: 'error',
      message: 'Test suite failed',
    };
  }
  
  // Generic error with file
  const genericMatch = line.match(/^(.+\.(ts|js|tsx|jsx)):\s*(.+)$/);
  if (genericMatch) {
    return {
      file: genericMatch[1],
      severity: 'error',
      message: genericMatch[3],
    };
  }
  
  return null;
}

/**
 * Formats ward errors for display
 */
export function formatWardErrors(details: WardErrorDetails): string {
  const sections: string[] = [];
  
  if (details.buildErrors.length > 0) {
    sections.push(formatErrorSection('Build Errors', details.buildErrors));
  }
  
  if (details.typeErrors.length > 0) {
    sections.push(formatErrorSection('Type Errors', details.typeErrors));
  }
  
  if (details.testErrors.length > 0) {
    sections.push(formatErrorSection('Test Failures', details.testErrors));
  }
  
  if (details.lintErrors.length > 0) {
    sections.push(formatErrorSection('Lint Errors', details.lintErrors));
  }
  
  if (details.otherErrors.length > 0) {
    sections.push(formatErrorSection('Other Errors', details.otherErrors));
  }
  
  return sections.join('\n\n');
}

function formatErrorSection(title: string, errors: ErrorDetail[]): string {
  const lines = [`${title}:`];
  
  for (const error of errors) {
    const location = error.line 
      ? `${error.file}:${error.line}:${error.column || 0}`
      : error.file;
    
    const rule = error.rule ? ` (${error.rule})` : '';
    lines.push(`  ${location}: ${error.message}${rule}`);
  }
  
  return lines.join('\n');
}

/**
 * Gets a summary of ward errors
 */
export function getErrorSummary(details: WardErrorDetails): {
  total: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
} {
  const allErrors = [
    ...details.lintErrors,
    ...details.typeErrors,
    ...details.testErrors,
    ...details.buildErrors,
    ...details.otherErrors,
  ];
  
  return {
    total: allErrors.length,
    byCategory: {
      lint: details.lintErrors.length,
      type: details.typeErrors.length,
      test: details.testErrors.length,
      build: details.buildErrors.length,
      other: details.otherErrors.length,
    },
    bySeverity: {
      error: allErrors.filter(e => e.severity === 'error').length,
      warning: allErrors.filter(e => e.severity === 'warning').length,
    },
  };
}
```

### 2. Ward Gate Integration

**File: src/cli/ward/ward-gate.ts**
```typescript
import { Quest } from '../types/quest';
import { runWardAll, WardResult, formatWardErrors, getErrorSummary } from './ward-runner';
import { saveQuest } from '../quest-storage';
import chalk from 'chalk';

export interface WardGateResult {
  passed: boolean;
  shouldBlock: boolean;
  canAutoFix: boolean;
  summary: string;
}

/**
 * Runs ward validation gate after an agent
 */
export async function runWardGate(
  quest: Quest,
  agentType: string
): Promise<WardGateResult> {
  // Skip ward for discovery agents
  if (agentType === 'pathseeker' || agentType === 'voidpoker') {
    return {
      passed: true,
      shouldBlock: false,
      canAutoFix: false,
      summary: 'Ward validation skipped for discovery agent',
    };
  }
  
  const wardResult = await runWardAll();
  
  if (wardResult.success) {
    return {
      passed: true,
      shouldBlock: false,
      canAutoFix: false,
      summary: `Ward validation passed in ${wardResult.duration}ms`,
    };
  }
  
  // Analyze errors
  const errorSummary = wardResult.errorDetails 
    ? getErrorSummary(wardResult.errorDetails)
    : { total: 1, byCategory: {}, bySeverity: {} };
  
  // Determine if we should block
  const shouldBlock = shouldBlockQuest(errorSummary, agentType);
  
  // Check if Spiritmender can fix
  const canAutoFix = canSpiritmenderFix(wardResult);
  
  // Format summary
  const summary = formatGateSummary(wardResult, errorSummary);
  
  // Log results
  if (shouldBlock) {
    console.log(chalk.red('\n🚫 Ward gate BLOCKED - critical errors found'));
  } else {
    console.log(chalk.yellow('\n⚠️  Ward gate failed - attempting fixes'));
  }
  
  console.log(chalk.gray(summary));
  
  return {
    passed: false,
    shouldBlock,
    canAutoFix,
    summary,
  };
}

/**
 * Determines if quest should be blocked
 */
function shouldBlockQuest(
  errorSummary: ReturnType<typeof getErrorSummary>,
  agentType: string
): boolean {
  // Always block for build errors
  if (errorSummary.byCategory.build > 0) {
    return true;
  }
  
  // Block if too many errors
  if (errorSummary.total > 50) {
    return true;
  }
  
  // Block if Lawbringer or Spiritmender failed
  if (agentType === 'lawbringer' || agentType === 'spiritmender') {
    return true;
  }
  
  return false;
}

/**
 * Checks if Spiritmender can fix the errors
 */
function canSpiritmenderFix(wardResult: WardResult): boolean {
  if (!wardResult.errors) return false;
  
  // Check for unfixable errors
  const unfixablePatterns = [
    'Cannot find module',
    'EACCES',
    'Permission denied',
    'out of memory',
    'npm ERR!',
  ];
  
  for (const pattern of unfixablePatterns) {
    if (wardResult.errors.includes(pattern)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Formats gate summary message
 */
function formatGateSummary(
  wardResult: WardResult,
  errorSummary: ReturnType<typeof getErrorSummary>
): string {
  const lines: string[] = [];
  
  lines.push(`Command: ${wardResult.command}`);
  lines.push(`Duration: ${wardResult.duration}ms`);
  lines.push(`Total errors: ${errorSummary.total}`);
  
  if (errorSummary.total > 0) {
    lines.push('\nError breakdown:');
    
    for (const [category, count] of Object.entries(errorSummary.byCategory)) {
      if (count > 0) {
        lines.push(`  ${category}: ${count}`);
      }
    }
  }
  
  if (wardResult.errorDetails) {
    lines.push('\nError details:');
    lines.push(formatWardErrors(wardResult.errorDetails).split('\n').slice(0, 10).join('\n'));
    
    if (errorSummary.total > 10) {
      lines.push(`... and ${errorSummary.total - 10} more errors`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Records ward result in quest
 */
export async function recordWardResult(
  quest: Quest,
  agentType: string,
  wardResult: WardResult
): Promise<void> {
  // Add to execution log
  quest.executionLog.push({
    report: `ward-validation-${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentType: 'ward',
    status: wardResult.success ? 'completed' : 'failed',
  });
  
  // Save ward errors if failed
  if (!wardResult.success && wardResult.errors) {
    const errorFile = `questmaestro/active/${quest.folder}/ward-errors-${Date.now()}.txt`;
    const { writeFile } = await import('fs/promises');
    await writeFile(errorFile, wardResult.errors);
  }
  
  await saveQuest(quest);
}
```

### 3. Ward Monitor

**File: src/cli/ward/ward-monitor.ts**
```typescript
import { WardResult } from './ward-runner';
import { EventEmitter } from 'events';
import chalk from 'chalk';

export class WardMonitor extends EventEmitter {
  private history: WardResult[] = [];
  private consecutiveFailures = 0;
  
  /**
   * Records a ward result
   */
  recordResult(result: WardResult): void {
    this.history.push(result);
    
    if (result.success) {
      this.consecutiveFailures = 0;
      this.emit('success', result);
    } else {
      this.consecutiveFailures++;
      this.emit('failure', result);
      
      if (this.consecutiveFailures >= 3) {
        this.emit('repeated-failure', this.consecutiveFailures);
      }
    }
  }
  
  /**
   * Gets ward health status
   */
  getHealthStatus(): {
    healthy: boolean;
    successRate: number;
    avgDuration: number;
    recentFailures: number;
  } {
    const recent = this.history.slice(-10);
    const successes = recent.filter(r => r.success).length;
    const totalDuration = recent.reduce((sum, r) => sum + r.duration, 0);
    
    return {
      healthy: this.consecutiveFailures < 3,
      successRate: recent.length > 0 ? successes / recent.length : 0,
      avgDuration: recent.length > 0 ? totalDuration / recent.length : 0,
      recentFailures: this.consecutiveFailures,
    };
  }
  
  /**
   * Displays ward health
   */
  displayHealth(): void {
    const health = this.getHealthStatus();
    
    console.log(chalk.bold('\n🛡️  Ward Health Status:'));
    
    if (health.healthy) {
      console.log(chalk.green('  Status: Healthy'));
    } else {
      console.log(chalk.red('  Status: Unhealthy'));
    }
    
    console.log(`  Success rate: ${(health.successRate * 100).toFixed(0)}%`);
    console.log(`  Avg duration: ${health.avgDuration.toFixed(0)}ms`);
    
    if (health.recentFailures > 0) {
      console.log(chalk.yellow(`  Consecutive failures: ${health.recentFailures}`));
    }
  }
}

// Global ward monitor instance
export const wardMonitor = new WardMonitor();

// Set up event handlers
wardMonitor.on('repeated-failure', (count) => {
  console.log(chalk.red(`\n⚠️  Ward validation has failed ${count} times in a row!`));
  console.log(chalk.yellow('Consider:'));
  console.log('  - Checking your development environment');
  console.log('  - Running npm install');
  console.log('  - Manually fixing persistent errors');
});
```

## Unit Tests

**File: src/cli/ward/ward-runner.test.ts**
```typescript
import { exec } from 'child_process';
import { runWardAll, parseWardErrors, formatWardErrors } from './ward-runner';
import { loadConfig } from '../config-manager';

jest.mock('child_process');
jest.mock('../config-manager');

describe('WardRunner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (loadConfig as jest.Mock).mockResolvedValue({
      project: {
        wardCommands: {
          all: 'npm run ward:all',
        },
      },
    });
  });

  describe('runWardAll', () => {
    it('should return success for passing validation', async () => {
      (exec as any).mockImplementation((cmd, opts, cb) => 
        cb(null, { stdout: 'All checks passed', stderr: '' })
      );

      const result = await runWardAll();

      expect(result.success).toBe(true);
      expect(result.command).toBe('npm run ward:all');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should parse errors on failure', async () => {
      const errorOutput = `
src/file.ts:10:5: error: Missing semicolon (semi)
src/file.ts(20,10): error TS2322: Type 'string' is not assignable
FAIL src/test.test.ts
      `;

      (exec as any).mockImplementation((cmd, opts, cb) => 
        cb({ stdout: '', stderr: errorOutput }, null)
      );

      const result = await runWardAll();

      expect(result.success).toBe(false);
      expect(result.errorDetails).toBeDefined();
      expect(result.errorDetails!.lintErrors).toHaveLength(1);
      expect(result.errorDetails!.typeErrors).toHaveLength(1);
      expect(result.errorDetails!.testErrors).toHaveLength(1);
    });

    it('should handle missing ward command', async () => {
      (loadConfig as jest.Mock).mockResolvedValue({
        project: { wardCommands: {} },
      });

      const result = await runWardAll();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('No ward:all command');
    });
  });

  describe('parseWardErrors', () => {
    it('should parse ESLint errors', () => {
      const output = 'src/app.ts:10:5: error: Missing semicolon (semi)';
      
      const details = parseWardErrors(output);

      expect(details.lintErrors).toHaveLength(1);
      expect(details.lintErrors[0]).toEqual({
        file: 'src/app.ts',
        line: 10,
        column: 5,
        severity: 'error',
        message: 'Missing semicolon',
        rule: 'semi',
      });
    });

    it('should parse TypeScript errors', () => {
      const output = 'src/types.ts(15,20): error TS2345: Argument of type';
      
      const details = parseWardErrors(output);

      expect(details.typeErrors).toHaveLength(1);
      expect(details.typeErrors[0]).toEqual({
        file: 'src/types.ts',
        line: 15,
        column: 20,
        severity: 'error',
        rule: 'TS2345',
        message: 'Argument of type',
      });
    });

    it('should parse Jest failures', () => {
      const output = '  FAIL src/auth.test.ts';
      
      const details = parseWardErrors(output);

      expect(details.testErrors).toHaveLength(1);
      expect(details.testErrors[0].file).toBe('src/auth.test.ts');
    });
  });

  describe('formatWardErrors', () => {
    it('should format errors by category', () => {
      const details = {
        lintErrors: [{
          file: 'app.ts',
          line: 10,
          severity: 'error' as const,
          message: 'Missing semicolon',
        }],
        typeErrors: [{
          file: 'types.ts',
          line: 5,
          severity: 'error' as const,
          message: 'Type error',
        }],
        testErrors: [],
        buildErrors: [],
        otherErrors: [],
      };

      const formatted = formatWardErrors(details);

      expect(formatted).toContain('Type Errors:');
      expect(formatted).toContain('types.ts:5:0: Type error');
      expect(formatted).toContain('Lint Errors:');
      expect(formatted).toContain('app.ts:10:0: Missing semicolon');
    });
  });
});
```

**File: src/cli/ward/ward-gate.test.ts**
```typescript
import { runWardGate, shouldBlockQuest } from './ward-gate';
import { runWardAll } from './ward-runner';
import { Quest } from '../types/quest';

jest.mock('./ward-runner');

describe('WardGate', () => {
  const mockQuest: Quest = {
    id: 'test-123',
    folder: '01-test',
    title: 'Test Quest',
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    phases: {
      discovery: { status: 'complete' },
      implementation: { status: 'in_progress' },
      testing: { status: 'pending' },
      review: { status: 'pending' },
    },
    tasks: [],
    executionPlan: [],
    executionLog: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('runWardGate', () => {
    it('should pass for successful validation', async () => {
      (runWardAll as jest.Mock).mockResolvedValue({
        success: true,
        command: 'npm run ward:all',
        duration: 1000,
      });

      const result = await runWardGate(mockQuest, 'codeweaver');

      expect(result.passed).toBe(true);
      expect(result.shouldBlock).toBe(false);
    });

    it('should skip for discovery agents', async () => {
      const result = await runWardGate(mockQuest, 'pathseeker');

      expect(result.passed).toBe(true);
      expect(runWardAll).not.toHaveBeenCalled();
    });

    it('should analyze failures', async () => {
      (runWardAll as jest.Mock).mockResolvedValue({
        success: false,
        command: 'npm run ward:all',
        duration: 1000,
        errors: 'Errors found',
        errorDetails: {
          lintErrors: [{ file: 'app.ts', severity: 'error', message: 'Error' }],
          typeErrors: [],
          testErrors: [],
          buildErrors: [],
          otherErrors: [],
        },
      });

      const result = await runWardGate(mockQuest, 'codeweaver');

      expect(result.passed).toBe(false);
      expect(result.canAutoFix).toBe(true);
    });

    it('should block for build errors', async () => {
      (runWardAll as jest.Mock).mockResolvedValue({
        success: false,
        errorDetails: {
          buildErrors: [{ file: 'app.ts', severity: 'error', message: 'Build failed' }],
          lintErrors: [],
          typeErrors: [],
          testErrors: [],
          otherErrors: [],
        },
      });

      const result = await runWardGate(mockQuest, 'codeweaver');

      expect(result.shouldBlock).toBe(true);
    });

    it('should detect unfixable errors', async () => {
      (runWardAll as jest.Mock).mockResolvedValue({
        success: false,
        errors: 'Cannot find module express',
      });

      const result = await runWardGate(mockQuest, 'codeweaver');

      expect(result.canAutoFix).toBe(false);
    });
  });
});
```

## Validation Criteria

1. **Ward Execution**
   - [ ] Runs ward:all command
   - [ ] Captures output correctly
   - [ ] Handles timeouts gracefully
   - [ ] Reports duration

2. **Error Parsing**
   - [ ] Parses ESLint errors
   - [ ] Parses TypeScript errors
   - [ ] Parses test failures
   - [ ] Categorizes correctly

3. **Gate Logic**
   - [ ] Skips for discovery agents
   - [ ] Blocks for critical errors
   - [ ] Detects fixable vs unfixable
   - [ ] Records results in quest

4. **Error Formatting**
   - [ ] Groups by category
   - [ ] Shows file locations
   - [ ] Truncates long output
   - [ ] Clear error summaries

5. **Monitoring**
   - [ ] Tracks success rate
   - [ ] Detects repeated failures
   - [ ] Provides health status
   - [ ] Warns on problems

## Next Steps

After completing this task:
1. Test ward command execution
2. Verify error parsing
3. Test gate decisions
4. Check monitoring features
5. Proceed to [17-spiritmender-loop.md](17-spiritmender-loop.md)