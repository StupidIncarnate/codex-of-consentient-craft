import { ProjectConfigStub, ProjectIdStub, ProjectStub } from '@dungeonmaster/shared/contracts';

import { projectRemoveBroker } from './project-remove-broker';
import { projectRemoveBrokerProxy } from './project-remove-broker.proxy';

describe('projectRemoveBroker', () => {
  describe('successful removal', () => {
    it('VALID: {projectId exists in config} => removes project without error', async () => {
      const proxy = projectRemoveBrokerProxy();
      const projectId = ProjectIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const project = ProjectStub({
        id: projectId,
        name: 'My App',
        path: '/home/user/my-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      proxy.setupConfig({
        config: ProjectConfigStub({ projects: [project] }),
      });

      await expect(projectRemoveBroker({ projectId })).resolves.toBeUndefined();
    });

    it('VALID: {projectId among multiple projects} => removes only matching project', async () => {
      const proxy = projectRemoveBrokerProxy();
      const projectId = ProjectIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const project1 = ProjectStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'First Project',
        path: '/home/user/first',
      });
      const project2 = ProjectStub({
        id: projectId,
        name: 'Second Project',
        path: '/home/user/second',
      });

      proxy.setupConfig({
        config: ProjectConfigStub({ projects: [project1, project2] }),
      });

      await expect(projectRemoveBroker({ projectId })).resolves.toBeUndefined();
    });
  });

  describe('error cases', () => {
    it('ERROR: {projectId not in config} => throws project not found', async () => {
      const proxy = projectRemoveBrokerProxy();
      const projectId = ProjectIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });

      proxy.setupConfig({
        config: ProjectConfigStub({ projects: [] }),
      });

      await expect(projectRemoveBroker({ projectId })).rejects.toThrow(
        /Project not found: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/u,
      );
    });

    it('ERROR: {projectId not matching any project} => throws project not found', async () => {
      const proxy = projectRemoveBrokerProxy();
      const projectId = ProjectIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const otherProject = ProjectStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Other Project',
        path: '/home/user/other',
      });

      proxy.setupConfig({
        config: ProjectConfigStub({ projects: [otherProject] }),
      });

      await expect(projectRemoveBroker({ projectId })).rejects.toThrow(
        /Project not found: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/u,
      );
    });
  });
});
