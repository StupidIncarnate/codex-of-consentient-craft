# Task 22: Integration Tests

## Objective
Create end-to-end integration tests that validate complete quest flows and multi-agent interactions in realistic scenarios.

## Dependencies
- Task 21: Unit Tests (for test infrastructure)
- All implementation tasks (for full system testing)

## Implementation

### 1. Integration Test Framework

**File: src/test/integration/setup.ts**
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DIRECTORIES } from '../../cli/directory-manager';

const execAsync = promisify(exec);

export class IntegrationTestEnvironment {
  private testDir: string;
  private originalCwd: string;
  
  constructor(testName: string) {
    this.testDir = path.join(process.cwd(), '.test-runs', testName);
    this.originalCwd = process.cwd();
  }
  
  async setup(): Promise<void> {
    // Create isolated test environment
    await fs.mkdir(this.testDir, { recursive: true });
    
    // Create questmaestro directories
    await fs.mkdir(path.join(this.testDir, 'questmaestro'), { recursive: true });
    
    for (const dir of Object.values(DIRECTORIES)) {
      await fs.mkdir(path.join(this.testDir, dir), { recursive: true });
    }
    
    // Create test project structure
    await this.createTestProject();
    
    // Change to test directory
    process.chdir(this.testDir);
  }
  
  async teardown(): Promise<void> {
    // Return to original directory
    process.chdir(this.originalCwd);
    
    // Clean up test directory
    await fs.rm(this.testDir, { recursive: true, force: true });
  }
  
  private async createTestProject(): Promise<void> {
    // Create a minimal TypeScript project
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      scripts: {
        'lint': 'eslint src --ext .ts',
        'typecheck': 'tsc --noEmit',
        'test': 'jest',
        'ward:all': 'npm run lint && npm run typecheck && npm run test',
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        'typescript': '^5.0.0',
        'eslint': '^8.0.0',
        'jest': '^29.0.0',
        '@types/jest': '^29.0.0',
      },
    };
    
