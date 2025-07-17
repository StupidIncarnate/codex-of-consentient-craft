# Task 12: Codeweaver Updates

## Objective
Simplify Codeweaver to focus on single task implementation with clear file operations and ward validation integration.

## Dependencies
- Task 10: Agent Prompts (for output format)
- Task 04: Quest Model (for task structure)

## Implementation

### 1. Codeweaver Task Handler

**File: src/cli/codeweaver/task-handler.ts**
```typescript
import { Task } from '../types/quest';
import { CodeweaverReport } from '../report-parser';

export interface CodeweaverContext {
  questTitle: string;
  task: Task;
  wardCommands?: {
    all?: string;
    lint?: string;
    typecheck?: string;
    test?: string;
  };
  recoveryMode?: boolean;
  existingWork?: {
    filesCreated: string[];
    filesModified: string[];
    summary: string;
  };
}

/**
 * Formats task instructions for Codeweaver
 */
export function formatTaskInstructions(context: CodeweaverContext): string {
  const { task, recoveryMode, existingWork } = context;
  
  let instructions = `## Task: ${task.name}

**Description**: ${task.description}

**Files to Create**:
${task.filesToCreate.map(f => `- ${f}`).join('\n') || '(none)'}

**Files to Edit**:
${task.filesToEdit.map(f => `- ${f}`).join('\n') || '(none)'}

**Dependencies**: ${task.dependencies.join(', ') || '(none)'}
`;

  if (recoveryMode && existingWork) {
    instructions += `
## Recovery Mode

Previous work was interrupted. Here's what was already done:

${existingWork.summary}

**Already Created**: ${existingWork.filesCreated.join(', ') || '(none)'}
**Already Modified**: ${existingWork.filesModified.join(', ') || '(none)'}

Please complete the remaining work for this task.
`;
  }

  instructions += `
## Implementation Guidelines

1. Focus on implementing ONLY this specific task
2. Create all files listed in "Files to Create"
3. Edit all files listed in "Files to Edit"
4. Ensure the implementation is complete and working
5. Follow existing code patterns in the project
6. Add appropriate error handling
7. Include inline documentation

## Ward Validation

After implementation, the system will run ward validation:
${context.wardCommands?.all || 'npm run ward:all'}

Your code must pass:
- Linting (${context.wardCommands?.lint || 'included in ward:all'})
- Type checking (${context.wardCommands?.typecheck || 'included in ward:all'})
- Tests (${context.wardCommands?.test || 'included in ward:all'})

If you create test files, ensure they pass.
`;

  return instructions;
}

/**
 * Validates Codeweaver can handle the task
 */
export function validateTaskForCodeweaver(task: Task): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check task type
  if (task.type !== 'implementation') {
    issues.push(`Codeweaver only handles implementation tasks, got: ${task.type}`);
  }
  
  // Check for file operations
  if (!task.filesToCreate.length && !task.filesToEdit.length) {
    issues.push('Task must specify files to create or edit');
  }
  
  // Check for overly complex tasks
  const totalFiles = task.filesToCreate.length + task.filesToEdit.length;
  if (totalFiles > 10) {
    issues.push(`Task touches too many files (${totalFiles}). Consider breaking it down.`);
  }
  
  // Warn about test files in implementation task
  const testFiles = [...task.filesToCreate, ...task.filesToEdit]
    .filter(f => f.includes('.test.') || f.includes('.spec.'));
  
  if (testFiles.length > 0 && testFiles.length !== task.filesToCreate.length) {
    issues.push('Mix of test and implementation files. Consider separate tasks.');
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Extracts file operations from Codeweaver report
 */
export function extractFileOperations(report: CodeweaverReport): {
  created: string[];
  modified: string[];
  summary: string;
} {
  return {
    created: report.filesCreated || [],
    modified: report.filesModified || [],
    summary: report.implementationSummary || 'No summary provided',
  };
}

/**
 * Checks if task is complete based on report
 */
export function isTaskComplete(task: Task, report: CodeweaverReport): boolean {
  const expectedFiles = new Set(task.filesToCreate);
  const createdFiles = new Set(report.filesCreated || []);
  
  // All expected files should be created
  for (const expected of expectedFiles) {
    if (!createdFiles.has(expected)) {
      return false;
    }
  }
  
  // All files to edit should be in modified list
  const modifiedFiles = new Set(report.filesModified || []);
  for (const toEdit of task.filesToEdit) {
    if (!modifiedFiles.has(toEdit)) {
      return false;
    }
  }
  
  return true;
}
```

### 2. Codeweaver Simplification Guide

