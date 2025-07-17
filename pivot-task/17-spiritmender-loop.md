# Task 17: Spiritmender Loop

## Objective
Handle ward failures with Spiritmender, implementing a retry loop with limits and intelligent error handling.

## Dependencies
- Task 16: Ward Validation (for error details)
- Task 07: Agent Spawning (for Spiritmender execution)
- Task 13: Other Agents Updates (for Spiritmender behavior)

## Implementation

### 1. Spiritmender Handler

**File: src/cli/ward/spiritmender-handler.ts**
```typescript
import { Quest } from '../types/quest';
import { spawnAndWait } from '../agent-spawner';
import { runWardAll, WardResult } from './ward-runner';
import { loadQuest, saveQuest } from '../quest-storage';
import { parseReportFile } from '../report-parser';
import chalk from 'chalk';

export const MAX_SPIRITMENDER_ATTEMPTS = 3;

export interface SpiritMenderAttempt {
  attemptNumber: number;
  timestamp: string;
  errors: string;
  fixes: number;
  remainingErrors: number;
  success: boolean;
}

/**
 * Handles ward failures with Spiritmender
 */
export async function handleWardFailure(
  quest: Quest,
  errors: string,
  attemptCount: number = 1
): Promise<void> {
  if (attemptCount > MAX_SPIRITMENDER_ATTEMPTS) {
    await handleMaxAttemptsReached(quest, errors);
    return;
  }
  
  console.log(chalk.yellow(`\n🔧 Spiritmender attempt ${attemptCount}/${MAX_SPIRITMENDER_ATTEMPTS}...`));
  
  // Get previous attempts for context
  const previousAttempts = await getPreviousAttempts(quest);
  
  // Check if errors are fixable
  const fixability = checkErrorFixability(errors);
  if (!fixability.fixable) {
    await handleUnfixableErrors(quest, errors, fixability.reason);
    return;
  }
  
  try {
    // Spawn Spiritmender
    const result = await spawnAndWait('spiritmender', {
      questFolder: quest.folder,
      questTitle: quest.title,
      errors: errors,
      attemptNumber: attemptCount,
      previousAttempts: previousAttempts,
      maxAttempts: MAX_SPIRITMENDER_ATTEMPTS,
      instruction: generateSpiritMenderInstructions(attemptCount, previousAttempts),
    });
    
    // Record attempt
    await recordSpiritMenderAttempt(quest, {
      attemptNumber: attemptCount,
      timestamp: new Date().toISOString(),
      errors: errors,
      fixes: result.report.fixes?.length || 0,
      remainingErrors: result.report.remainingIssues?.length || 0,
      success: result.status === 'complete',
    });
    
    if (result.status === 'blocked') {
      console.log(chalk.red('❌ Spiritmender blocked - manual intervention required'));
      quest.status = 'blocked';
      quest.blockReason = `Spiritmender blocked: ${result.blockReason}`;
      await saveQuest(quest);
      return;
    }
    
    // Re-run ward to check if fixed
    console.log(chalk.gray('\n🛡️  Re-running ward validation...'));
    const wardCheck = await runWardAll();
    
    if (wardCheck.success) {
      console.log(chalk.green('✅ Ward validation passed after Spiritmender fixes!'));
      return;
    }
    
    // Check if we made progress
    const madeProgress = checkProgress(errors, wardCheck.errors || '');
    
    if (!madeProgress) {
      console.log(chalk.yellow('⚠️  No progress made, trying different approach...'));
    }
    
    // Recurse with incremented attempt count
    await handleWardFailure(quest, wardCheck.errors || '', attemptCount + 1);
    
  } catch (error) {
    console.error(chalk.red(`❌ Spiritmender failed: ${error.message}`));
    await handleSpiritMenderError(quest, error, attemptCount);
  }
}

/**
 * Handles maximum attempts reached
 */
async function handleMaxAttemptsReached(
  quest: Quest,
  errors: string
): Promise<void> {
  console.error(chalk.red(`\n❌ Ward validation failed after ${MAX_SPIRITMENDER_ATTEMPTS} Spiritmender attempts`));
  console.error(chalk.yellow('Manual intervention required. Common causes:'));
  console.error('  - Complex type errors requiring architectural changes');
  console.error('  - Incompatible dependency versions');
  console.error('  - Fundamental design conflicts');
  console.error('  - Missing type definitions');
  
  // Save errors for user review
  const errorFile = `questmaestro/active/${quest.folder}/ward-errors-unresolved.txt`;
  const { writeFile } = await import('fs/promises');
  
  const errorReport = `Ward Validation Errors - Unresolved
