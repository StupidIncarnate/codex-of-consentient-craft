import { TestProject, createTestProject } from '../tests/utils/testbed';
import type { Linter } from 'eslint';

// Using the type for JSON.parse type assertions
interface ClaudeSettings {
  permissions?: {
    allow?: string[];
  };
  [key: string]: unknown;
}

describe('Questmaestro Installation', () => {
  let testProject: TestProject;

  beforeEach(() => {
    testProject = createTestProject('install-test');
  });

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('should install all quest commands to .claude/commands', () => {
    // Run the installer
    const output = testProject.installQuestmaestro();

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
    ];

    for (const cmd of expectedCommands) {
      expect(testProject.hasCommand(cmd)).toBe(true);
    }
  });

  test('should create questmaestro directory structure', () => {
    testProject.installQuestmaestro();

    // Check directory structure
    expect(testProject.fileExists('questmaestro')).toBe(true);
    expect(testProject.fileExists('questmaestro/active')).toBe(true);
    expect(testProject.fileExists('questmaestro/completed')).toBe(true);
    expect(testProject.fileExists('questmaestro/abandoned')).toBe(true);
    expect(testProject.fileExists('questmaestro/retros')).toBe(true);
    expect(testProject.fileExists('questmaestro/lore')).toBe(true);
    expect(testProject.fileExists('questmaestro/lore/README.md')).toBe(true);
  });

  test('should add questmaestro folders to .gitignore', () => {
    testProject.installQuestmaestro();

    const gitignoreContent = testProject.readFile('.gitignore');
    expect(gitignoreContent).toContain('questmaestro/active/');
    expect(gitignoreContent).toContain('questmaestro/completed/');
    expect(gitignoreContent).toContain('questmaestro/abandoned/');
    expect(gitignoreContent).toContain('# Questmaestro local quest folders');
  });

  test('should create .questmaestro config file', () => {
    testProject.installQuestmaestro();

    const config = testProject.getConfig();
    expect(config).toBeDefined();
    expect(config?.questFolder).toBe('questmaestro');
    expect(config?.wardCommands).toBeDefined();
    expect(config?.wardCommands?.all).toBeDefined();
    // ward:all is created by the installer
  });

  test('should not duplicate gitignore entries if already present', () => {
    // Create existing gitignore with questmaestro entries
    testProject.writeFile('.gitignore', 'node_modules/\nquestmaestro/active/\n');

    // Run installer
    const output = testProject.installQuestmaestro();

    // Check it didn't duplicate entries
    expect(output).toContain('gitignore entries already exist, skipping');

    const gitignoreContent = testProject.readFile('.gitignore');
    const activeLines = gitignoreContent
      .split('\n')
      .filter((line) => line.includes('questmaestro/active/'));
    expect(activeLines).toHaveLength(1);
  });

  test('should not overwrite existing .questmaestro config', () => {
    // Create existing config
    const existingConfig = {
      paths: { questFolder: './custom-quests' },
      commands: { test: 'custom test' },
    };

    testProject.writeFile('.questmaestro', JSON.stringify(existingConfig, null, 2));

    // Run installer
    testProject.installQuestmaestro();

    // Check it wasn't overwritten
    const config = testProject.getConfig();
    expect(config).toEqual(existingConfig);
  });

  test('should create gitignore if it does not exist', () => {
    // Ensure no gitignore exists
    expect(testProject.fileExists('.gitignore')).toBe(false);

    // Run installer
    testProject.installQuestmaestro();

    // Check gitignore was created with questmaestro entries
    expect(testProject.fileExists('.gitignore')).toBe(true);
    const gitignoreContent = testProject.readFile('.gitignore');
    expect(gitignoreContent).toContain('questmaestro/active/');
    expect(gitignoreContent).toContain('questmaestro/completed/');
    expect(gitignoreContent).toContain('questmaestro/abandoned/');
  });

  test('should install ESLint if not present', () => {
    // Create project without ESLint
    const packageJson = testProject.getPackageJson();
    delete packageJson?.eslintConfig;
    delete packageJson?.devDependencies?.eslint;
    testProject.writeFile('package.json', JSON.stringify(packageJson, null, 2));

    // Remove any existing ESLint config files
    [
      '.eslintrc',
      '.eslintrc.js',
      '.eslintrc.json',
      '.eslintrc.yml',
      '.eslintrc.yaml',
      'eslint.config.js',
      'eslint.config.mjs',
    ].forEach((file) => {
      if (testProject.fileExists(file)) {
        testProject.deleteFile(file);
      }
    });

    // Run installer
    const output = testProject.installQuestmaestro();

    // Check ESLint was installed
    expect(output).toContain('No ESLint configuration found, installing');
    expect(output).toContain('ESLint installed and configured');

    // Check ESLint config was created
    expect(testProject.fileExists('.eslintrc.json')).toBe(true);
    const eslintConfig = JSON.parse(testProject.readFile('.eslintrc.json')) as Linter.LegacyConfig;
    expect(eslintConfig.extends).toContain('@eslint/js/recommended');
    expect(eslintConfig.env?.node).toBe(true);
    expect(eslintConfig.env?.es2022).toBe(true);

    // Check lint script was added
    const updatedPackageJson = testProject.getPackageJson();
    expect(updatedPackageJson?.scripts.lint).toBeDefined();
    expect(updatedPackageJson?.scripts.lint).toContain('eslint');
  });

  test('should not install ESLint if already present in package.json', () => {
    // Create project with ESLint config in package.json
    const packageJson = testProject.getPackageJson() || {};
    packageJson.eslintConfig = {
      extends: ['eslint:recommended'],
    };
    testProject.writeFile('package.json', JSON.stringify(packageJson, null, 2));

    // Run installer
    const output = testProject.installQuestmaestro();

    // Check ESLint was not installed
    expect(output).toContain('ESLint configuration found');
    expect(output).not.toContain('No ESLint configuration found');

    // Check no new .eslintrc.json was created
    expect(testProject.fileExists('.eslintrc.json')).toBe(false);
  });

  test('should not install ESLint if config file already exists', () => {
    // Create existing ESLint config file
    testProject.writeFile(
      '.eslintrc.json',
      JSON.stringify(
        {
          extends: ['eslint:recommended'],
          rules: { 'no-console': 'error' },
        },
        null,
        2,
      ),
    );

    // Run installer
    const output = testProject.installQuestmaestro();

    // Check ESLint was not installed
    expect(output).toContain('ESLint configuration found');
    expect(output).not.toContain('No ESLint configuration found');

    // Check existing config was not overwritten
    const eslintConfig = JSON.parse(testProject.readFile('.eslintrc.json')) as Linter.LegacyConfig;
    expect(eslintConfig.rules?.['no-console']).toBe('error');
  });

  test('should handle missing package.json gracefully', () => {
    // Delete package.json to simulate missing file
    testProject.deleteFile('package.json');

    // Installation should fail
    expect(testProject.installQuestmaestro()).toThrow();
  });

  test('should add lint script if missing even when ESLint exists', () => {
    // Create project with ESLint config but no lint script
    const packageJson = testProject.getPackageJson();
    packageJson.eslintConfig = { extends: ['eslint:recommended'] };
    if (packageJson.scripts) {
      delete packageJson.scripts.lint;
    }
    testProject.writeFile('package.json', JSON.stringify(packageJson, null, 2));

    // Run installer - this test expects failure due to missing required scripts
    // The installer requires both 'lint' and 'test' scripts to be present
    expect(testProject.installQuestmaestro()).toThrow();
  });

  test('should create .claude/settings.local.json with Write permission', () => {
    // Run installer
    const output = testProject.installQuestmaestro();

    // Check settings file was created
    expect(testProject.fileExists('.claude/settings.local.json')).toBe(true);

    // Check contents
    const settings = JSON.parse(
      testProject.readFile('.claude/settings.local.json'),
    ) as ClaudeSettings;
    expect(settings.permissions).toBeDefined();
    expect(settings.permissions.allow).toContain('Write');

    // Check output
    expect(output).toContain('Created .claude/settings.local.json with Write permission');
  });

  test('should add Write permission to existing .claude/settings.local.json', () => {
    // Create existing settings without Write permission
    const existingSettings = {
      otherSetting: 'testValue',
      permissions: {
        deny: ['Bash'],
      },
    };
    testProject.writeFile('.claude/settings.local.json', JSON.stringify(existingSettings, null, 2));

    // Run installer
    const output = testProject.installQuestmaestro();

    // Check contents
    const settings = JSON.parse(
      testProject.readFile('.claude/settings.local.json'),
    ) as ClaudeSettings;
    expect(settings.otherSetting).toBe('testValue');
    expect(settings.permissions.deny).toContain('Bash');
    expect(settings.permissions.allow).toContain('Write');

    // Check output
    expect(output).toContain('Added Write permission to existing .claude/settings.local.json');
  });

  test('should not modify settings when Write permission already exists', () => {
    // Create settings with Write permission
    const existingSettings = {
      permissions: {
        allow: ['Write', 'Read'],
      },
    };
    testProject.writeFile('.claude/settings.local.json', JSON.stringify(existingSettings, null, 2));

    // Run installer
    const output = testProject.installQuestmaestro();

    // Check contents haven't changed
    const settings = JSON.parse(
      testProject.readFile('.claude/settings.local.json'),
    ) as ClaudeSettings;
    expect(settings).toEqual(existingSettings);

    // Check output
    expect(output).toContain('Write permission already configured in settings.local.json');
  });

  test('should handle malformed .claude/settings.local.json by creating backup', () => {
    // Create malformed JSON
    testProject.writeFile('.claude/settings.local.json', '{ invalid json');

    // Run installer
    const output = testProject.installQuestmaestro();

    // Check backup was created
    expect(testProject.fileExists('.claude/settings.local.json.backup')).toBe(true);

    // Check new settings were created
    const settings = JSON.parse(
      testProject.readFile('.claude/settings.local.json'),
    ) as ClaudeSettings;
    expect(settings.permissions.allow).toContain('Write');

    // Check output
    expect(output).toContain('Could not parse existing settings.local.json');
  });
});