**File: src/cli/docs/codeweaver-simplification.md**
```markdown
# Codeweaver Simplification Guide

## Overview

Codeweaver is being simplified from a complex multi-gate system to a focused single-task implementation agent.

## Key Changes

### 1. Remove Gate System

OLD:
```
[GATE 1: Requirements Analysis]
[GATE 2: Implementation Planning]
[GATE 3: Code Generation]
[GATE 4: Validation]
```

NEW:
- Direct implementation based on task specification
- No gates, just implement the task completely

### 2. Single Task Focus

OLD:
- Could handle multiple components in one run
- Complex batching logic
- Progress tracking across components

NEW:
- One Codeweaver instance = One task
- Complete the entire task before finishing
- No progress files or partial completion

### 3. Clear File Operations

Report must clearly distinguish:
```json
{
  "filesCreated": [
    "src/auth/auth-service.ts",
    "src/auth/auth-service.test.ts"
  ],
  "filesModified": [
    "src/index.ts",  // Added export
    "src/types/index.ts"  // Added auth types export
  ]
}
```

### 4. Task Structure

Codeweaver receives:
```json
{
  "id": "create-auth-service",
  "name": "CreateAuthService",
  "type": "implementation",
  "description": "Create authentication service with JWT handling",
  "dependencies": ["create-auth-interface"],
  "filesToCreate": [
    "src/auth/auth-service.ts",
    "src/auth/auth-service.test.ts"
  ],
  "filesToEdit": [
    "src/index.ts"
  ]
}
```

### 5. Recovery Mode

When in recovery mode:
- Check what was already done
- Complete remaining work
- Don't duplicate existing code
- Report both previous and new work

### 6. Ward Integration

After implementation:
1. System runs ward:all
2. If validation fails, Spiritmender is spawned
3. Codeweaver marks task complete only if ward passes

## Implementation Checklist

For each task, Codeweaver must:
- [ ] Create ALL files in filesToCreate
- [ ] Edit ALL files in filesToEdit
- [ ] Ensure code compiles (TypeScript)
- [ ] Ensure code follows project patterns
- [ ] Add appropriate error handling
- [ ] Include inline documentation
- [ ] Create working tests (if test files included)

## Common Patterns

### Service Implementation
```typescript
// auth-service.ts
export class AuthService {
  constructor(private config: AuthConfig) {}
  
  async generateToken(user: User): Promise<string> {
    // Implementation
  }
  
  async verifyToken(token: string): Promise<TokenPayload> {
    // Implementation
  }
}

// auth-service.test.ts
describe('AuthService', () => {
  let service: AuthService;
  
  beforeEach(() => {
    service = new AuthService(mockConfig);
  });
  
  describe('generateToken', () => {
    it('should generate valid JWT token', async () => {
      // Test implementation
    });
  });
});
```

### Interface/Type Implementation
```typescript
// types/auth.ts
export interface User {
  id: string;
  email: string;
  roles: Role[];
}

export interface AuthConfig {
  jwtSecret: string;
  expiresIn: string;
}

export type Role = 'admin' | 'user' | 'guest';
```

### Middleware Implementation
```typescript
// auth-middleware.ts
export function authMiddleware(config: AuthConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractToken(req);
      const payload = await verifyToken(token, config);
      req.user = payload;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };
}
```

## Error Handling

Always include proper error handling:

```typescript
// Bad
async function doSomething() {
  const result = await riskyOperation();
  return result;
}

// Good
async function doSomething() {
  try {
    const result = await riskyOperation();
    return result;
  } catch (error) {
    logger.error('Operation failed:', error);
    throw new OperationError('Failed to complete operation', { cause: error });
  }
}
```

## Testing Requirements

When creating test files:
1. Test all public methods/functions
2. Include error cases
3. Use appropriate mocking
4. Follow project test patterns
5. Ensure tests actually run and pass
```

### 3. Codeweaver Validator

