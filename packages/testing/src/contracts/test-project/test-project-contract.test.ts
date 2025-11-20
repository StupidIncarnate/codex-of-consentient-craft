import { testProjectContract } from './test-project-contract';
import { TestProjectStub } from './test-project.stub';

describe('testProjectContract', () => {
  describe('valid inputs', () => {
    it('VALID: {projectPath, projectName, rootDir} => parses all data properties', () => {
      const project = TestProjectStub({
        projectPath: '/tmp/test-123',
        projectName: 'test-123',
        rootDir: '/tmp/test-123',
      });

      const parsed = testProjectContract.parse({
        projectPath: project.projectPath,
        projectName: project.projectName,
        rootDir: project.rootDir,
      });

      expect(parsed).toStrictEqual({
        projectPath: '/tmp/test-123',
        projectName: 'test-123',
        rootDir: '/tmp/test-123',
      });
    });

    it('VALID: {with absolute paths} => parses absolute project paths', () => {
      const project = TestProjectStub({
        projectPath: '/home/user/projects/test-project',
        projectName: 'test-project',
        rootDir: '/home/user/projects/test-project',
      });

      const parsed = testProjectContract.parse({
        projectPath: project.projectPath,
        projectName: project.projectName,
        rootDir: project.rootDir,
      });

      expect(parsed).toStrictEqual({
        projectPath: '/home/user/projects/test-project',
        projectName: 'test-project',
        rootDir: '/home/user/projects/test-project',
      });
    });

    it('VALID: {with different rootDir} => parses when rootDir differs from projectPath', () => {
      const project = TestProjectStub({
        projectPath: '/tmp/test-project-abc',
        projectName: 'test-project-abc',
        rootDir: '/tmp',
      });

      const parsed = testProjectContract.parse({
        projectPath: project.projectPath,
        projectName: project.projectName,
        rootDir: project.rootDir,
      });

      expect(parsed).toStrictEqual({
        projectPath: '/tmp/test-project-abc',
        projectName: 'test-project-abc',
        rootDir: '/tmp',
      });
    });

    it('VALID: {stub defaults} => parses with default values from stub', () => {
      const project = TestProjectStub();

      const parsed = testProjectContract.parse({
        projectPath: project.projectPath,
        projectName: project.projectName,
        rootDir: project.rootDir,
      });

      expect(parsed).toStrictEqual({
        projectPath: '/tmp/test-project-abc123',
        projectName: 'test-project-abc123',
        rootDir: '/tmp/test-project-abc123',
      });
    });

    it('EDGE: {projectName with special chars} => parses project name with hyphens', () => {
      const project = TestProjectStub({
        projectPath: '/tmp/test-project-123-abc',
        projectName: 'test-project-123-abc',
        rootDir: '/tmp/test-project-123-abc',
      });

      const parsed = testProjectContract.parse({
        projectPath: project.projectPath,
        projectName: project.projectName,
        rootDir: project.rootDir,
      });

      expect(parsed).toStrictEqual({
        projectPath: '/tmp/test-project-123-abc',
        projectName: 'test-project-123-abc',
        rootDir: '/tmp/test-project-123-abc',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_PROJECT_PATH: {projectPath: 123} => throws validation error for non-string', () => {
      expect(() => {
        return testProjectContract.parse({
          projectPath: 123 as never,
          projectName: 'test',
          rootDir: '/tmp',
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_PROJECT_PATH: {projectPath: null} => throws validation error for null', () => {
      expect(() => {
        return testProjectContract.parse({
          projectPath: null as never,
          projectName: 'test',
          rootDir: '/tmp',
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_PROJECT_NAME: {projectName: 123} => throws validation error for non-string', () => {
      expect(() => {
        return testProjectContract.parse({
          projectPath: '/tmp/test',
          projectName: 123 as never,
          rootDir: '/tmp',
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_ROOT_DIR: {rootDir: []} => throws validation error for array', () => {
      expect(() => {
        return testProjectContract.parse({
          projectPath: '/tmp/test',
          projectName: 'test',
          rootDir: [] as never,
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID_MULTIPLE: {missing projectPath and projectName} => throws validation error', () => {
      expect(() => {
        return testProjectContract.parse({
          rootDir: '/tmp',
        });
      }).toThrow(/Required/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error for empty object', () => {
      expect(() => {
        return testProjectContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID_MULTIPLE: {only projectPath} => throws validation error for missing fields', () => {
      expect(() => {
        return testProjectContract.parse({
          projectPath: '/tmp/test',
        });
      }).toThrow(/Required/u);
    });
  });
});
