# Task 11: Pathseeker Updates

## Objective
Convert Pathseeker from component-based output to task-based output with proper dependency management and interactive Q&A.

## Dependencies
- Task 10: Agent Prompts (for output format)
- Task 04: Quest Model (for task types)

## Implementation

### 1. Pathseeker Task Converter

**File: src/cli/pathseeker/task-converter.ts**
```typescript
import { Task } from '../types/quest';

export interface PathseekerComponent {
  name: string;
  type: string;
  description: string;
  dependencies?: string[];
  filesToCreate?: string[];
  filesToEdit?: string[];
  testFiles?: string[];
  testingNotes?: string;
}

/**
 * Converts Pathseeker components to tasks
 */
export function convertComponentsToTasks(components: PathseekerComponent[]): Task[] {
  const tasks: Task[] = [];
  
  for (const component of components) {
    // Create implementation task
    if (component.filesToCreate?.length || component.filesToEdit?.length) {
      tasks.push({
        id: generateTaskId(component.name),
        name: component.name,
        type: 'implementation',
        status: 'queued',
        description: component.description,
        dependencies: convertDependencies(component.dependencies || [], components),
        filesToCreate: component.filesToCreate || [],
        filesToEdit: component.filesToEdit || [],
        addedBy: '', // Will be set by caller
      });
    }
    
    // Create testing task if needed
    if (component.testFiles?.length || component.testingNotes) {
      const testTask: Task = {
        id: generateTaskId(`Test${component.name}`),
        name: `Test${component.name}`,
        type: 'testing',
        status: 'queued',
        description: `Tests for ${component.name}: ${component.testingNotes || 'Unit tests'}`,
        dependencies: [generateTaskId(component.name)], // Depends on implementation
        filesToCreate: component.testFiles || [],
        filesToEdit: [],
        addedBy: '', // Will be set by caller
        testTechnology: detectTestTechnology(component.testFiles),
      };
      
      // If the component has dependencies, test might need their tests too
      if (component.dependencies?.length) {
        for (const dep of component.dependencies) {
          const testDepId = generateTaskId(`Test${dep}`);
          if (components.some(c => c.name === dep && (c.testFiles?.length || c.testingNotes))) {
            testTask.dependencies.push(testDepId);
          }
        }
      }
      
      tasks.push(testTask);
    }
  }
  
  return tasks;
}

/**
 * Generates a task ID from component name
 */
function generateTaskId(name: string): string {
  return name
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
    .replace(/\s+/g, '-');
}

/**
 * Converts component dependencies to task IDs
 */
function convertDependencies(
  dependencies: string[], 
  allComponents: PathseekerComponent[]
): string[] {
  return dependencies
    .filter(dep => allComponents.some(c => c.name === dep))
    .map(dep => generateTaskId(dep));
}

/**
 * Detects test technology from test file names
 */
function detectTestTechnology(testFiles?: string[]): string {
  if (!testFiles || testFiles.length === 0) return 'jest';
  
  const firstFile = testFiles[0].toLowerCase();
  
  if (firstFile.includes('.spec.')) return 'jest';
  if (firstFile.includes('.test.')) return 'jest';
  if (firstFile.includes('.e2e.')) return 'playwright';
  if (firstFile.includes('.integration.')) return 'supertest';
  
  return 'jest'; // Default
}

/**
 * Validates task dependencies
 */
export function validateTaskDependencies(tasks: Task[]): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const taskIds = new Set(tasks.map(t => t.id));
  
  // Check all dependencies exist
  for (const task of tasks) {
    for (const dep of task.dependencies) {
      if (!taskIds.has(dep)) {
        issues.push(`Task "${task.name}" depends on non-existent task "${dep}"`);
      }
    }
  }
  
  // Check for circular dependencies
  const visited = new Set<string>();
  const visiting = new Set<string>();
  
  function hasCycle(taskId: string, path: string[] = []): boolean {
    if (visiting.has(taskId)) {
      const cycleStart = path.indexOf(taskId);
      const cycle = path.slice(cycleStart).concat(taskId);
      issues.push(`Circular dependency: ${cycle.join(' → ')}`);
      return true;
    }
    
    if (visited.has(taskId)) return false;
    
    visiting.add(taskId);
    path.push(taskId);
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      for (const dep of task.dependencies) {
        if (taskIds.has(dep)) {
          hasCycle(dep, [...path]);
        }
      }
    }
    
    visiting.delete(taskId);
    visited.add(taskId);
    return false;
  }
  
  // Check all tasks
  for (const task of tasks) {
    if (!visited.has(task.id)) {
      hasCycle(task.id);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}
```

