import {TestProject, createTestProject} from '@questmaestro/testing';
import * as path from 'path';
import * as fs from 'fs';
import {main} from './install';

describe('NPX Installation', () => {
    let testProject: TestProject;

    beforeEach(() => {
        testProject = createTestProject('npx-test');
    });

    // Cleanup happens on git commit, not after tests
    // This allows debugging of test artifacts

    describe('Installation Process', () => {
        it('should install via npx simulation', () => {
            // Mock process.exit to prevent test from exiting
            const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
                throw new Error(`Process exit with code ${code}`);
            });

            // Capture console output
            const consoleOutput: string[] = [];
            const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation((...args) => {
                consoleOutput.push(args.join(' '));
            });

            // Change to test directory
            const originalCwd = process.cwd();
            process.chdir(testProject.rootDir);

            try {
                // Run the installer
                main();
            } catch (_error) {
                // Expected if process.exit was called
            } finally {
                // Restore original directory
                process.chdir(originalCwd);
                mockExit.mockRestore();
                mockConsoleLog.mockRestore();
            }

            const output = consoleOutput.join('\n');

            // Verify installation output
            expect(output).toContain('🗡️  Questmaestro Installation');
            expect(output).toContain('Quest System Installed!');
            expect(output).toContain('The Questmaestro CLI is now available');

            // Verify all files were created (no Claude commands in CLI mode)
            expect(testProject.fileExists('.questmaestro')).toBe(true);
            expect(testProject.fileExists('questmaestro/active')).toBe(true);
            expect(testProject.fileExists('questmaestro/completed')).toBe(true);
            expect(testProject.fileExists('questmaestro/abandoned')).toBe(true);

            // Verify gitignore entries were added
            expect(testProject.fileExists('.gitignore')).toBe(true);
            const gitignoreContent = testProject.readFile('.gitignore');
            expect(gitignoreContent).toContain('questmaestro/active/');
        });
    });

    describe('Error Handling', () => {
        it('should handle missing package.json', () => {
            // Remove package.json to test error handling
            const packageJsonPath = path.join(testProject.rootDir, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                fs.rmSync(packageJsonPath);
            }

            // Mock process.exit
            const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
                throw new Error(`Process exit with code ${code}`);
            });

            // Capture console output
            const consoleOutput: string[] = [];
            const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation((...args) => {
                consoleOutput.push(args.join(' '));
            });

            // Change to test directory (without package.json)
            const originalCwd = process.cwd();
            process.chdir(testProject.rootDir);

            let exitCode: number | undefined;
            try {
                main();
            } catch (error) {
                if (error instanceof Error && error.message.startsWith('Process exit with code')) {
                    exitCode = parseInt(error.message.match(/code (\d+)/)?.[1] || '0');
                }
            } finally {
                process.chdir(originalCwd);
                mockExit.mockRestore();
                mockConsoleLog.mockRestore();
            }

            const output = consoleOutput.join('\n');

            expect(exitCode).toBe(1);
            expect(output).toContain('No package.json found');
        });
    });

    describe('Reinstallation', () => {
        it('should preserve existing configurations on reinstall', () => {
            // First installation
            testProject.installQuestmaestro();

            // Modify config
            const customConfig = {
                questFolder: './my-quests',
                wardCommands: {
                    all: 'eslint .',
                },
            };
            testProject.writeFile('.questmaestro', JSON.stringify(customConfig, null, 2));

            // Add some existing quest files
            testProject.writeFile(
                'questmaestro/active/existing-quest.json',
                JSON.stringify({id: 'existing-quest', title: 'Test Quest'}, null, 2),
            );
            testProject.writeFile(
                'questmaestro/completed/done-quest.json',
                JSON.stringify({id: 'done-quest', title: 'Completed Quest'}, null, 2),
            );

            // Second installation
            const output = testProject.installQuestmaestro();

            // Verify configs were preserved
            const config = testProject.getConfig();
            expect(config?.questFolder).toBe('./my-quests');
            expect(config?.wardCommands?.all).toBe('eslint .');

            // Verify quest files were preserved
            const activeQuests = testProject.getQuestFiles('active');
            expect(activeQuests).toContain('existing-quest.json');

            const completedQuests = testProject.getQuestFiles('completed');
            expect(completedQuests).toContain('done-quest.json');

            // Check warning was shown
            expect(output).toContain('.questmaestro already exists, skipping');
            expect(output).toContain('gitignore entries already exist, skipping');
        });
    });

    describe('Directory Structure', () => {
        it('should create all required subdirectories', () => {
            testProject.installQuestmaestro();

            // Check all quest subdirectories
            const questDirs = [
                'questmaestro/active',
                'questmaestro/completed',
                'questmaestro/abandoned',
                'questmaestro/retros',
                'questmaestro/lore',
            ];

            for (const dir of questDirs) {
                expect(testProject.fileExists(dir)).toBe(true);
            }

            // Check lore README was created
            expect(testProject.fileExists('questmaestro/lore/README.md')).toBe(true);
            const loreReadme = testProject.readFile('questmaestro/lore/README.md');
            expect(loreReadme).toContain('Lore Categories');
        });

        it('should create config file with correct structure', () => {
            testProject.installQuestmaestro();

            // Verify .questmaestro config was created
            expect(testProject.fileExists('.questmaestro')).toBe(true);

            const config = testProject.getConfig();
            expect(config).toBeDefined();
            expect(config?.questFolder).toBe('questmaestro');
            expect(config?.wardCommands).toHaveProperty('all');
            expect(config?.wardCommands?.test).toBe('npm test');
        });
    });
});
