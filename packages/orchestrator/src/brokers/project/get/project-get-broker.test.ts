import { ProjectConfigStub, ProjectIdStub, ProjectStub } from '@dungeonmaster/shared/contracts';

import { projectGetBroker } from './project-get-broker';
import { projectGetBrokerProxy } from './project-get-broker.proxy';

describe('projectGetBroker', () => {
  describe('successful retrieval', () => {
    it('VALID: {projectId exists} => returns project', async () => {
      const proxy = projectGetBrokerProxy();
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

      const result = await projectGetBroker({ projectId });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My App',
        path: '/home/user/my-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {projectId among multiple projects} => returns matching project', async () => {
      const proxy = projectGetBrokerProxy();
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
        createdAt: '2024-02-20T12:00:00.000Z',
      });

      proxy.setupConfig({
        config: ProjectConfigStub({ projects: [project1, project2] }),
      });

      const result = await projectGetBroker({ projectId });

      expect(result).toStrictEqual({
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        name: 'Second Project',
        path: '/home/user/second',
        createdAt: '2024-02-20T12:00:00.000Z',
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {projectId not in config} => throws project not found', async () => {
      const proxy = projectGetBrokerProxy();
      const projectId = ProjectIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });

      proxy.setupConfig({
        config: ProjectConfigStub({ projects: [] }),
      });

      await expect(projectGetBroker({ projectId })).rejects.toThrow(
        /Project not found: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/u,
      );
    });

    it('ERROR: {projectId not matching any project} => throws project not found', async () => {
      const proxy = projectGetBrokerProxy();
      const projectId = ProjectIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const otherProject = ProjectStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Other Project',
        path: '/home/user/other',
      });

      proxy.setupConfig({
        config: ProjectConfigStub({ projects: [otherProject] }),
      });

      await expect(projectGetBroker({ projectId })).rejects.toThrow(
        /Project not found: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/u,
      );
    });
  });
});
