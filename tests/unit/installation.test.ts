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
      'quest:spiritmender'
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

  test('should add questmaestro folders to .gitignore', async () => {
    await testProject.installQuestmaestro();
    
    const gitignoreContent = testProject.readFile('.gitignore');
    expect(gitignoreContent).toContain('questmaestro/active/');
    expect(gitignoreContent).toContain('questmaestro/completed/');
    expect(gitignoreContent).toContain('questmaestro/abandoned/');
    expect(gitignoreContent).toContain('# Questmaestro local quest folders');
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

  test('should not duplicate gitignore entries if already present', async () => {
    // Create existing gitignore with questmaestro entries
    testProject.writeFile('.gitignore', 'node_modules/\nquestmaestro/active/\n');
    
    // Run installer
    const output = await testProject.installQuestmaestro();
    
    // Check it didn't duplicate entries
    expect(output).toContain('gitignore entries already exist, skipping');
    
    const gitignoreContent = testProject.readFile('.gitignore');
    const activeLines = gitignoreContent.split('\n').filter(line => line.includes('questmaestro/active/'));
    expect(activeLines).toHaveLength(1);
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

  test('should create gitignore if it does not exist', async () => {
    // Ensure no gitignore exists
    expect(testProject.fileExists('.gitignore')).toBe(false);
    
    // Run installer
    await testProject.installQuestmaestro();
    
    // Check gitignore was created with questmaestro entries
    expect(testProject.fileExists('.gitignore')).toBe(true);
    const gitignoreContent = testProject.readFile('.gitignore');
    expect(gitignoreContent).toContain('questmaestro/active/');
    expect(gitignoreContent).toContain('questmaestro/completed/');
    expect(gitignoreContent).toContain('questmaestro/abandoned/');
  });
});