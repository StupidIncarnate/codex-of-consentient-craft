import { ProjectBootstrapper } from '../utils/project-bootstrapper';
import { ClaudeE2ERunner } from '../utils/claude-runner';
import * as fs from 'fs';
import * as path from 'path';

jest.setTimeout(120000); // 2 minute timeout for integration tests

describe('Quest Phase Integration Tests', () => {
  const bootstrapper = new ProjectBootstrapper();
  let project;
  let runner;

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('spawns parallel Codeweavers for independent components', async () => {
    // Create quest ready for implementation
    const questFile = {
      filename: 'simple-functions-20250104.json',
      data: {
        id: 'simple-functions-20250104',
        title: 'Create Simple Functions',
        status: 'active',
        phases: {
          discovery: {
            status: 'complete',
            findings: {
              components: [
                { name: 'Create isEven.ts - returns true if number is even', dependencies: [] },
                { name: 'Create isOdd.ts - returns true if number is odd', dependencies: [] }
              ]
            }
          },
          implementation: {
            status: 'in_progress',
            components: [
              { name: 'Create isEven.ts - returns true if number is even', status: 'queued', dependencies: [] },
              { name: 'Create isOdd.ts - returns true if number is odd', status: 'queued', dependencies: [] }
            ]
          }
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
        killOnMatch: 'implementations complete' // Kill when we see this
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.killed).toBe(true);
    expect(result.matchFound).toBe(true);
    expect(result.stdout).toContain('Spawning');
    expect(result.stdout).toContain('Codeweaver');
    
    // Verify files were created
    expect(fs.existsSync(path.join(project.rootDir, 'src/isEven.ts'))).toBe(true);
    expect(fs.existsSync(path.join(project.rootDir, 'src/isOdd.ts'))).toBe(true);
  });

  test('spawns Lawbringer after implementations complete', async () => {
    // Create quest ready for review
    const questFile = {
      filename: 'ready-for-review-20250104.json',
      data: {
        id: 'ready-for-review-20250104',
        title: 'Review Simple Functions',
        status: 'active',
        phases: {
          discovery: { status: 'complete' },
          implementation: {
            status: 'complete',
            components: [
              { name: 'isEven.ts', status: 'complete', files: ['src/isEven.ts'] },
              { name: 'isOdd.ts', status: 'complete', files: ['src/isOdd.ts'] }
            ]
          },
          review: { status: 'not_started' }
        }
      }
    };

    // Create the implementation files
    project = await bootstrapper.createProjectWithQuests('simple', [questFile]);
    fs.writeFileSync(
      path.join(project.rootDir, 'src/isEven.ts'),
      'function isEven(n) { return n % 2 === 0; }\nmodule.exports = { isEven };'
    );
    fs.writeFileSync(
      path.join(project.rootDir, 'src/isOdd.ts'),
      'function isOdd(n) { return n % 2 !== 0; }\nmodule.exports = { isOdd };'
    );

    runner = new ClaudeE2ERunner(project.rootDir);

    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { 
        streaming: true,
        killOnMatch: 'Review complete' // Kill after Lawbringer finishes
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Lawbringer');
    expect(result.stdout).toContain('review');
  });

  test('handles quest with dependencies correctly', async () => {
    const questFile = {
      filename: 'with-dependencies-20250104.json',
      data: {
        id: 'with-dependencies-20250104',
        title: 'Functions with Dependencies',
        status: 'active',
        phases: {
          discovery: {
            status: 'complete',
            findings: {
              components: [
                { name: 'Create config.ts - configuration object', dependencies: [] },
                { name: 'Create logger.ts - uses config', dependencies: ['config.ts'] }
              ]
            }
          },
          implementation: {
            status: 'in_progress',
            components: [
              { name: 'Create config.ts - configuration object', status: 'queued', dependencies: [] },
              { name: 'Create logger.ts - uses config', status: 'queued', dependencies: ['config.ts'] }
            ]
          }
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
        killOnMatch: 'config.ts',
        timeout: 60000
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('Codeweaver');
    expect(result.stdout).toContain('config.ts');
    // Should NOT spawn logger.ts Codeweaver yet
    expect(result.stdout).not.toContain('logger.ts');
  });
});