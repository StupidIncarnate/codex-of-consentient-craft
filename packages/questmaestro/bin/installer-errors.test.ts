import { TestProject, createTestProject } from '@questmaestro/testing';
import * as path from 'path';
import * as fs from 'fs';

describe('Installer Error Handling', () => {
  let testProject: TestProject;

  beforeEach(() => {
    testProject = createTestProject('error-test');
  });

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  describe('Permission Errors', () => {
    it('should handle read-only questmaestro directory', () => {
      // Create questmaestro directory first
      const questDir = path.join(testProject.rootDir, 'questmaestro');
      fs.mkdirSync(questDir, { recursive: true });

      // Make questmaestro directory read-only
      fs.chmodSync(questDir, 0o444);

      let error;
      try {
        testProject.installQuestmaestro();
      } catch (e) {
        error = e;
      } finally {
        // Restore permissions for cleanup
        fs.chmodSync(questDir, 0o755);
      }

      // Should get permission error
      expect(error).toBeDefined();
    });
  });

  describe('File System Errors', () => {
    it('should handle missing source files gracefully', () => {
      // This tests if our package structure is intact
      const sourceFiles = [
        path.join(process.cwd(), 'src', 'commands', 'quest', 'pathseeker.md'),
        path.join(process.cwd(), 'src', 'templates', 'questmaestro.json'),
        path.join(process.cwd(), 'src', 'templates', 'lore-categories.md'),
      ];

      for (const file of sourceFiles) {
        expect(fs.existsSync(file)).toBe(true);
      }
    });

    it('should create nested directories if they do not exist', () => {
      // Remove questmaestro directory to test creation
      const questDir = path.join(testProject.rootDir, 'questmaestro');
      if (fs.existsSync(questDir)) {
        fs.rmSync(questDir, { recursive: true });
      }

      testProject.installQuestmaestro();

      // All directories should be created
      expect(testProject.fileExists('questmaestro')).toBe(true);
      expect(testProject.fileExists('questmaestro/active')).toBe(true);
      expect(testProject.fileExists('questmaestro/completed')).toBe(true);
    });

    it('should handle partial installation state', () => {
      // Create partial installation - only config file
      testProject.writeFile('.questmaestro', '{}');
      // But no quest directories

      const output = testProject.installQuestmaestro();

      // Should complete installation
      expect(output).toContain('Quest System Installed!');

      // Should have all directories now
      expect(testProject.fileExists('questmaestro')).toBe(true);
      expect(testProject.fileExists('questmaestro/active')).toBe(true);
      expect(testProject.fileExists('questmaestro/completed')).toBe(true);
    });
  });
});