**File: src/cli/codeweaver/validator.ts**
```typescript
import { Task } from '../types/quest';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Validates files were created/modified as expected
 */
export async function validateFileOperations(
  task: Task,
  reportedFiles: {
    created: string[];
    modified: string[];
  }
): Promise<{
  valid: boolean;
  missing: string[];
  unexpected: string[];
}> {
  const missing: string[] = [];
  const unexpected: string[] = [];
  
  // Check expected files were created
  for (const file of task.filesToCreate) {
    if (!reportedFiles.created.includes(file)) {
      // Double-check file actually exists
      try {
        await fs.access(file);
        // File exists but wasn't reported as created
        unexpected.push(`${file} exists but not reported as created`);
      } catch {
        // File doesn't exist
        missing.push(`Expected to create: ${file}`);
      }
    }
  }
  
  // Check expected files were modified
  for (const file of task.filesToEdit) {
    if (!reportedFiles.modified.includes(file)) {
      missing.push(`Expected to modify: ${file}`);
    }
  }
  
  // Check for unexpected file operations
  for (const file of reportedFiles.created) {
    if (!task.filesToCreate.includes(file)) {
      unexpected.push(`Unexpectedly created: ${file}`);
    }
  }
  
  for (const file of reportedFiles.modified) {
    if (!task.filesToEdit.includes(file)) {
      // It's OK if a created file is also reported as modified
      if (!task.filesToCreate.includes(file)) {
        unexpected.push(`Unexpectedly modified: ${file}`);
      }
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    unexpected,
  };
}

/**
 * Checks if created files have content
 */
export async function validateFileContent(files: string[]): Promise<{
  valid: boolean;
  emptyFiles: string[];
  errors: string[];
}> {
  const emptyFiles: string[] = [];
  const errors: string[] = [];
  
  for (const file of files) {
    try {
      const stats = await fs.stat(file);
      if (stats.size === 0) {
        emptyFiles.push(file);
      }
      
      // For TypeScript files, check for basic syntax
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = await fs.readFile(file, 'utf-8');
        if (!content.trim()) {
          emptyFiles.push(file);
        }
        
        // Basic syntax checks
        if (content.includes('// TODO: Implement')) {
          errors.push(`${file} contains unimplemented TODOs`);
        }
        
        if (content.includes('throw new Error("Not implemented")')) {
          errors.push(`${file} contains unimplemented methods`);
        }
      }
    } catch (error) {
      errors.push(`Cannot read ${file}: ${error.message}`);
    }
  }
  
  return {
    valid: emptyFiles.length === 0 && errors.length === 0,
    emptyFiles,
    errors,
  };
}
```

## Unit Tests

**File: src/cli/codeweaver/task-handler.test.ts**
```typescript
import { 
  formatTaskInstructions, 
  validateTaskForCodeweaver,
  isTaskComplete 
} from './task-handler';
import { Task } from '../types/quest';

describe('CodeweaverTaskHandler', () => {
  const mockTask: Task = {
    id: 'create-auth',
    name: 'CreateAuth',
    type: 'implementation',
    status: 'queued',
    description: 'Create auth system',
    dependencies: ['create-types'],
    filesToCreate: ['auth.ts'],
    filesToEdit: ['index.ts'],
    addedBy: 'pathseeker',
  };

  describe('formatTaskInstructions', () => {
    it('should format basic task instructions', () => {
      const instructions = formatTaskInstructions({
        questTitle: 'Add Authentication',
        task: mockTask,
      });

      expect(instructions).toContain('Task: CreateAuth');
      expect(instructions).toContain('Create auth system');
      expect(instructions).toContain('- auth.ts');
      expect(instructions).toContain('- index.ts');
    });

    it('should include recovery information', () => {
      const instructions = formatTaskInstructions({
        questTitle: 'Add Authentication',
        task: mockTask,
        recoveryMode: true,
        existingWork: {
          filesCreated: ['auth.ts'],
          filesModified: [],
          summary: 'Partial auth implementation',
        },
      });

      expect(instructions).toContain('Recovery Mode');
      expect(instructions).toContain('Partial auth implementation');
      expect(instructions).toContain('Already Created: auth.ts');
    });

    it('should include ward commands', () => {
      const instructions = formatTaskInstructions({
        questTitle: 'Add Authentication',
        task: mockTask,
        wardCommands: {
          all: 'npm run ward:all',
          lint: 'npm run lint',
        },
      });

      expect(instructions).toContain('npm run ward:all');
      expect(instructions).toContain('npm run lint');
    });
  });

  describe('validateTaskForCodeweaver', () => {
    it('should validate implementation task', () => {
      const result = validateTaskForCodeweaver(mockTask);

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should reject non-implementation tasks', () => {
      const testTask = { ...mockTask, type: 'testing' as const };
      const result = validateTaskForCodeweaver(testTask);

      expect(result.valid).toBe(false);
      expect(result.issues[0]).toContain('only handles implementation');
    });

    it('should reject tasks with no files', () => {
      const emptyTask = { 
        ...mockTask, 
        filesToCreate: [], 
        filesToEdit: [] 
      };
      const result = validateTaskForCodeweaver(emptyTask);

      expect(result.valid).toBe(false);
      expect(result.issues[0]).toContain('must specify files');
    });

    it('should warn about too many files', () => {
      const bigTask = {
        ...mockTask,
        filesToCreate: Array(8).fill('file.ts'),
        filesToEdit: Array(5).fill('edit.ts'),
      };
      const result = validateTaskForCodeweaver(bigTask);

      expect(result.valid).toBe(false);
      expect(result.issues[0]).toContain('too many files');
    });
  });

  describe('isTaskComplete', () => {
    it('should return true when all files handled', () => {
      const report = {
        filesCreated: ['auth.ts'],
        filesModified: ['index.ts'],
        quest: '',
        component: '',
        implementationSummary: '',
        technicalDecisions: [],
        integrationPoints: [],
      };

      expect(isTaskComplete(mockTask, report)).toBe(true);
    });

    it('should return false when files missing', () => {
      const report = {
        filesCreated: [],
        filesModified: ['index.ts'],
        quest: '',
        component: '',
        implementationSummary: '',
        technicalDecisions: [],
        integrationPoints: [],
      };

      expect(isTaskComplete(mockTask, report)).toBe(false);
    });
  });
});
```

