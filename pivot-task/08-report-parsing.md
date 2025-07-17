# Task 08: Report Parsing

## Objective
Create report parsing and validation system for agent JSON reports with agent-specific handlers.

## Dependencies
- Task 07: Agent Spawning (for report types)
- Task 04: Quest Model (for task types)

## Implementation

### 1. Report Parser

**File: src/cli/report-parser.ts**
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { AgentReport, AgentType } from './types/agent';
import { Task } from './types/quest';
import { getQuestPath } from './directory-manager';

/**
 * Parses an agent report from file
 */
export async function parseReportFile(questFolder: string, reportFilename: string): Promise<AgentReport> {
  const reportPath = path.join(getQuestPath(questFolder), reportFilename);
  
  try {
    const content = await fs.readFile(reportPath, 'utf-8');
    const report = JSON.parse(content) as AgentReport;
    
    // Validate required fields
    validateReport(report);
    
    return report;
  } catch (error) {
    throw new Error(`Failed to parse report ${reportFilename}: ${error.message}`);
  }
}

/**
 * Validates an agent report structure
 */
export function validateReport(report: any): void {
  if (!report || typeof report !== 'object') {
    throw new Error('Report must be an object');
  }
  
  if (!report.status || !['complete', 'blocked', 'error'].includes(report.status)) {
    throw new Error('Report must have valid status: complete, blocked, or error');
  }
  
  if (!report.agentType) {
    throw new Error('Report must specify agentType');
  }
  
  if (report.status === 'blocked' && !report.blockReason) {
    throw new Error('Blocked report must include blockReason');
  }
  
  if (!report.report || typeof report.report !== 'object') {
    throw new Error('Report must include report object');
  }
}

/**
 * Parses a Pathseeker report
 */
export function parsePathseekerReport(report: AgentReport): PathseekerReport {
  const data = report.report;
  
  if (data.validationResult) {
    // Resume validation mode
    return {
      type: 'validation',
      validationResult: data.validationResult,
      currentTasksReview: data.currentTasksReview || {},
      newTasks: parseTasks(data.newTasks || []),
      modifiedDependencies: data.modifiedDependencies || {},
      obsoleteTasks: data.obsoleteTasks || [],
      keyDecisions: data.keyDecisions || [],
    };
  } else if (data.questDetails) {
    // Initial discovery mode
    return {
      type: 'discovery',
      questDetails: data.questDetails,
      discoveryFindings: data.discoveryFindings,
      tasks: parseTasks(data.tasks || []),
      keyDecisions: data.keyDecisions || [],
    };
  } else {
    throw new Error('Invalid Pathseeker report format');
  }
}

/**
 * Parses a Codeweaver report
 */
export function parseCodeweaverReport(report: AgentReport): CodeweaverReport {
  const data = report.report;
  
  return {
    quest: data.quest,
    component: data.component,
    filesCreated: data.filesCreated || [],
    filesModified: data.filesModified || [],
    implementationSummary: data.implementationSummary,
    technicalDecisions: data.technicalDecisions || [],
    integrationPoints: data.integrationPoints || [],
  };
}

/**
 * Parses a Siegemaster report
 */
export function parseSiegemasterReport(report: AgentReport): SiegemasterReport {
  const data = report.report;
  
  return {
    testCoverage: data.testCoverage,
    gaps: data.gaps || [],
    recommendations: data.recommendations || [],
    existingTests: data.existingTests || [],
  };
}

/**
 * Parses a Lawbringer report
 */
export function parseLawbringerReport(report: AgentReport): LawbringerReport {
  const data = report.report;
  
  return {
    standardsReview: data.standardsReview,
    violations: data.violations || [],
    fixes: data.fixes || [],
    wardResults: data.wardResults,
  };
}

/**
 * Parses a Spiritmender report
 */
export function parseSpiritMenderReport(report: AgentReport): SpiritmenderReport {
  const data = report.report;
  
  return {
    errors: data.errors || [],
    fixes: data.fixes || [],
    remainingIssues: data.remainingIssues || [],
    wardResults: data.wardResults,
  };
}

/**
 * Parses tasks from report data
 */
