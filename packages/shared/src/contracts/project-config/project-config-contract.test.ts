import { ProjectStub } from '../project/project.stub';
import { projectConfigContract } from './project-config-contract';
import { ProjectConfigStub } from './project-config.stub';

describe('projectConfigContract', () => {
  describe('valid configs', () => {
    it('VALID: empty projects => parses successfully', () => {
      const config = ProjectConfigStub();

      const result = projectConfigContract.parse(config);

      expect(result).toStrictEqual({
        projects: [],
      });
    });

    it('VALID: config with projects => parses successfully', () => {
      const project = ProjectStub();
      const config = ProjectConfigStub({
        projects: [project],
      });

      const result = projectConfigContract.parse(config);

      expect(result.projects).toStrictEqual([project]);
    });

    it('VALID: missing projects field => defaults to empty array', () => {
      const result = projectConfigContract.parse({});

      expect(result.projects).toStrictEqual([]);
    });
  });

  describe('invalid configs', () => {
    it('INVALID: invalid project in array => throws validation error', () => {
      expect(() => {
        projectConfigContract.parse({
          projects: [{ id: 'not-a-uuid' }],
        });
      }).toThrow(/Invalid uuid/u);
    });
  });
});