Generated: ${new Date().toISOString()}
Quest: ${quest.title}
Attempts: ${MAX_SPIRITMENDER_ATTEMPTS}

${errors}

ANALYSIS:
${analyzePeristentErrors(errors)}

SUGGESTED ACTIONS:
${suggestManualFixes(errors)}
`;
  
  await writeFile(errorFile, errorReport);
  
  // Block the quest
  quest.status = 'blocked';
  quest.blockReason = 'ward_validation_failed_after_spiritmender_attempts';
  await saveQuest(quest);
  
  console.log(chalk.yellow(`\n📄 Error details saved to: ${errorFile}`));
  throw new Error('Quest blocked: Ward validation cannot be automatically resolved');
}

/**
 * Checks if errors are fixable
 */
function checkErrorFixability(errors: string): {
  fixable: boolean;
  reason: string;
} {
  const unfixablePatterns = [
    { pattern: /Cannot find module.+node_modules/i, reason: 'Missing npm dependencies' },
    { pattern: /EACCES|Permission denied/i, reason: 'Permission errors' },
    { pattern: /JavaScript heap out of memory/i, reason: 'Memory issues' },
    { pattern: /npm ERR!/i, reason: 'npm errors' },
    { pattern: /Cannot resolve dependency/i, reason: 'Dependency resolution issues' },
    { pattern: /Module not found: Can't resolve/i, reason: 'Missing modules' },
  ];
  
  for (const { pattern, reason } of unfixablePatterns) {
    if (pattern.test(errors)) {
      return { fixable: false, reason };
    }
  }
  
  return { fixable: true, reason: '' };
}

/**
 * Handles unfixable errors
 */
async function handleUnfixableErrors(
  quest: Quest,
  errors: string,
  reason: string
): Promise<void> {
  console.error(chalk.red(`\n❌ Unfixable errors detected: ${reason}`));
  
  const suggestions = getFixSuggestions(reason);
  if (suggestions.length > 0) {
    console.log(chalk.yellow('\n💡 Suggested fixes:'));
    suggestions.forEach(s => console.log(`  - ${s}`));
  }
  
  quest.status = 'blocked';
  quest.blockReason = `Unfixable errors: ${reason}`;
  await saveQuest(quest);
  
  throw new Error(`Quest blocked: ${reason}`);
}

/**
 * Gets fix suggestions for unfixable errors
 */
function getFixSuggestions(reason: string): string[] {
  const suggestionMap: Record<string, string[]> = {
    'Missing npm dependencies': [
      'Run: npm install',
      'Check package.json for missing dependencies',
      'Clear node_modules and reinstall: rm -rf node_modules && npm install',
    ],
    'Permission errors': [
      'Check file permissions',
      'Run with appropriate user permissions',
      'Fix ownership: sudo chown -R $(whoami) .',
    ],
    'Memory issues': [
      'Increase Node.js memory: NODE_OPTIONS="--max-old-space-size=4096"',
      'Close other applications',
      'Check for memory leaks in tests',
    ],
    'Dependency resolution issues': [
      'Clear npm cache: npm cache clean --force',
      'Delete package-lock.json and reinstall',
      'Check for conflicting dependency versions',
    ],
  };
  
  return suggestionMap[reason] || ['Manual investigation required'];
}

/**
 * Generates instructions for Spiritmender
 */
function generateSpiritMenderInstructions(
  attemptNumber: number,
  previousAttempts: SpiritMenderAttempt[]
): string {
  if (attemptNumber === 1) {
    return 'Fix the errors in priority order. Start with build/compile errors, then type errors, then tests, then lint.';
  }
  
  const lastAttempt = previousAttempts[previousAttempts.length - 1];
  
  if (lastAttempt && lastAttempt.fixes === 0) {
    return 'Previous attempt made no fixes. Try a different approach - look for root causes rather than symptoms.';
  }
  
  if (attemptNumber === MAX_SPIRITMENDER_ATTEMPTS) {
    return 'Final attempt - focus on the most critical errors that are blocking the build.';
  }
  
  return 'Previous fixes were partially successful. Continue fixing remaining errors.';
}

/**
 * Checks if progress was made
 */
function checkProgress(oldErrors: string, newErrors: string): boolean {
  // Simple check: different error count or content
  const oldErrorLines = oldErrors.split('\n').filter(l => l.trim());
  const newErrorLines = newErrors.split('\n').filter(l => l.trim());
  
  // Progress if fewer errors
  if (newErrorLines.length < oldErrorLines.length * 0.9) {
    return true;
  }
  
  // Progress if errors changed significantly
  const oldErrorSet = new Set(oldErrorLines);
  const newErrorSet = new Set(newErrorLines);
  
  const changedErrors = [...newErrorSet].filter(e => !oldErrorSet.has(e));
  
  return changedErrors.length > newErrorSet.size * 0.2;
}

/**
 * Gets previous Spiritmender attempts
 */
async function getPreviousAttempts(quest: Quest): Promise<SpiritMenderAttempt[]> {
  const attempts: SpiritMenderAttempt[] = [];
  
  // Look for Spiritmender reports in quest folder
  const { getQuestReports } = await import('../directory-manager');
  const reports = await getQuestReports(quest.folder);
  
  for (const reportFile of reports) {
    if (reportFile.includes('spiritmender-report')) {
      try {
        const report = await parseReportFile(quest.folder, reportFile);
        if (report.report.attemptNumber) {
          attempts.push({
            attemptNumber: report.report.attemptNumber,
            timestamp: report.report.timestamp || '',
            errors: report.report.errors?.length || 0,
            fixes: report.report.fixes?.length || 0,
            remainingErrors: report.report.remainingIssues?.length || 0,
            success: report.status === 'complete',
          });
        }
      } catch {
        // Skip invalid reports
      }
    }
  }
  
  return attempts.sort((a, b) => a.attemptNumber - b.attemptNumber);
}

/**
 * Records a Spiritmender attempt
 */
async function recordSpiritMenderAttempt(
  quest: Quest,
  attempt: SpiritMenderAttempt
): Promise<void> {
  // Store in quest metadata
  if (!quest.metadata) {
    quest.metadata = {};
  }
  
  if (!quest.metadata.spiritMenderAttempts) {
    quest.metadata.spiritMenderAttempts = [];
  }
  
  quest.metadata.spiritMenderAttempts.push(attempt);
  await saveQuest(quest);
}

/**
 * Analyzes persistent errors
 */
function analyzePeristentErrors(errors: string): string {
  const analysis: string[] = [];
  
  // Count error types
  const typeErrors = (errors.match(/TS\d+/g) || []).length;
  const lintErrors = (errors.match(/eslint|lint/gi) || []).length;
  const testErrors = (errors.match(/FAIL|failed/gi) || []).length;
  
  if (typeErrors > 10) {
    analysis.push('High number of TypeScript errors - may indicate missing type definitions or incompatible types');
  }
  
  if (errors.includes('any') && errors.includes('implicit')) {
    analysis.push('Implicit any errors - consider adding explicit types or enabling less strict type checking temporarily');
  }
  
  if (errors.includes('Cannot find namespace') || errors.includes('Cannot find name')) {
    analysis.push('Missing type definitions - may need to install @types packages');
  }
  
  return analysis.join('\n');
}

/**
 * Suggests manual fixes
 */
function suggestManualFixes(errors: string): string {
  const suggestions: string[] = [];
  
  if (errors.includes('TS')) {
    suggestions.push('1. Check tsconfig.json settings');
    suggestions.push('2. Install missing @types packages');
    suggestions.push('3. Add type assertions where needed');
  }
  
  if (errors.includes('test')) {
    suggestions.push('1. Run tests individually to isolate failures');
    suggestions.push('2. Check test environment setup');
    suggestions.push('3. Update snapshots if needed');
  }
  
  suggestions.push('4. Consider reverting recent changes');
  suggestions.push('5. Ask for help with specific error messages');
  
  return suggestions.join('\n');
}

/**
 * Handles Spiritmender errors
 */
async function handleSpiritMenderError(
  quest: Quest,
  error: Error,
  attemptCount: number
): Promise<void> {
  console.error(chalk.red(`Spiritmender error on attempt ${attemptCount}: ${error.message}`));
  
  if (attemptCount < MAX_SPIRITMENDER_ATTEMPTS) {
    console.log(chalk.yellow('Retrying with fresh Spiritmender instance...'));
    // Will be retried by the main flow
  } else {
    quest.status = 'blocked';
    quest.blockReason = `Spiritmender error: ${error.message}`;
    await saveQuest(quest);
    throw error;
  }
}
```