function parseTasks(tasksData: any[]): Task[] {
  return tasksData.map(taskData => ({
    id: taskData.id || taskData.name.toLowerCase().replace(/\s+/g, '-'),
    name: taskData.name,
    type: taskData.type || 'implementation',
    status: 'queued',
    description: taskData.description,
    dependencies: taskData.dependencies || [],
    filesToCreate: taskData.filesToCreate || [],
    filesToEdit: taskData.filesToEdit || [],
    addedBy: '', // Will be set by caller
    testTechnology: taskData.testTechnology,
    runBefore: taskData.runBefore,
  }));
}

// Report type definitions

export interface PathseekerReport {
  type: 'discovery' | 'validation';
  questDetails?: {
    id: string;
    title: string;
    description: string;
    scope: string;
    estimatedTasks: number;
  };
  discoveryFindings?: {
    existing_code: string[];
    patterns_found: string[];
    related_tests: string[];
    dependencies: string[];
  };
  tasks?: Task[];
  validationResult?: 'CONTINUE' | 'EXTEND' | 'REPLAN';
  currentTasksReview?: Record<string, any>;
  newTasks?: Task[];
  modifiedDependencies?: Record<string, any>;
  obsoleteTasks?: string[];
  keyDecisions: Array<{
    category: string;
    decision: string;
  }>;
}

export interface CodeweaverReport {
  quest: string;
  component: string;
  filesCreated: string[];
  filesModified: string[];
  implementationSummary: string;
  technicalDecisions: string[];
  integrationPoints: string[];
}

