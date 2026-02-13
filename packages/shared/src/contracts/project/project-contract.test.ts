import { projectContract } from './project-contract';
import { ProjectStub } from './project.stub';

describe('projectContract', () => {
  describe('valid projects', () => {
    it('VALID: full project => parses successfully', () => {
      const project = ProjectStub();

      const result = projectContract.parse(project);

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My Project',
        path: '/home/user/my-project',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: project with custom name => parses successfully', () => {
      const project = ProjectStub({ name: 'Custom Project' });

      const result = projectContract.parse(project);

      expect(result.name).toBe('Custom Project');
    });

    it('VALID: project with custom path => parses successfully', () => {
      const project = ProjectStub({ path: '/tmp/other-project' });

      const result = projectContract.parse(project);

      expect(result.path).toBe('/tmp/other-project');
    });
  });

  describe('invalid projects', () => {
    it('INVALID: missing required fields => throws validation error', () => {
      expect(() => {
        projectContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: invalid id => throws validation error', () => {
      const baseProject = ProjectStub();

      expect(() => {
        projectContract.parse({
          ...baseProject,
          id: 'not-a-uuid',
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID: invalid createdAt => throws validation error', () => {
      const baseProject = ProjectStub();

      expect(() => {
        projectContract.parse({
          ...baseProject,
          createdAt: 'not-a-timestamp',
        });
      }).toThrow(/Invalid datetime/u);
    });
  });
});