### 2. Spiritmender Strategy

**File: src/cli/ward/spiritmender-strategy.ts**
```typescript
import { WardErrorDetails, ErrorDetail } from './ward-runner';

export interface FixStrategy {
  priority: number;
  category: 'build' | 'type' | 'test' | 'lint';
  approach: string;
  patterns: FixPattern[];
}

export interface FixPattern {
  errorPattern: RegExp;
  fixApproach: string;
  autoFixable: boolean;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Develops fix strategy based on errors
 */
export function developFixStrategy(errors: WardErrorDetails): FixStrategy[] {
  const strategies: FixStrategy[] = [];
  
  // Build errors - highest priority
  if (errors.buildErrors.length > 0) {
    strategies.push({
      priority: 1,
      category: 'build',
      approach: 'Fix compilation errors first',
      patterns: getBuildFixPatterns(errors.buildErrors),
    });
  }
  
  // Type errors
  if (errors.typeErrors.length > 0) {
    strategies.push({
      priority: 2,
      category: 'type',
      approach: 'Resolve type mismatches and missing types',
      patterns: getTypeFixPatterns(errors.typeErrors),
    });
  }
  
  // Test errors
  if (errors.testErrors.length > 0) {
    strategies.push({
      priority: 3,
      category: 'test',
      approach: 'Fix failing tests',
      patterns: getTestFixPatterns(errors.testErrors),
    });
  }
  
  // Lint errors - lowest priority
  if (errors.lintErrors.length > 0) {
    strategies.push({
      priority: 4,
      category: 'lint',
      approach: 'Apply lint fixes',
      patterns: getLintFixPatterns(errors.lintErrors),
    });
  }
  
  return strategies.sort((a, b) => a.priority - b.priority);
}

/**
 * Gets build error fix patterns
 */
function getBuildFixPatterns(errors: ErrorDetail[]): FixPattern[] {
  const patterns: FixPattern[] = [];
  
  for (const error of errors) {
    if (error.message.includes('Cannot find module')) {
      patterns.push({
        errorPattern: /Cannot find module/,
        fixApproach: 'Check import paths and install missing dependencies',
        autoFixable: false,
        confidence: 'high',
      });
    } else if (error.message.includes('Unexpected token')) {
      patterns.push({
        errorPattern: /Unexpected token/,
        fixApproach: 'Fix syntax error',
        autoFixable: true,
        confidence: 'high',
      });
    }
  }
  
  return patterns;
}

/**
 * Gets type error fix patterns
 */
function getTypeFixPatterns(errors: ErrorDetail[]): FixPattern[] {
  const patterns: FixPattern[] = [];
  const commonPatterns = new Map<string, number>();
  
  // Count common patterns
  for (const error of errors) {
    const key = error.rule || 'unknown';
    commonPatterns.set(key, (commonPatterns.get(key) || 0) + 1);
  }
  
  // TS2345: Argument type mismatch
  if (commonPatterns.has('TS2345')) {
    patterns.push({
      errorPattern: /TS2345/,
      fixApproach: 'Fix argument types or add type assertions',
      autoFixable: true,
      confidence: 'medium',
    });
  }
  
  // TS2322: Type assignment error
  if (commonPatterns.has('TS2322')) {
    patterns.push({
      errorPattern: /TS2322/,
      fixApproach: 'Fix type assignments or update type definitions',
      autoFixable: true,
      confidence: 'medium',
    });
  }
  
  // TS7006: Implicit any
  if (commonPatterns.has('TS7006')) {
    patterns.push({
      errorPattern: /TS7006/,
      fixApproach: 'Add explicit type annotations',
      autoFixable: true,
      confidence: 'high',
    });
  }
  
  return patterns;
}

/**
 * Gets test error fix patterns
 */
function getTestFixPatterns(errors: ErrorDetail[]): FixPattern[] {
  return [{
    errorPattern: /FAIL/,
    fixApproach: 'Update test expectations or fix implementation',
    autoFixable: false,
    confidence: 'low',
  }];
}

/**
 * Gets lint error fix patterns
 */
function getLintFixPatterns(errors: ErrorDetail[]): FixPattern[] {
  const patterns: FixPattern[] = [];
  
  const fixableRules = [
    'semi',
    'quotes',
    'indent',
    'comma-dangle',
    'no-trailing-spaces',
    'eol-last',
  ];
  
  for (const error of errors) {
    if (error.rule && fixableRules.includes(error.rule)) {
      patterns.push({
        errorPattern: new RegExp(error.rule),
        fixApproach: `Auto-fix ${error.rule} violations`,
        autoFixable: true,
        confidence: 'high',
      });
    }
  }
  
  return patterns;
}

/**
 * Groups similar errors for batch fixing
 */
export function groupSimilarErrors(
  errors: ErrorDetail[]
): Map<string, ErrorDetail[]> {
  const groups = new Map<string, ErrorDetail[]>();
  
  for (const error of errors) {
    const key = `${error.rule || 'generic'}-${error.file}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    
    groups.get(key)!.push(error);
  }
  
  return groups;
}
```

## Unit Tests

**File: src/cli/ward/spiritmender-handler.test.ts**
```typescript
import { handleWardFailure, MAX_SPIRITMENDER_ATTEMPTS } from './spiritmender-handler';
import { spawnAndWait } from '../agent-spawner';
import { runWardAll } from './ward-runner';
import { Quest } from '../types/quest';
import * as fs from 'fs/promises';