export interface SiegemasterReport {
  testCoverage: {
    overall: number;
    byFile: Record<string, number>;
  };
  gaps: Array<{
    file: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
  existingTests: string[];
}

export interface LawbringerReport {
  standardsReview: {
    passed: boolean;
    score: number;
  };
  violations: Array<{
    file: string;
    line?: number;
    rule: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
  }>;
  fixes: Array<{
    file: string;
    description: string;
  }>;
  wardResults: any;
}

export interface SpiritmenderReport {
  errors: Array<{
    type: string;
    file: string;
    message: string;
  }>;
  fixes: Array<{
    file: string;
    description: string;
    changes: string;
  }>;
  remainingIssues: string[];
  wardResults: any;
}
```

### 2. Report Validator

**File: src/cli/report-validator.ts**
```typescript
import { AgentReport, AgentType } from './types/agent';
import { Task } from './types/quest';

/**
 * Validates agent-specific report content
 */
export function validateAgentReport(report: AgentReport): void {
  const validator = reportValidators[report.agentType];
  
  if (!validator) {
    throw new Error(`No validator for agent type: ${report.agentType}`);
  }
  
  validator(report.report);
}

const reportValidators: Record<AgentType, (data: any) => void> = {
  pathseeker: validatePathseekerReport,
  codeweaver: validateCodeweaverReport,
  siegemaster: validateSiegemasterReport,
  lawbringer: validateLawbringerReport,
  spiritmender: validateSpiritmenderReport,
  voidpoker: validateVoidpokerReport,
};

function validatePathseekerReport(data: any): void {
  if (data.validationResult) {
    // Validation mode
    if (!['CONTINUE', 'EXTEND', 'REPLAN'].includes(data.validationResult)) {
      throw new Error('Invalid validationResult');
    }
  } else if (data.questDetails) {
    // Discovery mode
    if (!data.questDetails.title) {
      throw new Error('questDetails must include title');
    }
    if (!Array.isArray(data.tasks)) {
      throw new Error('tasks must be an array');
    }
    validateTasks(data.tasks);
  } else {
    throw new Error('Pathseeker report must include either questDetails or validationResult');
  }
}

function validateCodeweaverReport(data: any): void {
  if (!data.component) {
    throw new Error('Codeweaver report must include component');
  }
  if (!Array.isArray(data.filesCreated) && !Array.isArray(data.filesModified)) {
    throw new Error('Codeweaver report must include filesCreated or filesModified');
  }
}

function validateSiegemasterReport(data: any): void {
  if (!data.testCoverage) {
    throw new Error('Siegemaster report must include testCoverage');
  }
  if (!Array.isArray(data.gaps)) {
    throw new Error('Siegemaster report must include gaps array');
  }
}

function validateLawbringerReport(data: any): void {
  if (!data.standardsReview) {
    throw new Error('Lawbringer report must include standardsReview');
  }
  if (!Array.isArray(data.violations)) {
    throw new Error('Lawbringer report must include violations array');
  }
}

function validateSpiritmenderReport(data: any): void {
  if (!Array.isArray(data.errors)) {
    throw new Error('Spiritmender report must include errors array');
  }
  if (!Array.isArray(data.fixes)) {
    throw new Error('Spiritmender report must include fixes array');
  }
}

function validateVoidpokerReport(data: any): void {
  if (!data.projectAnalysis) {
    throw new Error('Voidpoker report must include projectAnalysis');
  }
}

function validateTasks(tasks: any[]): void {
  for (const task of tasks) {
    if (!task.name) {
      throw new Error('Task must have name');
    }
    if (!task.description) {
      throw new Error('Task must have description');
    }
    if (!Array.isArray(task.dependencies)) {
      throw new Error('Task dependencies must be an array');
    }
    if (!Array.isArray(task.filesToCreate)) {
      throw new Error('Task filesToCreate must be an array');
    }
    if (!Array.isArray(task.filesToEdit)) {
      throw new Error('Task filesToEdit must be an array');
    }
  }
}
```

### 3. Report Aggregator

**File: src/cli/report-aggregator.ts**
```typescript
import * as path from 'path';
import { getQuestPath, getQuestReports } from './directory-manager';
import { parseReportFile } from './report-parser';
import { AgentReport, RetrospectiveNote } from './types/agent';

/**
 * Gets all reports for a quest
 */
export async function getQuestReportSummaries(questFolder: string): Promise<ReportSummary[]> {
  const reportFiles = await getQuestReports(questFolder);
  const summaries: ReportSummary[] = [];
  
  for (const reportFile of reportFiles) {
    try {
      const report = await parseReportFile(questFolder, reportFile);
      summaries.push({
        filename: reportFile,
        agentType: report.agentType,
        status: report.status,
        timestamp: extractTimestampFromFilename(reportFile),
        taskId: report.taskId,
      });
    } catch (error) {
      console.warn(`Failed to parse report ${reportFile}:`, error);
    }
  }
  
  return summaries.sort((a, b) => a.filename.localeCompare(b.filename));
}

/**
 * Collects all retrospective notes from quest reports
 */
export async function collectRetrospectiveNotes(questFolder: string): Promise<GroupedRetrospectives> {
  const reportFiles = await getQuestReports(questFolder);
  const grouped: GroupedRetrospectives = {
    byAgent: {},
    byCategory: {},
    all: [],
  };
  
  for (const reportFile of reportFiles) {
    try {
      const report = await parseReportFile(questFolder, reportFile);
      
      if (report.retrospectiveNotes && report.retrospectiveNotes.length > 0) {
        // Group by agent
        if (!grouped.byAgent[report.agentType]) {
          grouped.byAgent[report.agentType] = [];
        }
        grouped.byAgent[report.agentType].push(...report.retrospectiveNotes);
        
        // Group by category
        for (const note of report.retrospectiveNotes) {
          if (!grouped.byCategory[note.category]) {
            grouped.byCategory[note.category] = [];
          }
          grouped.byCategory[note.category].push({
            ...note,
            agent: report.agentType,
            report: reportFile,
          });
        }
        
        // Add to all
        grouped.all.push(...report.retrospectiveNotes.map(note => ({
          ...note,
          agent: report.agentType,
          report: reportFile,
        })));
      }
    } catch (error) {
      console.warn(`Failed to collect retrospectives from ${reportFile}:`, error);
    }
  }
  
  return grouped;
}

/**
 * Gets the latest report of a specific type
 */
export async function getLatestReport(
  questFolder: string, 
  agentType: string
): Promise<AgentReport | null> {
  const reportFiles = await getQuestReports(questFolder);
  
  // Filter by agent type and sort by filename (which includes number)
  const agentReports = reportFiles
    .filter(f => f.includes(`-${agentType}-report.json`))
    .sort((a, b) => b.localeCompare(a)); // Reverse sort for latest first
  
  if (agentReports.length === 0) {
    return null;
  }
  
  return parseReportFile(questFolder, agentReports[0]);
}

/**
 * Counts reports by agent type
 */
export async function countReportsByAgent(questFolder: string): Promise<Record<string, number>> {
  const reportFiles = await getQuestReports(questFolder);
  const counts: Record<string, number> = {};
  
  for (const reportFile of reportFiles) {
    const agentType = extractAgentTypeFromFilename(reportFile);
    if (agentType) {
      counts[agentType] = (counts[agentType] || 0) + 1;
    }
  }
  
  return counts;
}

// Helper functions

function extractTimestampFromFilename(filename: string): string {
  // Reports are numbered sequentially, use that for ordering
  const match = filename.match(/^(\d{3})-/);
  return match ? match[1] : '000';
}

function extractAgentTypeFromFilename(filename: string): string | null {
  const match = filename.match(/^\d{3}-(\w+)-report\.json$/);
  return match ? match[1] : null;
}

// Type definitions

export interface ReportSummary {
  filename: string;
  agentType: string;
  status: string;
  timestamp: string;
  taskId?: string;
}

export interface GroupedRetrospectives {
  byAgent: Record<string, RetrospectiveNote[]>;
  byCategory: Record<string, AnnotatedRetrospectiveNote[]>;
  all: AnnotatedRetrospectiveNote[];
}

export interface AnnotatedRetrospectiveNote extends RetrospectiveNote {
  agent: string;
  report: string;
}
```

## Unit Tests

**File: src/cli/report-parser.test.ts**
```typescript
import * as fs from 'fs/promises';
import { 
  parseReportFile, 
  validateReport, 
  parsePathseekerReport,
  parseCodeweaverReport 
} from './report-parser';
import { AgentReport } from './types/agent';

jest.mock('fs/promises');
jest.mock('./directory-manager', () => ({
  getQuestPath: (folder: string) => `/questmaestro/active/${folder}`,
}));

describe('ReportParser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseReportFile', () => {
    it('should parse valid JSON report', async () => {
      const mockReport: AgentReport = {
        status: 'complete',
        agentType: 'pathseeker',
        report: {
          questDetails: { title: 'Test Quest' },
          tasks: [],
        },
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockReport));

      const report = await parseReportFile('01-test', '001-pathseeker-report.json');

      expect(report.status).toBe('complete');
      expect(report.agentType).toBe('pathseeker');
    });

    it('should throw on invalid JSON', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue('{ invalid json');

      await expect(parseReportFile('01-test', 'report.json'))
        .rejects.toThrow('Failed to parse report');
    });