    await fs.writeFile(
      path.join(this.testDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    // Create tsconfig
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    };
    
    await fs.writeFile(
      path.join(this.testDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
    
    // Create .eslintrc
    const eslintConfig = {
      root: true,
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
      ],
    };
    
    await fs.writeFile(
      path.join(this.testDir, '.eslintrc.json'),
      JSON.stringify(eslintConfig, null, 2)
    );
    
    // Create src directory
    await fs.mkdir(path.join(this.testDir, 'src'), { recursive: true });
    
    // Create a simple source file
    await fs.writeFile(
      path.join(this.testDir, 'src', 'index.ts'),
      `export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
`
    );
    
    // Create .questmaestro config
    const questConfig = {
      version: '1.0.0',
      project: {
        type: 'npm',
        root: '.',
        wardCommands: {
          all: 'npm run ward:all',
          lint: 'npm run lint',
          typecheck: 'npm run typecheck',
          test: 'npm run test',
        },
      },
    };
    
    await fs.writeFile(
      path.join(this.testDir, '.questmaestro'),
      JSON.stringify(questConfig, null, 2)
    );
    
    // Create CLAUDE.md
    await fs.writeFile(
      path.join(this.testDir, 'CLAUDE.md'),
      `# Test Project

## Project Overview
This is a test project for Questmaestro integration testing.

## Key Design Decisions
- TypeScript for type safety
- Jest for testing
- ESLint for code quality

## Development Guidelines
Follow standard TypeScript best practices.

## Testing Strategy
All code should have corresponding tests.
`
    );
  }
  
  getTestDir(): string {
    return this.testDir;
  }
  
  async runCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    return execAsync(command, { cwd: this.testDir });
  }
}
```

### 2. Full Quest Flow Tests

**File: src/test/integration/quest-lifecycle.test.ts**
```typescript
import { IntegrationTestEnvironment } from './setup';
import { QuestmaestroAPI } from './api-wrapper';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Quest Lifecycle Integration', () => {
  let env: IntegrationTestEnvironment;
  let api: QuestmaestroAPI;
  
  beforeEach(async () => {
    env = new IntegrationTestEnvironment('quest-lifecycle');
    await env.setup();
    api = new QuestmaestroAPI(env);
  });
  
  afterEach(async () => {
    await env.teardown();
  });
  
  describe('Complete Quest Flow', () => {
    it('should create and execute a simple quest', async () => {
      // Create quest
      const questTitle = 'Add User Authentication';
      const quest = await api.createQuest({
        title: questTitle,
        description: 'Add basic user authentication with login and registration',
      });
      
      expect(quest.id).toBeDefined();
      expect(quest.status).toBe('pending');
      
      // Start quest execution
      await api.startQuest(quest.id);
      
      // Wait for discovery phase
      await api.waitForPhase(quest.id, 'discovery', 30000);
      
      // Verify Pathseeker created tasks
      const discoveryQuest = await api.getQuest(quest.id);
      expect(discoveryQuest.tasks.length).toBeGreaterThan(0);
      expect(discoveryQuest.phases.discovery.status).toBe('complete');
      
      // Continue to implementation
      await api.waitForPhase(quest.id, 'implementation', 60000);
      
      // Verify files were created
      const implementedQuest = await api.getQuest(quest.id);
      const createdFiles = implementedQuest.tasks
        .filter(t => t.status === 'complete')
        .flatMap(t => t.filesToCreate);
      
      for (const file of createdFiles) {
        const filePath = path.join(env.getTestDir(), file);
        await expect(fs.access(filePath)).resolves.not.toThrow();
      }
      
      // Wait for testing phase
      await api.waitForPhase(quest.id, 'testing', 30000);
      
      // Verify tests were created
      const testFiles = implementedQuest.tasks
        .filter(t => t.type === 'test' && t.status === 'complete')
        .flatMap(t => t.filesToCreate);
      
      expect(testFiles.length).toBeGreaterThan(0);
      
      // Wait for completion
      await api.waitForCompletion(quest.id, 120000);
      
      const completedQuest = await api.getQuest(quest.id);
      expect(completedQuest.status).toBe('complete');
      expect(completedQuest.completedAt).toBeDefined();
      
      // Verify retrospective was generated
      const retroFiles = await fs.readdir(
        path.join(env.getTestDir(), 'questmaestro/retros')
      );
      expect(retroFiles.length).toBeGreaterThan(0);
    });
    
    it('should handle quest with validation failures', async () => {
      // Create quest that will fail validation
      const quest = await api.createQuest({
        title: 'Add Broken Feature',
        description: 'Add a feature with intentional type errors',
      });
      
      // Inject broken code
      await fs.writeFile(
        path.join(env.getTestDir(), 'src', 'broken.ts'),
        `export function broken(x: string): number {
  return x; // Type error: string is not assignable to number
}
`
      );
      
      await api.startQuest(quest.id);
      
      // Wait for ward failure
      await api.waitForEvent(quest.id, 'ward-failed', 60000);
      
      // Verify Spiritmender was invoked
      await api.waitForEvent(quest.id, 'spiritmender-started', 30000);
      
      // Check if Spiritmender fixed the issue
      const events = await api.getQuestEvents(quest.id);
      const spiritMenderEvents = events.filter(e => e.agent === 'spiritmender');
      
      expect(spiritMenderEvents.length).toBeGreaterThan(0);
      
      // Verify quest can still complete (or gets blocked)
      await api.waitForStatus(quest.id, ['complete', 'blocked'], 120000);
    });
    
    it('should handle quest abandonment', async () => {
      const quest = await api.createQuest({
        title: 'Feature to Abandon',
        description: 'This quest will be abandoned',
      });
      
      await api.startQuest(quest.id);
      
      // Wait for discovery to complete
      await api.waitForPhase(quest.id, 'discovery', 30000);
      
      // Abandon quest
      await api.abandonQuest(quest.id, 'Requirements changed');
      
      const abandonedQuest = await api.getQuest(quest.id);
      expect(abandonedQuest.status).toBe('abandoned');
      expect(abandonedQuest.abandonReason).toBe('Requirements changed');
      
      // Verify quest moved to abandoned directory
      const abandonedPath = path.join(
        env.getTestDir(),
        'questmaestro/abandoned',
        quest.folder
      );
      await expect(fs.access(abandonedPath)).resolves.not.toThrow();
      
      // Verify abandonment report exists
      const reportPath = path.join(abandonedPath, `abandonment-${quest.id}.md`);
      await expect(fs.access(reportPath)).resolves.not.toThrow();
    });
  });
  
  describe('Multi-Quest Scenarios', () => {
    it('should handle multiple concurrent quests', async () => {
      // Create multiple quests
      const quests = await Promise.all([
        api.createQuest({ title: 'Quest 1', description: 'First concurrent quest' }),
        api.createQuest({ title: 'Quest 2', description: 'Second concurrent quest' }),
        api.createQuest({ title: 'Quest 3', description: 'Third concurrent quest' }),
      ]);
      
      // Start all quests
      await Promise.all(quests.map(q => api.startQuest(q.id)));
      
      // Wait for all to reach implementation
      await Promise.all(
        quests.map(q => api.waitForPhase(q.id, 'implementation', 60000))
      );
      
      // Verify no conflicts
      const activeQuests = await api.listQuests();
      expect(activeQuests.length).toBe(3);
      
      // Each should have unique folders
      const folders = activeQuests.map(q => q.folder);
      expect(new Set(folders).size).toBe(folders.length);
    });
    
    it('should enforce current quest limit', async () => {
      const quest1 = await api.createQuest({
        title: 'First Quest',
        description: 'First quest',
      });
      
      await api.setCurrentQuest(quest1.id);
      
      // Try to start another quest
      const quest2 = await api.createQuest({
        title: 'Second Quest',
        description: 'Should fail to start',
      });
      
      await expect(api.startQuest(quest2.id))
        .rejects.toThrow('Another quest is currently active');
    });
  });
});
```

### 3. Agent Integration Tests

**File: src/test/integration/agent-interactions.test.ts**
```typescript
import { IntegrationTestEnvironment } from './setup';
import { QuestmaestroAPI } from './api-wrapper';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Agent Interactions Integration', () => {
  let env: IntegrationTestEnvironment;
  let api: QuestmaestroAPI;
  
  beforeEach(async () => {
    env = new IntegrationTestEnvironment('agent-interactions');
    await env.setup();
    api = new QuestmaestroAPI(env);
  });
  
  afterEach(async () => {
    await env.teardown();
  });
  
  describe('Pathseeker Integration', () => {
    it('should analyze project and create appropriate tasks', async () => {
      // Add some existing code to analyze
      await fs.mkdir(path.join(env.getTestDir(), 'src/models'), { recursive: true });
      await fs.writeFile(
        path.join(env.getTestDir(), 'src/models/user.ts'),
        `export interface User {
  id: string;
  email: string;
  name: string;
}
`
      );
      
      const quest = await api.createQuest({
        title: 'Add User Profile Feature',
        description: 'Extend user model with profile information',
      });
      
      await api.startQuest(quest.id);
      await api.waitForPhase(quest.id, 'discovery', 30000);
      
      const discoveredQuest = await api.getQuest(quest.id);
      
      // Should recognize existing user model
      const tasks = discoveredQuest.tasks;
      expect(tasks.some(t => t.filesToEdit.includes('src/models/user.ts'))).toBe(true);
      
      // Should plan profile-related tasks
      expect(tasks.some(t => t.name.toLowerCase().includes('profile'))).toBe(true);
    });
  });
  
  describe('Codeweaver Integration', () => {
    it('should implement tasks respecting dependencies', async () => {
      const quest = await api.createQuest({
        title: 'Add API Endpoints',
        description: 'Create REST API with proper structure',
      });
      
      await api.startQuest(quest.id);
      await api.waitForPhase(quest.id, 'implementation', 60000);
      
      const implementedQuest = await api.getQuest(quest.id);
      
      // Verify dependency order was respected
      const completedTasks = implementedQuest.tasks.filter(t => t.status === 'complete');
      
      for (const task of completedTasks) {
        for (const depId of task.dependencies) {
          const depTask = implementedQuest.tasks.find(t => t.id === depId);
          expect(depTask?.status).toBe('complete');
        }
      }
    });
    
    it('should handle file conflicts gracefully', async () => {
      // Create existing file
      await fs.writeFile(
        path.join(env.getTestDir(), 'src/config.ts'),
        `export const config = { version: '1.0.0' };`
      );
      
      const quest = await api.createQuest({
        title: 'Update Configuration',
        description: 'Add new configuration options',
      });
      
      // Inject task that modifies existing file
      await api.injectTask(quest.id, {
        name: 'Update config',
        filesToEdit: ['src/config.ts'],
        description: 'Add new config options',
      });
      
      await api.startQuest(quest.id);
      await api.waitForPhase(quest.id, 'implementation', 60000);
      
      // Verify file was modified, not overwritten
      const content = await fs.readFile(
        path.join(env.getTestDir(), 'src/config.ts'),
        'utf-8'
      );
      
      expect(content).toContain('version: \'1.0.0\''); // Original content
      expect(content.length).toBeGreaterThan(40); // Should have additions
    });
  });
  
  describe('Ward and Spiritmender Integration', () => {
    it('should fix correctable validation errors', async () => {
      const quest = await api.createQuest({
        title: 'Add Feature with Lint Issues',
        description: 'Feature that needs formatting fixes',
      });
      
      // Create file with lint issues
      await fs.writeFile(
        path.join(env.getTestDir(), 'src/messy.ts'),
        `export function  messy( x:number,y:number ){
return x+y
}
`
      );
      
      await api.startQuest(quest.id);
      
      // Should trigger ward failure and Spiritmender
      const events = await api.waitForEvents(quest.id, [
        { type: 'ward-failed' },
        { type: 'spiritmender-started' },
        { type: 'ward-passed' },
      ], 90000);
      
      expect(events.length).toBe(3);
      
      // Check file was fixed
      const fixedContent = await fs.readFile(
        path.join(env.getTestDir(), 'src/messy.ts'),
        'utf-8'
      );
      
      // Should be properly formatted
      expect(fixedContent).toMatch(/export function messy\(x: number, y: number\)/);
      expect(fixedContent).toMatch(/return x \+ y;/);
    });
    
    it('should block on unfixable errors', async () => {
      // Remove required dependency
      const packageJson = JSON.parse(
        await fs.readFile(path.join(env.getTestDir(), 'package.json'), 'utf-8')
      );
      delete packageJson.devDependencies.typescript;
      await fs.writeFile(
        path.join(env.getTestDir(), 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      const quest = await api.createQuest({
        title: 'Add TypeScript Feature',
        description: 'This will fail due to missing TypeScript',
      });
      
      await api.startQuest(quest.id);
      
      // Should eventually block
      await api.waitForStatus(quest.id, ['blocked'], 120000);
      
      const blockedQuest = await api.getQuest(quest.id);
      expect(blockedQuest.blockReason).toContain('Missing npm dependencies');
    });
  });
});
```

### 4. Discovery Integration Tests

**File: src/test/integration/discovery-flow.test.ts**
```typescript
import { IntegrationTestEnvironment } from './setup';
import { QuestmaestroAPI } from './api-wrapper';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Discovery Flow Integration', () => {
  let env: IntegrationTestEnvironment;
  let api: QuestmaestroAPI;
  
  beforeEach(async () => {
    env = new IntegrationTestEnvironment('discovery-flow');
    await env.setup();
    api = new QuestmaestroAPI(env);
  });
  
  afterEach(async () => {
    await env.teardown();
  });
  
  describe('Auto-Discovery', () => {
    it('should auto-discover project on first run', async () => {
      // Remove .questmaestro to trigger discovery
      await fs.unlink(path.join(env.getTestDir(), '.questmaestro'));
      
      // First command should trigger discovery
      const result = await api.runCommand('list');
      
      expect(result).toContain('No .questmaestro file found');
      expect(result).toContain('Running project discovery');
      
      // Should create .questmaestro
      await expect(
        fs.access(path.join(env.getTestDir(), '.questmaestro'))
      ).resolves.not.toThrow();
      
      // Should detect ward commands
      const config = JSON.parse(
        await fs.readFile(path.join(env.getTestDir(), '.questmaestro'), 'utf-8')
      );
      
      expect(config.project.wardCommands.all).toBeDefined();
    });
    
    it('should validate and fix missing ward commands', async () => {
      // Remove ward:all from package.json
      const packageJson = JSON.parse(
        await fs.readFile(path.join(env.getTestDir(), 'package.json'), 'utf-8')
      );
      delete packageJson.scripts['ward:all'];
      await fs.writeFile(
        path.join(env.getTestDir(), 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      await api.runDiscovery();
      
      // Should add ward:all
      const fixedPackageJson = JSON.parse(
        await fs.readFile(path.join(env.getTestDir(), 'package.json'), 'utf-8')
      );
      
      expect(fixedPackageJson.scripts['ward:all']).toBeDefined();
      expect(fixedPackageJson.scripts['ward:all']).toContain('lint');
      expect(fixedPackageJson.scripts['ward:all']).toContain('typecheck');
      expect(fixedPackageJson.scripts['ward:all']).toContain('test');
    });
    
    it('should create CLAUDE.md if missing', async () => {
      await fs.unlink(path.join(env.getTestDir(), 'CLAUDE.md'));
      
      await api.runDiscovery();
      
      // Should create CLAUDE.md
      const claudePath = path.join(env.getTestDir(), 'CLAUDE.md');
      await expect(fs.access(claudePath)).resolves.not.toThrow();
      
      const content = await fs.readFile(claudePath, 'utf-8');
      expect(content).toContain('# test-project');
      expect(content).toContain('## Project Overview');
      expect(content).toContain('## Testing Strategy');
    });
  });
  
  describe('Monorepo Discovery', () => {
    beforeEach(async () => {
      // Create monorepo structure
      await fs.mkdir(path.join(env.getTestDir(), 'packages/app'), { recursive: true });
      await fs.mkdir(path.join(env.getTestDir(), 'packages/lib'), { recursive: true });
      
      // Root package.json with workspaces
      const rootPackage = {
        name: 'monorepo-root',
        private: true,
        workspaces: ['packages/*'],
        scripts: {
          'ward:all': 'npm run ward:all --workspaces',
        },
      };
      
      await fs.writeFile(
        path.join(env.getTestDir(), 'package.json'),
        JSON.stringify(rootPackage, null, 2)
      );
      
      // App package
      const appPackage = {
        name: '@monorepo/app',
        version: '1.0.0',
        scripts: {
          'lint': 'eslint .',
          'test': 'jest',
          'ward:all': 'npm run lint && npm run test',
        },
      };
      
      await fs.writeFile(
        path.join(env.getTestDir(), 'packages/app/package.json'),
        JSON.stringify(appPackage, null, 2)
      );
      
      // Lib package
      const libPackage = {
        name: '@monorepo/lib',
        version: '1.0.0',
        scripts: {
          'typecheck': 'tsc',
          'test': 'jest',
          'ward:all': 'npm run typecheck && npm run test',
        },
      };
      
      await fs.writeFile(
        path.join(env.getTestDir(), 'packages/lib/package.json'),
        JSON.stringify(libPackage, null, 2)
      );
    });
    
    it('should discover all packages in monorepo', async () => {
      await api.runDiscovery();
      
      const config = JSON.parse(
        await fs.readFile(path.join(env.getTestDir(), '.questmaestro'), 'utf-8')
      );
      
      expect(config.packages).toHaveLength(3); // root + 2 packages
      expect(config.packages.map(p => p.name)).toContain('@monorepo/app');
      expect(config.packages.map(p => p.name)).toContain('@monorepo/lib');
    });
    
    it('should handle package-specific ward commands', async () => {
      await api.runDiscovery();
      
      const quest = await api.createQuest({
        title: 'Update Library',
        description: 'Make changes to the lib package',
        package: '@monorepo/lib',
      });
      
      await api.startQuest(quest.id);
      
      // Should use lib-specific ward commands
      const events = await api.getQuestEvents(quest.id);
      const wardEvents = events.filter(e => e.type === 'ward-run');
      
      expect(wardEvents.some(e => e.command.includes('typecheck'))).toBe(true);
    });
  });
});
```

### 5. API Wrapper for Testing

**File: src/test/integration/api-wrapper.ts**
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Quest } from '../../cli/types/quest';

const execAsync = promisify(exec);

export class QuestmaestroAPI {
  constructor(private env: IntegrationTestEnvironment) {}
  
  async runCommand(command: string): Promise<string> {
    const { stdout, stderr } = await execAsync(`questmaestro ${command}`, {
      cwd: this.env.getTestDir(),
    });
    return stdout + stderr;
  }
  
  async createQuest(options: {
    title: string;
    description: string;
    package?: string;
  }): Promise<Quest> {
    const result = await this.runCommand(
      `create "${options.title}" --description "${options.description}"${
        options.package ? ` --package ${options.package}` : ''
      }`
    );
    
    // Parse quest ID from output
    const match = result.match(/Created quest: (\d+-[\w-]+)/);
    if (!match) throw new Error('Failed to create quest');
    
    const questFolder = match[1];
    return this.loadQuest(questFolder);
  }
  
  async startQuest(questId: string): Promise<void> {
    const quest = await this.getQuestById(questId);
    await this.runCommand(`start ${quest.folder}`);
  }
  
  async abandonQuest(questId: string, reason: string): Promise<void> {
    const quest = await this.getQuestById(questId);
    await this.runCommand(`abandon ${quest.folder} --reason "${reason}"`);
  }
  
  async setCurrentQuest(questId: string): Promise<void> {
    const quest = await this.getQuestById(questId);
    await this.runCommand(`start ${quest.folder}`);
  }
  
  async getQuest(questId: string): Promise<Quest> {
    return this.getQuestById(questId);
  }
  
  async listQuests(): Promise<Quest[]> {
    const activeDir = path.join(
      this.env.getTestDir(),
      'questmaestro/active'
    );
    
    const folders = await fs.readdir(activeDir);
    const quests: Quest[] = [];
    
    for (const folder of folders) {
      try {
        const quest = await this.loadQuest(folder);
        quests.push(quest);
      } catch {
        // Skip invalid folders
      }
    }
    
    return quests;
  }
  
  async waitForPhase(
    questId: string,
    phase: string,
    timeout: number
  ): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      const quest = await this.getQuest(questId);
      
      if (quest.phases[phase]?.status === 'complete') {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Timeout waiting for phase ${phase}`);
  }
  
  async waitForStatus(
    questId: string,
    statuses: string[],
    timeout: number
  ): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      const quest = await this.getQuest(questId);
      
      if (statuses.includes(quest.status)) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Timeout waiting for status ${statuses.join(' or ')}`);
  }
  
  async waitForCompletion(questId: string, timeout: number): Promise<void> {
    return this.waitForStatus(questId, ['complete'], timeout);
  }
  
  async waitForEvent(
    questId: string,
    eventType: string,
    timeout: number
  ): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      const events = await this.getQuestEvents(questId);
      
      if (events.some(e => e.type === eventType)) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    throw new Error(`Timeout waiting for event ${eventType}`);
  }
  
  async waitForEvents(
    questId: string,
    expectedEvents: Array<{ type: string }>,
    timeout: number
  ): Promise<any[]> {
    const start = Date.now();
    const foundEvents: any[] = [];
    
    while (Date.now() - start < timeout && foundEvents.length < expectedEvents.length) {
      const events = await this.getQuestEvents(questId);
      
      for (const expected of expectedEvents) {
        if (!foundEvents.find(e => e.type === expected.type)) {
          const event = events.find(e => e.type === expected.type);
          if (event) {
            foundEvents.push(event);
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (foundEvents.length < expectedEvents.length) {
      throw new Error('Timeout waiting for all events');
    }
    
    return foundEvents;
  }
  
  async getQuestEvents(questId: string): Promise<any[]> {
    const quest = await this.getQuest(questId);
    return quest.executionLog || [];
  }
  
  async runDiscovery(): Promise<void> {
    await this.runCommand('discover');
  }
  
  async injectTask(questId: string, task: any): Promise<void> {
    const quest = await this.getQuest(questId);
    quest.tasks.push({
      id: `injected-${Date.now()}`,
      status: 'queued',
      addedBy: 'test',
      filesToCreate: [],
      filesToEdit: [],
      dependencies: [],
      ...task,
    });
    
    await this.saveQuest(quest);
  }
  
  private async loadQuest(folder: string): Promise<Quest> {
    const questPath = path.join(
      this.env.getTestDir(),
      'questmaestro/active',
      folder,
      'quest.json'
    );
    
    const content = await fs.readFile(questPath, 'utf-8');
    return JSON.parse(content);
  }
  
  private async saveQuest(quest: Quest): Promise<void> {
    const questPath = path.join(
      this.env.getTestDir(),
      'questmaestro/active',
      quest.folder,
      'quest.json'
    );
    
    await fs.writeFile(questPath, JSON.stringify(quest, null, 2));
  }
  
  private async getQuestById(questId: string): Promise<Quest> {
    const quests = await this.listQuests();
    const quest = quests.find(q => q.id === questId);
    
    if (!quest) {
      throw new Error(`Quest ${questId} not found`);
    }
    
    return quest;
  }
}
```