### 2. Pathseeker Mode Handler

**File: src/cli/pathseeker/mode-handler.ts**
```typescript
import { Task } from '../types/quest';

export type PathseekerMode = 'creation' | 'validation' | 'dependency_repair' | 'recovery_assessment';

export interface PathseekerModeContext {
  mode: PathseekerMode;
  existingTasks?: Task[];
  dependencyIssues?: string[];
  originalTask?: Task;
}

/**
 * Generates mode-specific instructions for Pathseeker
 */
export function getModeInstructions(context: PathseekerModeContext): string {
  switch (context.mode) {
    case 'creation':
      return `Please analyze this request and create a comprehensive task list.
      
Important requirements:
- Output a "tasks" array, not components
- Each task should be atomic and focused
- Include clear dependencies between tasks
- Specify files to create and edit
- Separate implementation from testing tasks`;

    case 'validation':
      return `Please validate if this quest is still relevant and the tasks are still valid.

Current tasks:
${JSON.stringify(context.existingTasks, null, 2)}

Analyze:
1. Are the existing tasks still appropriate?
2. Are there any missing tasks?
3. Do any tasks need updated dependencies?
4. Has the codebase changed in ways that affect the tasks?

Return validationResult: CONTINUE (no changes), EXTEND (add tasks), or REPLAN (major changes)`;

    case 'dependency_repair':
      return `The task dependencies have issues that need fixing.

Issues found:
${context.dependencyIssues?.join('\n')}

Current tasks:
${JSON.stringify(context.existingTasks, null, 2)}

Please:
1. Analyze the dependency issues
2. Propose a corrected task list with proper dependencies
3. Ensure no circular dependencies
4. Maintain logical task ordering`;

    case 'recovery_assessment':
      return `Assess the current state of an incomplete task.

Task being assessed:
${JSON.stringify(context.originalTask, null, 2)}

Please check:
1. What files were actually created?
2. What files were modified?
3. Is the implementation complete, partial, or not started?
4. What work remains to be done?

Return taskAssessment with status: complete, partial, or not_started`;

    default:
      return 'Analyze the request and provide appropriate output.';
  }
}

/**
 * Handles task modification during validation
 */
export function applyTaskModifications(
  existingTasks: Task[],
  modifications: any
): Task[] {
  const tasks = [...existingTasks];
  
  // Add new tasks
  if (modifications.newTasks) {
    for (const newTask of modifications.newTasks) {
      // Ensure it doesn't already exist
      if (!tasks.some(t => t.id === newTask.id)) {
        tasks.push({
          ...newTask,
          status: 'queued',
          addedBy: 'pathseeker-validation',
        });
      }
    }
  }
  
  // Modify dependencies
  if (modifications.modifiedDependencies) {
    for (const [taskId, mods] of Object.entries(modifications.modifiedDependencies)) {
      const task = tasks.find(t => t.id === taskId);
      if (task && mods.addDependencies) {
        task.dependencies = [...new Set([
          ...task.dependencies,
          ...mods.addDependencies,
        ])];
      }
      if (task && mods.removeDependencies) {
        task.dependencies = task.dependencies.filter(
          dep => !mods.removeDependencies.includes(dep)
        );
      }
    }
  }
  
  // Mark obsolete tasks
  if (modifications.obsoleteTasks) {
    for (const taskId of modifications.obsoleteTasks) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        task.status = 'skipped';
      }
    }
  }
  
  return tasks;
}
```

### 3. Pathseeker Prompt Updates