**File: src/cli/codeweaver/validator.test.ts**
```typescript
import * as fs from 'fs/promises';
import { validateFileOperations, validateFileContent } from './validator';
import { Task } from '../types/quest';

jest.mock('fs/promises');

describe('CodeweaverValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateFileOperations', () => {
    const task: Task = {
      id: 'test',
      name: 'Test',
      type: 'implementation',
      status: 'queued',
      description: '',
      dependencies: [],
      filesToCreate: ['new.ts'],
      filesToEdit: ['existing.ts'],
      addedBy: '',
    };

    it('should validate correct operations', async () => {
      const result = await validateFileOperations(task, {
        created: ['new.ts'],
        modified: ['existing.ts'],
      });

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
      expect(result.unexpected).toHaveLength(0);
    });

    it('should detect missing files', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('Not found'));

      const result = await validateFileOperations(task, {
        created: [],
        modified: ['existing.ts'],
      });

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('Expected to create: new.ts');
    });

    it('should detect unexpected files', async () => {
      const result = await validateFileOperations(task, {
        created: ['new.ts', 'unexpected.ts'],
        modified: ['existing.ts'],
      });

      expect(result.unexpected).toContain('Unexpectedly created: unexpected.ts');
    });
  });

  describe('validateFileContent', () => {
    it('should detect empty files', async () => {
      (fs.stat as jest.Mock).mockResolvedValue({ size: 0 });

      const result = await validateFileContent(['empty.ts']);

      expect(result.valid).toBe(false);
      expect(result.emptyFiles).toContain('empty.ts');
    });

    it('should detect unimplemented code', async () => {
      (fs.stat as jest.Mock).mockResolvedValue({ size: 100 });
      (fs.readFile as jest.Mock).mockResolvedValue(
        '// TODO: Implement\nthrow new Error("Not implemented");'
      );

      const result = await validateFileContent(['incomplete.ts']);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('unimplemented TODOs');
      expect(result.errors[1]).toContain('unimplemented methods');
    });

    it('should pass valid files', async () => {
      (fs.stat as jest.Mock).mockResolvedValue({ size: 100 });
      (fs.readFile as jest.Mock).mockResolvedValue(
        'export function doSomething() { return 42; }'
      );

      const result = await validateFileContent(['valid.ts']);

      expect(result.valid).toBe(true);
      expect(result.emptyFiles).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });
});
```

## Validation Criteria

1. **Single Task Focus**
   - [ ] Handles one task per instance
   - [ ] Completes entire task
   - [ ] No partial completion
   - [ ] Clear task boundaries

2. **File Operations**
   - [ ] Creates all required files
   - [ ] Edits all specified files
   - [ ] Reports operations accurately
   - [ ] Validates file content

3. **Recovery Mode**
   - [ ] Detects existing work
   - [ ] Continues from partial state
   - [ ] Doesn't duplicate work
   - [ ] Reports all operations

4. **Ward Integration**
   - [ ] Code passes linting
   - [ ] Code passes type checking
   - [ ] Tests run successfully
   - [ ] Handles validation failures

5. **Code Quality**
   - [ ] Follows project patterns
   - [ ] Includes error handling
   - [ ] Has inline documentation
   - [ ] No TODO placeholders

## Next Steps

After completing this task:
1. Update Codeweaver agent file
2. Test single task implementation
3. Test recovery scenarios
4. Verify ward integration
5. Proceed to [13-other-agents.md](13-other-agents.md)