## Unit Tests

The integration tests themselves serve as validation. Additional meta-tests:

**File: src/test/integration/test-environment.test.ts**
```typescript
import { IntegrationTestEnvironment } from './setup';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Integration Test Environment', () => {
  let env: IntegrationTestEnvironment;
  
  afterEach(async () => {
    if (env) {
      await env.teardown();
    }
  });
  
  it('should create isolated test environment', async () => {
    env = new IntegrationTestEnvironment('env-test');
    await env.setup();
    
    const testDir = env.getTestDir();
    
    // Verify directories exist
    await expect(fs.access(testDir)).resolves.not.toThrow();
    await expect(
      fs.access(path.join(testDir, 'questmaestro'))
    ).resolves.not.toThrow();
    
    // Verify test project files
    await expect(
      fs.access(path.join(testDir, 'package.json'))
    ).resolves.not.toThrow();
    await expect(
      fs.access(path.join(testDir, 'tsconfig.json'))
    ).resolves.not.toThrow();
    await expect(
      fs.access(path.join(testDir, '.questmaestro'))
    ).resolves.not.toThrow();
  });
  
  it('should clean up after tests', async () => {
    env = new IntegrationTestEnvironment('cleanup-test');
    await env.setup();
    
    const testDir = env.getTestDir();
    await env.teardown();
    
    // Directory should be gone
    await expect(fs.access(testDir)).rejects.toThrow();
  });
});
```

## Validation Criteria

1. **Test Coverage**
   - [ ] Complete quest lifecycle
   - [ ] Multi-agent interactions
   - [ ] Error scenarios
   - [ ] Recovery mechanisms

2. **Scenario Coverage**
   - [ ] Simple quests
   - [ ] Complex dependencies
   - [ ] Validation failures
   - [ ] Concurrent quests

3. **Environment Testing**
   - [ ] Isolated environments
   - [ ] Proper cleanup
   - [ ] No side effects
   - [ ] Repeatable results

4. **Integration Points**
   - [ ] Agent communication
   - [ ] File system operations
   - [ ] Ward validation
   - [ ] Quest state management

5. **Performance**
   - [ ] Reasonable timeouts
   - [ ] Parallel test execution
   - [ ] Resource cleanup
   - [ ] No test pollution

## Next Steps

After completing this task:
1. Run integration test suite
2. Verify all scenarios pass
3. Check for flaky tests
4. Optimize test performance
5. Proceed to [23-validation-checklist.md](23-validation-checklist.md)