const { createTestProject } = require('../utils/testbed');
const path = require('path');
const { execSync } = require('child_process');

describe('NPX Installation', () => {
  let testProject;

  beforeEach(async () => {
    testProject = await createTestProject('npx-test');
  });

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('should install via npx simulation', async () => {
    // Simulate what happens when user runs: npx questmaestro
    // In real usage, npm would download the package first
    // Here we test using the local install.js directly
    
    const installerPath = path.join(process.cwd(), 'bin', 'install.js');
    const result = execSync(`node ${installerPath}`, {
      cwd: testProject.rootDir,
      encoding: 'utf8'
    });

    // Verify installation output
    expect(result).toContain('🗡️  Questmaestro Installation');
    expect(result).toContain('Quest System Installed!');
    expect(result).toContain('Available Commands:');
    
    // Verify all files were created
    expect(testProject.fileExists('.claude/commands/questmaestro.md')).toBe(true);
    expect(testProject.fileExists('.questmaestro')).toBe(true);
    expect(testProject.fileExists('questmaestro/quest-tracker.json')).toBe(true);
  });

  test('should handle missing .claude directory', async () => {
    // Remove .claude directory to test error handling
    const claudeDir = path.join(testProject.rootDir, '.claude');
    const fs = require('fs');
    if (fs.existsSync(claudeDir)) {
      fs.rmSync(claudeDir, { recursive: true });
    }

    let error;
    try {
      const installerPath = path.join(process.cwd(), 'bin', 'install.js');
      execSync(`node ${installerPath}`, {
        cwd: testProject.rootDir,
        encoding: 'utf8'
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.stdout).toContain('No .claude directory found');
    expect(error.status).toBe(1);
  });

  test('should preserve existing configurations on reinstall', async () => {
    // First installation
    await testProject.installQuestmaestro();
    
    // Modify config
    const customConfig = {
      paths: { questFolder: './my-quests' },
      commands: { 
        ward: 'eslint $FILE',
        'ward:all': 'eslint .'
      }
    };
    testProject.writeFile('.questmaestro', JSON.stringify(customConfig, null, 2));
    
    // Add some quests
    const questTracker = {
      active: ['existing-quest.json'],
      completed: ['done-quest.json'],
      abandoned: []
    };
    testProject.writeFile('questmaestro/quest-tracker.json', JSON.stringify(questTracker, null, 2));
    
    // Second installation
    const output = await testProject.installQuestmaestro();
    
    // Verify configs were preserved
    const config = testProject.getConfig();
    expect(config.paths.questFolder).toBe('./my-quests');
    expect(config.commands.ward).toBe('eslint $FILE');
    
    const tracker = testProject.getQuestTracker();
    expect(tracker.active).toContain('existing-quest.json');
    
    // Check warning was shown
    expect(output).toContain('.questmaestro already exists, skipping');
    expect(output).toContain('quest-tracker.json already exists, skipping');
  });

  test('should create all required subdirectories', async () => {
    await testProject.installQuestmaestro();
    
    // Check all quest subdirectories
    const questDirs = [
      'questmaestro/active',
      'questmaestro/completed', 
      'questmaestro/abandoned',
      'questmaestro/retros',
      'questmaestro/lore'
    ];
    
    for (const dir of questDirs) {
      expect(testProject.fileExists(dir)).toBe(true);
    }
    
    // Check lore README was created
    expect(testProject.fileExists('questmaestro/lore/README.md')).toBe(true);
    const loreReadme = testProject.readFile('questmaestro/lore/README.md');
    expect(loreReadme).toContain('Lore Categories');
  });

  test('should install all agent commands with correct names', async () => {
    await testProject.installQuestmaestro();
    
    const expectedAgents = [
      'pathseeker',
      'codeweaver',
      'lawbringer',
      'siegemaster',
      'spiritmender',
      'taskweaver'
    ];
    
    for (const agent of expectedAgents) {
      const commandPath = `.claude/commands/quest/${agent}.md`;
      expect(testProject.fileExists(commandPath)).toBe(true);
      
      // Verify file content is not empty
      const content = testProject.readFile(commandPath);
      expect(content.length).toBeGreaterThan(100); // Should have substantial content
      expect(content).toContain(agent.toUpperCase()); // Should contain agent name
    }
  });
});