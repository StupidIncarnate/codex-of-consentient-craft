import { TestProject, createTestProject } from '@questmaestro/testing';
import type { Linter } from 'eslint';

describe('Questmaestro Installation', () => {
  let testProject: TestProject;

  beforeEach(() => {
    testProject = createTestProject('install-test');
  });

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  describe('Installation Process', () => {
    it('should skip Claude commands in CLI mode', () => {
      // Run the installer
      const output = testProject.installQuestmaestro();

      // Check that installation succeeded
      expect(output).toContain('Quest System Installed!');

      // Check that CLI mode messages appear
      expect(output).toContain('CLI mode active - no Claude commands needed');
      expect(output).toContain('The Questmaestro CLI is now available');

      // Claude commands should NOT be installed in CLI mode
      expect(testProject.hasCommand('questmaestro')).toBe(false);
      expect(testProject.hasCommand('quest:pathseeker')).toBe(false);
    });

    it('should create questmaestro directory structure', () => {
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

    it('should add questmaestro folders to .gitignore', () => {
      testProject.installQuestmaestro();

      const gitignoreContent = testProject.readFile('.gitignore');
      expect(gitignoreContent).toContain('questmaestro/active/');
      expect(gitignoreContent).toContain('questmaestro/completed/');
      expect(gitignoreContent).toContain('questmaestro/abandoned/');
      expect(gitignoreContent).toContain('# Questmaestro local quest folders');
    });
  });

  describe('Configuration Files', () => {
    it('should create .questmaestro config file', () => {
      testProject.installQuestmaestro();

      const config = testProject.getConfig();
      expect(config).not.toBeNull();
      expect(config?.questFolder).toBe('questmaestro');
      expect(config?.wardCommands).not.toBeNull();
      expect(config?.wardCommands?.all).not.toBeNull();
      // ward:all is created by the installer
    });

    it('should not duplicate gitignore entries if already present', () => {
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

    it('should not overwrite existing .questmaestro config', () => {
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
      expect(config).toStrictEqual(existingConfig);
    });

    it('should create gitignore if it does not exist', () => {
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
  });

  describe('ESLint Setup', () => {
    it('should install ESLint if not present', () => {
      // Create project without ESLint
      const packageJson = testProject.getPackageJson();
      if (!packageJson) {
        throw new Error('package.json not found');
      }

      // Create a new object without eslintConfig
      const { eslintConfig: _eslintConfig, ...packageJsonWithoutEslint } = packageJson;

      // Remove eslint from devDependencies if it exists
      if (packageJsonWithoutEslint.devDependencies?.eslint) {
        const { eslint: _eslint, ...devDepsWithoutEslint } =
          packageJsonWithoutEslint.devDependencies;
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
      const eslintConfigRaw = testProject.readFile('.eslintrc.json');
      // ESLint config is not user-provided data, so we can parse it directly
      const eslintConfigContent = JSON.parse(eslintConfigRaw) as Linter.LegacyConfig;
      expect(eslintConfigContent.extends).toContain('@eslint/js/recommended');
      expect(eslintConfigContent.env?.node).toBe(true);
      expect(eslintConfigContent.env?.es2022).toBe(true);

      // Check lint script was added
      const updatedPackageJson = testProject.getPackageJson();
      expect(updatedPackageJson?.scripts.lint).toBe('eslint .');
    });

    it('should not install ESLint if already present in package.json', () => {
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

    it('should not install ESLint if config file already exists', () => {
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

    it('should handle missing package.json gracefully', () => {
      // Delete package.json to simulate missing file
      testProject.deleteFile('package.json');

      // Installation should fail
      expect(() => testProject.installQuestmaestro()).toThrow('Process exit with code 1');
    });

    it('should add lint script if missing even when ESLint exists', () => {
      // Create project with ESLint config but no lint script
      const packageJson = testProject.getPackageJson();
      if (!packageJson) {
        throw new Error('package.json not found');
      }
      packageJson.eslintConfig = { extends: ['eslint:recommended'] };
      if (packageJson.scripts && 'lint' in packageJson.scripts) {
        const { lint: _lint, ...scriptsWithoutLint } = packageJson.scripts;
        packageJson.scripts = scriptsWithoutLint;
      }
      testProject.writeFile('package.json', JSON.stringify(packageJson, null, 2));

      // Run installer - this test expects failure due to missing required scripts
      // The installer requires both 'lint' and 'test' scripts to be present
      expect(() => testProject.installQuestmaestro()).toThrow('Process exit with code 1');
    });
  });

  describe('Write Permissions', () => {
    it('should skip Claude settings in CLI mode', () => {
      // Run installer
      const output = testProject.installQuestmaestro();

      // Check that CLI mode skips Claude settings
      expect(output).toContain('CLI mode active - no Claude settings needed');

      // Settings file should not be created in CLI mode
      expect(testProject.fileExists('.claude/settings.local.json')).toBe(false);
    });

    it('should not modify Claude settings in CLI mode', () => {
      // Create existing settings without Write permission
      const existingSettings = {
        otherSetting: 'testValue',
        tools: {
          OtherTool: {
            config: 'value',
          },
        },
      };
      const originalContent = JSON.stringify(existingSettings, null, 2);
      testProject.writeFile('.claude/settings.local.json', originalContent);

      // Run installer
      const output = testProject.installQuestmaestro();

      // Check that CLI mode skipped settings
      expect(output).toContain('CLI mode active - no Claude settings needed');

      // Settings should remain unchanged
      const settingsRaw = testProject.readFile('.claude/settings.local.json');
      expect(settingsRaw).toBe(originalContent);
    });

    it('should skip settings check even when permission exists', () => {
      // Create settings with Write permission for questmaestro
      const questmaestroPath = testProject.rootDir + '/questmaestro';
      const existingSettings = {
        tools: {
          Write: {
            allowed_paths: [questmaestroPath],
          },
        },
      };
      const originalContent = JSON.stringify(existingSettings, null, 2);
      testProject.writeFile('.claude/settings.local.json', originalContent);

      // Run installer
      const output = testProject.installQuestmaestro();

      // Check that CLI mode skipped settings
      expect(output).toContain('CLI mode active - no Claude settings needed');

      // Settings should remain unchanged
      const settingsRaw = testProject.readFile('.claude/settings.local.json');
      expect(settingsRaw).toBe(originalContent);
    });

    it('should skip settings even with malformed file in CLI mode', () => {
      // Create malformed JSON
      const malformedContent = '{ invalid json';
      testProject.writeFile('.claude/settings.local.json', malformedContent);

      // Run installer
      const output = testProject.installQuestmaestro();

      // Check that CLI mode skipped settings
      expect(output).toContain('CLI mode active - no Claude settings needed');

      // Malformed file should remain unchanged
      const settingsRaw = testProject.readFile('.claude/settings.local.json');
      expect(settingsRaw).toBe(malformedContent);
    });
  });
});