jest.mock('../agent-spawner');
jest.mock('./ward-runner');
jest.mock('fs/promises');

describe('SpiritMenderHandler', () => {
  const mockQuest: Quest = {
    id: 'test-123',
    folder: '01-test',
    title: 'Test Quest',
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    phases: {
      discovery: { status: 'complete' },
      implementation: { status: 'complete' },
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

  describe('handleWardFailure', () => {
    it('should spawn Spiritmender and retry ward', async () => {
      const errors = 'src/file.ts:10:5: error: Missing semicolon';
      
      (spawnAndWait as jest.Mock).mockResolvedValue({
        status: 'complete',
        report: {
          fixes: [{ file: 'src/file.ts', description: 'Added semicolon' }],
          remainingIssues: [],
        },
      });
      
      // First ward fails, second succeeds
      (runWardAll as jest.Mock)
        .mockResolvedValueOnce({ success: false, errors })
        .mockResolvedValueOnce({ success: true });

      await handleWardFailure(mockQuest, errors);

      expect(spawnAndWait).toHaveBeenCalledWith('spiritmender', expect.any(Object));
      expect(runWardAll).toHaveBeenCalledTimes(1); // Only re-run after fix
    });

    it('should retry up to max attempts', async () => {
      const errors = 'Persistent error';
      
      (spawnAndWait as jest.Mock).mockResolvedValue({
        status: 'complete',
        report: { fixes: [], remainingIssues: ['error'] },
      });
      
      (runWardAll as jest.Mock).mockResolvedValue({ 
        success: false, 
        errors 
      });

      await expect(handleWardFailure(mockQuest, errors))
        .rejects.toThrow('Ward validation cannot be automatically resolved');

      expect(spawnAndWait).toHaveBeenCalledTimes(MAX_SPIRITMENDER_ATTEMPTS);
    });

    it('should detect unfixable errors', async () => {
      const errors = 'Cannot find module in node_modules';

      await expect(handleWardFailure(mockQuest, errors))
        .rejects.toThrow('Missing npm dependencies');

      expect(spawnAndWait).not.toHaveBeenCalled();
    });

    it('should handle blocked Spiritmender', async () => {
      (spawnAndWait as jest.Mock).mockResolvedValue({
        status: 'blocked',
        blockReason: 'Need user input',
      });

      await handleWardFailure(mockQuest, 'errors');

      expect(mockQuest.status).toBe('blocked');
      expect(mockQuest.blockReason).toContain('Spiritmender blocked');
    });

    it('should detect progress between attempts', async () => {
      (spawnAndWait as jest.Mock).mockResolvedValue({
        status: 'complete',
        report: { fixes: [{ file: 'app.ts' }] },
      });
      
      // Different errors each time (showing progress)
      (runWardAll as jest.Mock)
        .mockResolvedValueOnce({ 
          success: false, 
          errors: '10 errors found' 
        })
        .mockResolvedValueOnce({ 
          success: false, 
          errors: '5 errors found' 
        })
        .mockResolvedValueOnce({ 
          success: true 
        });

      await handleWardFailure(mockQuest, '10 errors found');

      expect(spawnAndWait).toHaveBeenCalledTimes(2); // Made progress
    });

    it('should save unresolved errors to file', async () => {
      (spawnAndWait as jest.Mock).mockResolvedValue({
        status: 'complete',
        report: { fixes: [] },
      });
      
      (runWardAll as jest.Mock).mockResolvedValue({ 
        success: false, 
        errors: 'Persistent errors' 
      });

      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await expect(handleWardFailure(mockQuest, 'errors'))
        .rejects.toThrow();

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('ward-errors-unresolved.txt'),
        expect.stringContaining('Persistent errors')
      );
    });
  });
});
```

**File: src/cli/ward/spiritmender-strategy.test.ts**
```typescript
import { developFixStrategy, groupSimilarErrors } from './spiritmender-strategy';
import { WardErrorDetails } from './ward-runner';

describe('SpiritMenderStrategy', () => {
  describe('developFixStrategy', () => {
    it('should prioritize build errors', () => {
      const errors: WardErrorDetails = {
        buildErrors: [{ 
          file: 'app.ts', 
          severity: 'error', 
          message: 'Cannot find module' 
        }],
        typeErrors: [{ 
          file: 'types.ts', 
          severity: 'error', 
          message: 'Type error',
          rule: 'TS2322'
        }],
        lintErrors: [],
        testErrors: [],
        otherErrors: [],
      };

      const strategies = developFixStrategy(errors);

      expect(strategies[0].category).toBe('build');
      expect(strategies[0].priority).toBe(1);
      expect(strategies[1].category).toBe('type');
    });

    it('should identify common type error patterns', () => {
      const errors: WardErrorDetails = {
        typeErrors: [
          { file: 'a.ts', severity: 'error', message: 'Type mismatch', rule: 'TS2345' },
          { file: 'b.ts', severity: 'error', message: 'Type mismatch', rule: 'TS2345' },
          { file: 'c.ts', severity: 'error', message: 'Implicit any', rule: 'TS7006' },
        ],
        buildErrors: [],
        lintErrors: [],
        testErrors: [],
        otherErrors: [],
      };

      const strategies = developFixStrategy(errors);
      const typeStrategy = strategies.find(s => s.category === 'type');

      expect(typeStrategy?.patterns).toContainEqual(
        expect.objectContaining({
          errorPattern: /TS2345/,
          autoFixable: true,
        })
      );
    });

    it('should mark lint errors as auto-fixable', () => {
      const errors: WardErrorDetails = {
        lintErrors: [
          { file: 'app.ts', severity: 'error', message: 'Missing semicolon', rule: 'semi' },
          { file: 'app.ts', severity: 'error', message: 'Wrong quotes', rule: 'quotes' },
        ],
        buildErrors: [],
        typeErrors: [],
        testErrors: [],
        otherErrors: [],
      };

      const strategies = developFixStrategy(errors);
      const lintStrategy = strategies.find(s => s.category === 'lint');

      expect(lintStrategy?.patterns.every(p => p.autoFixable)).toBe(true);
      expect(lintStrategy?.patterns.every(p => p.confidence === 'high')).toBe(true);
    });
  });

  describe('groupSimilarErrors', () => {
    it('should group errors by rule and file', () => {
      const errors = [
        { file: 'app.ts', severity: 'error' as const, message: 'Error 1', rule: 'semi' },
        { file: 'app.ts', severity: 'error' as const, message: 'Error 2', rule: 'semi' },
        { file: 'util.ts', severity: 'error' as const, message: 'Error 3', rule: 'semi' },
        { file: 'app.ts', severity: 'error' as const, message: 'Error 4', rule: 'quotes' },
      ];

      const groups = groupSimilarErrors(errors);

      expect(groups.size).toBe(3);
      expect(groups.get('semi-app.ts')?.length).toBe(2);
      expect(groups.get('semi-util.ts')?.length).toBe(1);
      expect(groups.get('quotes-app.ts')?.length).toBe(1);
    });
  });
});
```

## Validation Criteria

1. **Retry Loop**
   - [ ] Attempts up to 3 times
   - [ ] Detects progress between attempts
   - [ ] Stops on success
   - [ ] Blocks quest after max attempts

2. **Error Detection**
   - [ ] Identifies unfixable errors
   - [ ] Provides fix suggestions
   - [ ] Analyzes error patterns
   - [ ] Groups similar errors

3. **Spiritmender Integration**
   - [ ] Passes error context
   - [ ] Includes previous attempts
   - [ ] Varies instructions by attempt
   - [ ] Handles blocked state

4. **Progress Tracking**
   - [ ] Records each attempt
   - [ ] Tracks fixes made
   - [ ] Monitors error reduction
   - [ ] Detects stuck state

5. **Failure Handling**
   - [ ] Saves unresolved errors
   - [ ] Provides manual fix guide
   - [ ] Blocks quest appropriately
   - [ ] Clear error messages

## Next Steps

After completing this task:
1. Test retry loop behavior
2. Verify error detection
3. Test progress tracking
4. Check failure scenarios
5. Proceed to [18-quest-completion.md](18-quest-completion.md)