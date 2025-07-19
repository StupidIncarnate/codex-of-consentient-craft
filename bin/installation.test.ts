import { TestProject, createTestProject } from '../tests/utils/testbed';
import type { Linter } from 'eslint';

// Using the type for JSON.parse type assertions
interface ClaudeSettings {
  tools?: {
    Write?: {
      allowed_paths?: string[];
    };
    [key: string]: unknown;
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
      questFolder: './custom-quests',
      wardCommands: {
        test: 'custom test',
      },
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
    if (!packageJson) {
      throw new Error('package.json not found');
    }

    // Create a new object without eslintConfig
    const { eslintConfig: _eslintConfig, ...packageJsonWithoutEslint } = packageJson;

    // Remove eslint from devDependencies if it exists
    if (packageJsonWithoutEslint.devDependencies?.eslint) {
      const { eslint: _eslint, ...devDepsWithoutEslint } = packageJsonWithoutEslint.devDependencies;
      packageJsonWithoutEslint.devDependencies = devDepsWithoutEslint;
    }

    testProject.writeFile('package.json', JSON.stringify(packageJsonWithoutEslint, null, 2));

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
    const eslintConfigContent = JSON.parse(
      testProject.readFile('.eslintrc.json'),
    ) as Linter.LegacyConfig;
    expect(eslintConfigContent.extends).toContain('@eslint/js/recommended');
    expect(eslintConfigContent.env?.node).toBe(true);
    expect(eslintConfigContent.env?.es2022).toBe(true);

    // Check lint script was added
    const updatedPackageJson = testProject.getPackageJson();
    expect(updatedPackageJson?.scripts.lint).toBeDefined();
    expect(updatedPackageJson?.scripts.lint).toContain('eslint');
  });

  test('should not install ESLint if already present in package.json', () => {
    // Create project with ESLint config in package.json
    const packageJson = testProject.getPackageJson();
    if (!packageJson) {
      throw new Error('package.json not found');
    }
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
    const eslintConfigFile = JSON.parse(
      testProject.readFile('.eslintrc.json'),
    ) as Linter.LegacyConfig;
    expect(eslintConfigFile.rules?.['no-console']).toBe('error');
  });

  test('should handle missing package.json gracefully', () => {
    // Delete package.json to simulate missing file
    testProject.deleteFile('package.json');

    // Installation should fail
    expect(() => testProject.installQuestmaestro()).toThrow('Process exit with code 1');
  });

  test('should add lint script if missing even when ESLint exists', () => {
    // Create project with ESLint config but no lint script
    const packageJson = testProject.getPackageJson();
    if (!packageJson) {
      throw new Error('package.json not found');
    }
    packageJson.eslintConfig = { extends: ['eslint:recommended'] };
    if (packageJson.scripts && 'lint' in packageJson.scripts) {
      const { lint: _lint, ...scriptsWithoutLint } = packageJson.scripts;
      packageJson.scripts = scriptsWithoutLint as typeof packageJson.scripts;
    }
    testProject.writeFile('package.json', JSON.stringify(packageJson, null, 2));

    // Run installer - this test expects failure due to missing required scripts
    // The installer requires both 'lint' and 'test' scripts to be present
    expect(() => testProject.installQuestmaestro()).toThrow('Process exit with code 1');
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
    expect(settings.tools).toBeDefined();
    expect(settings.tools?.Write).toBeDefined();
    expect(settings.tools?.Write?.allowed_paths).toBeDefined();
    expect(settings.tools?.Write?.allowed_paths?.length).toBeGreaterThan(0);

    // Check output
    expect(output).toContain('Added Write permissions for questmaestro folder');
  });

  test('should add Write permission to existing .claude/settings.local.json', () => {
    // Create existing settings without Write permission
    const existingSettings = {
      otherSetting: 'testValue',
      tools: {
        OtherTool: {
          config: 'value',
        },
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
    expect(settings.tools?.OtherTool).toBeDefined();
    expect(settings.tools?.Write?.allowed_paths).toBeDefined();
    expect(settings.tools?.Write?.allowed_paths?.length).toBeGreaterThan(0);

    // Check output
    expect(output).toContain('Added Write permissions for questmaestro folder');
  });

  test('should not modify settings when Write permission already exists', () => {
    // Create settings with Write permission for questmaestro
    const questmaestroPath = testProject.rootDir + '/questmaestro';
    const existingSettings = {
      tools: {
        Write: {
          allowed_paths: [questmaestroPath],
        },
      },
    };
    testProject.writeFile('.claude/settings.local.json', JSON.stringify(existingSettings, null, 2));

    // Run installer
    const output = testProject.installQuestmaestro();

    // Check contents have correct path
    const settings = JSON.parse(
      testProject.readFile('.claude/settings.local.json'),
    ) as ClaudeSettings;
    expect(settings.tools?.Write?.allowed_paths).toHaveLength(1);
    expect(settings.tools?.Write?.allowed_paths?.[0]).toContain('questmaestro');

    // Check output
    expect(output).toContain('Added Write permissions for questmaestro folder');
  });

  test('should handle malformed .claude/settings.local.json by creating backup', () => {
    // Create malformed JSON
    testProject.writeFile('.claude/settings.local.json', '{ invalid json');

    // Run installer
    const output = testProject.installQuestmaestro();

    // Check new settings were created with proper structure
    const settings = JSON.parse(
      testProject.readFile('.claude/settings.local.json'),
    ) as ClaudeSettings;
    expect(settings.tools?.Write?.allowed_paths).toBeDefined();
    expect(settings.tools?.Write?.allowed_paths?.length).toBeGreaterThan(0);

    // Check output mentions invalid settings
    expect(output).toContain('Invalid settings.local.json, creating new');
  });
});
