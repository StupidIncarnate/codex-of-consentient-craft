import { ProjectBootstrapper } from '../utils/project-bootstrapper';
import { ClaudeE2ERunner } from '../utils/claude-runner';
import * as fs from 'fs';
import * as path from 'path';

jest.setTimeout(120000); // 2 minute timeout for agent tests

describe('Agent Orchestration', () => {
  const bootstrapper = new ProjectBootstrapper();
  let project;
  let runner;

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('spawns parallel Codeweavers for independent components', async () => {
    // TODO: Implement
  });

  test('respects component dependencies for Codeweaver spawning', async () => {
    // TODO: Implement
  });

  test('spawns Pathseeker for discovery phase', async () => {
    const questFile = {
      filename: 'need-discovery-20250104.json',
      data: {
        id: 'need-discovery-20250104',
        title: 'Create Calculator Functions',
        description: 'Build basic calculator functions',
        status: 'active',
        phases: {
          discovery: { status: 'not_started' },
          implementation: { status: 'not_started' }
        }
      }
    };
    
    project = await bootstrapper.createProjectWithQuests('simple', [questFile]);
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnMatch: 'Pathseeker'
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Pathseeker');
    expect(result.stdout).toContain('discovery');
  });

  test('spawns Lawbringer after all implementations complete', async () => {
    const questFile = {
      filename: 'ready-for-review-20250104.json',
      data: {
        id: 'ready-for-review-20250104',
        title: 'Review Calculator',
        status: 'active',
        phases: {
          discovery: { status: 'complete' },
          implementation: {
            status: 'complete',
            components: [
              { name: 'add.ts', status: 'complete' },
              { name: 'subtract.ts', status: 'complete' }
            ]
          },
          review: { status: 'not_started' }
        }
      }
    };
    
    project = await bootstrapper.createProjectWithQuests('simple', [questFile]);
    
    // Create dummy implementation files
    fs.writeFileSync(
      path.join(project.rootDir, 'src/add.ts'),
      'exports.add = (a, b) => a + b;'
    );
    fs.writeFileSync(
      path.join(project.rootDir, 'src/subtract.ts'),
      'exports.subtract = (a, b) => a - b;'
    );
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnMatch: 'Lawbringer'
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Lawbringer');
  });

  test('runs ward:all validation after testing', async () => {
    const questFile = {
      filename: 'ready-for-validation-20250104.json',
      data: {
        id: 'ready-for-validation-20250104',
        title: 'Validate Calculator',
        status: 'active',
        phases: {
          discovery: { status: 'complete' },
          implementation: { status: 'complete' },
          review: { status: 'complete' },
          testing: { status: 'complete' }
        }
      }
    };
    
    project = await bootstrapper.createProjectWithQuests('simple', [questFile]);
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnMatch: 'ward:all'
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('ward');
  });

  test('spawns Spiritmender on validation failure', async () => {
    const questFile = {
      filename: 'validation-failure-20250104.json',
      data: {
        id: 'validation-failure-20250104',
        title: 'Fix Failed Build',
        status: 'active',
        phases: {
          discovery: { status: 'complete' },
          implementation: { status: 'complete' },
          review: { status: 'complete' },
          testing: { status: 'complete' }
        }
      }
    };
    
    project = await bootstrapper.createProjectWithQuests('simple', [questFile]);
    
    // Create a file with intentional lint error
    fs.writeFileSync(
      path.join(project.rootDir, 'src/broken.ts'),
      'const x = 1\nconst x = 2 // duplicate declaration'
    );
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnMatch: 'Spiritmender',
        timeout: 180000 // 3 minutes - might need more time
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Spiritmender');
  });
});