    it('should throw on missing file', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      await expect(parseReportFile('01-test', 'missing.json'))
        .rejects.toThrow('Failed to parse report');
    });
  });

  describe('validateReport', () => {
    it('should validate complete report', () => {
      const report = {
        status: 'complete',
        agentType: 'codeweaver',
        report: { component: 'Test' },
      };

      expect(() => validateReport(report)).not.toThrow();
    });

    it('should throw on missing status', () => {
      const report = {
        agentType: 'codeweaver',
        report: {},
      };

      expect(() => validateReport(report)).toThrow('valid status');
    });

    it('should throw on blocked without reason', () => {
      const report = {
        status: 'blocked',
        agentType: 'pathseeker',
        report: {},
      };

      expect(() => validateReport(report)).toThrow('blockReason');
    });

    it('should throw on missing report object', () => {
      const report = {
        status: 'complete',
        agentType: 'codeweaver',
      };

      expect(() => validateReport(report)).toThrow('report object');
    });
  });

  describe('parsePathseekerReport', () => {
    it('should parse discovery report', () => {
      const report: AgentReport = {
        status: 'complete',
        agentType: 'pathseeker',
        report: {
          questDetails: {
            title: 'Test Quest',
            description: 'Test',
            scope: 'medium',
            estimatedTasks: 5,
          },
          discoveryFindings: {
            existing_code: ['app.ts'],
            patterns_found: ['Express'],
            related_tests: ['app.test.ts'],
            dependencies: ['express'],
          },
          tasks: [
            {
              name: 'CreateAuth',
              description: 'Create auth',
              dependencies: [],
              filesToCreate: ['auth.ts'],
              filesToEdit: [],
            },
          ],
          keyDecisions: [],
        },
      };

      const parsed = parsePathseekerReport(report);

      expect(parsed.type).toBe('discovery');
      expect(parsed.questDetails?.title).toBe('Test Quest');
      expect(parsed.tasks).toHaveLength(1);
      expect(parsed.tasks![0].name).toBe('CreateAuth');
    });

    it('should parse validation report', () => {
      const report: AgentReport = {
        status: 'complete',
        agentType: 'pathseeker',
        report: {
          validationResult: 'EXTEND',
          currentTasksReview: {},
          newTasks: [],
          modifiedDependencies: {},
          obsoleteTasks: [],
          keyDecisions: [],
        },
      };

      const parsed = parsePathseekerReport(report);

      expect(parsed.type).toBe('validation');
      expect(parsed.validationResult).toBe('EXTEND');
    });
  });

  describe('parseCodeweaverReport', () => {
    it('should parse implementation report', () => {
      const report: AgentReport = {
        status: 'complete',
        agentType: 'codeweaver',
        report: {
          quest: 'Test Quest',
          component: 'CreateAuth',
          filesCreated: ['auth.ts', 'auth.test.ts'],
          filesModified: ['index.ts'],
          implementationSummary: 'Created auth system',
          technicalDecisions: ['Used JWT'],
          integrationPoints: ['Express middleware'],
        },
      };

      const parsed = parseCodeweaverReport(report);

      expect(parsed.component).toBe('CreateAuth');
      expect(parsed.filesCreated).toHaveLength(2);
      expect(parsed.filesModified).toHaveLength(1);
    });
  });
});
```

**File: src/cli/report-validator.test.ts**
```typescript
import { validateAgentReport } from './report-validator';
import { AgentReport } from './types/agent';

