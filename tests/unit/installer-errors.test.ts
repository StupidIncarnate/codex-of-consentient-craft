import { TestProject, createTestProject } from "../utils/testbed";
import path from 'path';
import fs from 'fs';

describe('Installer Error Handling', () => {
  let testProject: TestProject;

  beforeEach(async () => {
    testProject = await createTestProject('error-test');
  });

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('should handle read-only .claude/commands directory', async () => {
    // Make commands directory read-only
    const commandsDir = path.join(testProject.rootDir, '.claude', 'commands');
    fs.chmodSync(commandsDir, 0o444);

    let error;
    try {
      await testProject.installQuestmaestro();
    } catch (e) {
      error = e;
    } finally {
      // Restore permissions for cleanup
      fs.chmodSync(commandsDir, 0o755);
    }

    // Should get permission error
    expect(error).toBeDefined();
  });

  test('should handle missing source files gracefully', async () => {
    // This tests if our package structure is intact
    const sourceFiles = [
      path.join(process.cwd(), 'src', 'commands', 'questmaestro.md'),
      path.join(process.cwd(), 'src', 'templates', 'questmaestro.json'),
      path.join(process.cwd(), 'src', 'templates', 'lore-categories.md')
    ];

    for (const file of sourceFiles) {
      expect(fs.existsSync(file)).toBe(true);
    }
  });

  test('should create nested directories if they do not exist', async () => {
    // Remove questmaestro directory to test creation
    const questDir = path.join(testProject.rootDir, 'questmaestro');
    if (fs.existsSync(questDir)) {
      fs.rmSync(questDir, { recursive: true });
    }

    await testProject.installQuestmaestro();

    // All directories should be created
    expect(testProject.fileExists('questmaestro')).toBe(true);
    expect(testProject.fileExists('questmaestro/active')).toBe(true);
    expect(testProject.fileExists('questmaestro/completed')).toBe(true);
  });

  test('should handle partial installation state', async () => {
    // Create partial installation
    testProject.writeFile('.claude/commands/questmaestro.md', 'partial content');
    // But no quest:* commands

    const output = await testProject.installQuestmaestro();

    // Should complete installation
    expect(output).toContain('Quest System Installed!');
    
    // Should have all commands now
    expect(testProject.hasCommand('quest:pathseeker')).toBe(true);
    expect(testProject.hasCommand('quest:codeweaver')).toBe(true);
  });
});