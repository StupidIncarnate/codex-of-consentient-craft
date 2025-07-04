import { TestProject, createTestProject } from "../utils/testbed";

describe('Questmaestro Installation', () => {
  let testProject: TestProject;

  beforeEach(async () => {
    testProject = await createTestProject('install-test');
  });

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('should install all quest commands to .claude/commands', async () => {
    // Run the installer
    const output = await testProject.installQuestmaestro();
    
    // Check that installation succeeded
    expect(output).toContain('Quest System Installed!');
    
    // Check main command exists
    expect(testProject.hasCommand('questmaestro')).toBe(true);
    
    // Check all sub-commands exist
    const expectedCommands = [
      'quest:pathseeker',
      'quest:codeweaver', 
      'quest:lawbringer',
      'quest:siegemaster',
      'quest:spiritmender',
      'quest:taskweaver'
    ];
    
    for (const cmd of expectedCommands) {
      expect(testProject.hasCommand(cmd)).toBe(true);
    }
  });

  test('should create questmaestro directory structure', async () => {
    await testProject.installQuestmaestro();
    
    // Check directory structure
    expect(testProject.fileExists('questmaestro')).toBe(true);
    expect(testProject.fileExists('questmaestro/active')).toBe(true);
    expect(testProject.fileExists('questmaestro/completed')).toBe(true);
    expect(testProject.fileExists('questmaestro/abandoned')).toBe(true);
    expect(testProject.fileExists('questmaestro/retros')).toBe(true);
    expect(testProject.fileExists('questmaestro/lore')).toBe(true);
    expect(testProject.fileExists('questmaestro/lore/README.md')).toBe(true);
  });

  test('should create quest-tracker.json', async () => {
    await testProject.installQuestmaestro();
    
    const tracker = testProject.getQuestTracker();
    expect(tracker).toBeDefined();
    expect(tracker?.active).toEqual([]);
    expect(tracker?.completed).toEqual([]);
    expect(tracker?.abandoned).toEqual([]);
  });

  test('should create .questmaestro config file', async () => {
    await testProject.installQuestmaestro();
    
    const config = testProject.getConfig();
    expect(config).toBeDefined();
    expect(config.paths.questFolder).toBe('questmaestro');
    expect(config.commands).toBeDefined();
    expect(config.commands.ward).toBeDefined();
    expect(config.commands['ward:all']).toBeDefined();
  });

  test('should not overwrite existing quest-tracker.json', async () => {
    // Create existing quest tracker
    const existingTracker = {
      active: ['existing-quest.json'],
      completed: ['done-quest.json'],
      abandoned: []
    };
    
    testProject.writeFile(
      'questmaestro/quest-tracker.json',
      JSON.stringify(existingTracker, null, 2)
    );
    
    // Run installer
    await testProject.installQuestmaestro();
    
    // Check it wasn't overwritten
    const tracker = testProject.getQuestTracker();
    expect(tracker).toEqual(existingTracker);
  });

  test('should not overwrite existing .questmaestro config', async () => {
    // Create existing config
    const existingConfig = {
      paths: { questFolder: './custom-quests' },
      commands: { test: 'custom test' }
    };
    
    testProject.writeFile('.questmaestro', JSON.stringify(existingConfig, null, 2));
    
    // Run installer
    await testProject.installQuestmaestro();
    
    // Check it wasn't overwritten
    const config = testProject.getConfig();
    expect(config).toEqual(existingConfig);
  });
});