**File: src/cli/docs/pathseeker-prompt-updates.md**
```markdown
# Pathseeker Prompt Updates

## Key Changes

### 1. Replace Component System with Task System

OLD:
```typescript
components: [
  {
    name: "AuthService",
    type: "service",
    dependencies: ["AuthInterface"],
    // ...
  }
]
```

NEW:
```typescript
tasks: [
  {
    name: "CreateAuthService",
    type: "implementation",
    description: "Create authentication service with JWT handling",
    dependencies: ["create-auth-interface"],
    filesToCreate: ["src/auth/auth-service.ts"],
    filesToEdit: [],
  },
  {
    name: "TestAuthService", 
    type: "testing",
    description: "Unit tests for auth service",
    dependencies: ["create-auth-service"],
    filesToCreate: ["src/auth/auth-service.test.ts"],
    filesToEdit: [],
    testTechnology: "jest"
  }
]
```

### 2. Remove INSUFFICIENT_CONTEXT Status

OLD:
```javascript
if (needMoreInfo) {
  return { status: "INSUFFICIENT_CONTEXT", questions: [...] };
}
```

NEW:
```javascript
// Ask questions interactively within the agent
const answer = await askUser("What authentication method do you prefer? (JWT/OAuth/Session)");
// Continue with the answer
```

### 3. Task Naming Convention

Tasks should be named as actions:
- ✅ CreateAuthInterface
- ✅ ImplementUserLogin  
- ✅ AddRateLimiting
- ❌ AuthInterface
- ❌ UserLogin
- ❌ RateLimiter

### 4. Dependency Format

Dependencies use kebab-case task IDs:
- Task name: CreateAuthInterface
- Task ID: create-auth-interface
- Dependency reference: ["create-auth-interface"]

### 5. Validation Mode

When in validation mode, Pathseeker can:
- **CONTINUE**: No changes needed
- **EXTEND**: Add new tasks, modify dependencies
- **REPLAN**: Complete restructure needed

Example EXTEND response:
```json
{
  "validationResult": "EXTEND",
  "currentTasksReview": {
    "create-auth-interface": { "status": "complete", "stillValid": true },
    "create-auth-service": { "status": "queued", "needsNewDependencies": ["add-rate-limiting"] }
  },
  "newTasks": [{
    "name": "AddRateLimiting",
    "type": "implementation",
    "dependencies": ["create-redis-client"],
    "runBefore": ["create-auth-service"]
  }],
  "modifiedDependencies": {
    "create-auth-service": { "addDependencies": ["add-rate-limiting"] }
  }
}
```

### 6. Key Decision Categories

Pathseeker should document key decisions:
- **architecture**: Overall design patterns
- **testing_approach**: Test strategy
- **data_storage**: Database/cache choices
- **security**: Security measures
- **error_handling**: Error strategies
- **integration**: How components connect

## Testing the Updates

1. Test task generation from a simple request
2. Test dependency ordering is logical
3. Test validation mode with existing tasks
4. Test dependency repair functionality
5. Test interactive Q&A flow
```

## Unit Tests

