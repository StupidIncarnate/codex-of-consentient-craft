import { ProjectBootstrapper } from '../utils/project-bootstrapper';
import { ClaudeE2ERunner } from '../utils/claude-runner';
import * as fs from 'fs';
import * as path from 'path';

jest.setTimeout(60000); // 1 minute timeout

describe('Quest Configuration', () => {
  const bootstrapper = new ProjectBootstrapper();
  let project;
  let runner;

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('should use default quest folder when .questmaestro missing', async () => {
    project = await bootstrapper.createSimpleProject('quest-config-default');
    runner = new ClaudeE2ERunner(project.rootDir);
    
    // Remove .questmaestro if it exists
    const configPath = path.join(project.rootDir, '.questmaestro');
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    
    const result = await runner.executeCommand(
      '/questmaestro',
      'list',
      { killOnPostAction: true } // Kill when we see [🎁] (quest status displayed)
    );
    
    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(project.rootDir, 'questmaestro'))).toBe(true);
  });

  test('should read custom quest folder from .questmaestro config', async () => {
    project = await bootstrapper.createSimpleProject('quest-config-custom');
    
    // Create custom config
    const config = { questFolder: 'my-quests' };
    fs.writeFileSync(
      path.join(project.rootDir, '.questmaestro'),
      JSON.stringify(config, null, 2)
    );
    
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      'list',
      { killOnPostAction: true } // Kill when we see [🎁] (quest status displayed)
    );
    
    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(project.rootDir, 'my-quests'))).toBe(true);
  });

  test('should create quest folder structure on first run', async () => {
    project = await bootstrapper.createSimpleProject('quest-folder-structure');
    runner = new ClaudeE2ERunner(project.rootDir);
    
    const result = await runner.executeCommand(
      '/questmaestro',
      'list',
      { killOnPostAction: true } // Kill when we see [🎁] (quest status displayed)
    );
    
    expect(result.success).toBe(true);
    
    const questFolder = path.join(project.rootDir, 'questmaestro');
    expect(fs.existsSync(path.join(questFolder, 'active'))).toBe(true);
    expect(fs.existsSync(path.join(questFolder, 'completed'))).toBe(true);
    expect(fs.existsSync(path.join(questFolder, 'abandoned'))).toBe(true);
    expect(fs.existsSync(path.join(questFolder, 'retros'))).toBe(true);
    expect(fs.existsSync(path.join(questFolder, 'lore'))).toBe(true);
    // No quest-tracker.json needed - using file-based system
  });
});