describe('ReportValidator', () => {
  describe('validateAgentReport', () => {
    it('should validate pathseeker discovery report', () => {
      const report: AgentReport = {
        status: 'complete',
        agentType: 'pathseeker',
        report: {
          questDetails: { title: 'Test' },
          tasks: [
            {
              name: 'Task1',
              description: 'Test task',
              dependencies: [],
              filesToCreate: [],
              filesToEdit: [],
            },
          ],
        },
      };

      expect(() => validateAgentReport(report)).not.toThrow();
    });

    it('should throw on invalid pathseeker report', () => {
      const report: AgentReport = {
        status: 'complete',
        agentType: 'pathseeker',
        report: {
          // Missing both questDetails and validationResult
        },
      };

      expect(() => validateAgentReport(report))
        .toThrow('questDetails or validationResult');
    });

    it('should validate codeweaver report', () => {
      const report: AgentReport = {
        status: 'complete',
        agentType: 'codeweaver',
        report: {
          component: 'Auth',
          filesCreated: ['auth.ts'],
        },
      };

      expect(() => validateAgentReport(report)).not.toThrow();
    });

    it('should throw on invalid task structure', () => {
      const report: AgentReport = {
        status: 'complete',
        agentType: 'pathseeker',
        report: {
          questDetails: { title: 'Test' },
          tasks: [
            {
              // Missing required fields
              name: 'Task1',
            },
          ],
        },
      };

      expect(() => validateAgentReport(report))
        .toThrow('Task must have description');
    });
  });
});
```

## Validation Criteria

1. **Report Parsing**
   - [ ] Parses JSON reports from files
   - [ ] Validates report structure
   - [ ] Handles corrupt/missing files
   - [ ] Preserves all report data

2. **Agent-Specific Parsing**
   - [ ] Parses Pathseeker discovery/validation
   - [ ] Parses Codeweaver implementation
   - [ ] Parses Siegemaster test gaps
   - [ ] Parses Lawbringer standards
   - [ ] Parses Spiritmender fixes

3. **Validation**
   - [ ] Validates required fields
   - [ ] Validates agent-specific content
   - [ ] Validates task structure
   - [ ] Provides clear error messages

4. **Aggregation**
   - [ ] Collects all quest reports
   - [ ] Groups retrospective notes
   - [ ] Counts reports by agent
   - [ ] Finds latest reports

5. **Error Handling**
   - [ ] Handles missing reports gracefully
   - [ ] Validates data integrity
   - [ ] Logs parsing warnings
   - [ ] Continues on individual failures

## Next Steps

After completing this task:
1. Run `npm test` to verify all tests pass
2. Test report parsing with sample JSON
3. Verify validation catches errors
4. Test aggregation functions
5. Proceed to [09-agent-recovery.md](09-agent-recovery.md)