**File: src/cli/pathseeker/task-converter.test.ts**
```typescript
import { convertComponentsToTasks, validateTaskDependencies } from './task-converter';
import { PathseekerComponent } from './task-converter';

describe('TaskConverter', () => {
  describe('convertComponentsToTasks', () => {
    it('should convert simple component to task', () => {
      const components: PathseekerComponent[] = [{
        name: 'AuthService',
        type: 'service',
        description: 'Authentication service',
        filesToCreate: ['auth.ts'],
      }];

      const tasks = convertComponentsToTasks(components);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe('auth-service');
      expect(tasks[0].name).toBe('AuthService');
      expect(tasks[0].type).toBe('implementation');
      expect(tasks[0].filesToCreate).toEqual(['auth.ts']);
    });

    it('should create separate test task', () => {
      const components: PathseekerComponent[] = [{
        name: 'AuthService',
        type: 'service',
        description: 'Authentication service',
        filesToCreate: ['auth.ts'],
        testFiles: ['auth.test.ts'],
        testingNotes: 'Test JWT generation',
      }];

      const tasks = convertComponentsToTasks(components);

      expect(tasks).toHaveLength(2);
      expect(tasks[1].name).toBe('TestAuthService');
      expect(tasks[1].type).toBe('testing');
      expect(tasks[1].dependencies).toEqual(['auth-service']);
      expect(tasks[1].description).toContain('Test JWT generation');
    });

    it('should handle component dependencies', () => {
      const components: PathseekerComponent[] = [
        {
          name: 'AuthInterface',
          type: 'interface',
          description: 'Auth types',
          filesToCreate: ['types.ts'],
        },
        {
          name: 'AuthService',
          type: 'service',
          description: 'Auth service',
          dependencies: ['AuthInterface'],
          filesToCreate: ['auth.ts'],
        },
      ];

      const tasks = convertComponentsToTasks(components);

      const authService = tasks.find(t => t.name === 'AuthService');
      expect(authService?.dependencies).toEqual(['auth-interface']);
    });

    it('should detect test technology', () => {
      const components: PathseekerComponent[] = [{
        name: 'AuthAPI',
        type: 'api',
        description: 'Auth endpoints',
        filesToCreate: ['auth-api.ts'],
        testFiles: ['auth-api.e2e.ts'],
      }];

      const tasks = convertComponentsToTasks(components);

      const testTask = tasks.find(t => t.type === 'testing');
      expect(testTask?.testTechnology).toBe('playwright');
    });
  });

  describe('validateTaskDependencies', () => {
    it('should validate valid dependencies', () => {
      const tasks = [
        {
          id: 'task-1',
          name: 'Task1',
          type: 'implementation' as const,
          status: 'queued' as const,
          description: '',
          dependencies: [],
          filesToCreate: [],
          filesToEdit: [],
          addedBy: '',
        },
        {
          id: 'task-2',
          name: 'Task2',
          type: 'implementation' as const,
          status: 'queued' as const,
          description: '',
          dependencies: ['task-1'],
          filesToCreate: [],
          filesToEdit: [],
          addedBy: '',
        },
      ];

      const result = validateTaskDependencies(tasks);

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect missing dependencies', () => {
      const tasks = [{
        id: 'task-1',
        name: 'Task1',
        type: 'implementation' as const,
        status: 'queued' as const,
        description: '',
        dependencies: ['task-missing'],
        filesToCreate: [],
        filesToEdit: [],
        addedBy: '',
      }];

      const result = validateTaskDependencies(tasks);

      expect(result.valid).toBe(false);
      expect(result.issues[0]).toContain('non-existent task');
    });

    it('should detect circular dependencies', () => {
      const tasks = [
        {
          id: 'task-1',
          name: 'Task1',
          type: 'implementation' as const,
          status: 'queued' as const,
          description: '',
          dependencies: ['task-2'],
          filesToCreate: [],
          filesToEdit: [],
          addedBy: '',
        },
        {
          id: 'task-2',
          name: 'Task2',
          type: 'implementation' as const,
          status: 'queued' as const,
          description: '',
          dependencies: ['task-1'],
          filesToCreate: [],
          filesToEdit: [],
          addedBy: '',
        },
      ];

      const result = validateTaskDependencies(tasks);

      expect(result.valid).toBe(false);
      expect(result.issues[0]).toContain('Circular dependency');
    });
  });
});
```

## Validation Criteria

1. **Task Generation**
   - [ ] Converts components to tasks
   - [ ] Generates proper task IDs
   - [ ] Separates implementation and testing
   - [ ] Maintains dependencies

2. **Interactive Q&A**
   - [ ] No INSUFFICIENT_CONTEXT status
   - [ ] Questions asked within agent
   - [ ] Continues after answers

3. **Validation Mode**
   - [ ] CONTINUE for no changes
   - [ ] EXTEND for additions
   - [ ] REPLAN for major changes
   - [ ] Modifies dependencies correctly

4. **Dependency Management**
   - [ ] Validates all dependencies exist
   - [ ] Detects circular dependencies
   - [ ] Maintains execution order
   - [ ] Handles runBefore constraints

5. **Output Format**
   - [ ] Outputs tasks array
   - [ ] Includes all required fields
   - [ ] Uses proper task types
   - [ ] Documents key decisions

## Next Steps

After completing this task:
1. Update Pathseeker agent file
2. Test task generation
3. Test validation modes
4. Verify dependency handling
5. Proceed to [12-codeweaver-updates.md](12-codeweaver-updates.md)