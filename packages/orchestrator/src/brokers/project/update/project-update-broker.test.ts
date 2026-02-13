import {
  ProjectConfigStub,
  ProjectIdStub,
  ProjectNameStub,
  ProjectPathStub,
  ProjectStub,
} from '@dungeonmaster/shared/contracts';

import { projectUpdateBroker } from './project-update-broker';
import { projectUpdateBrokerProxy } from './project-update-broker.proxy';

describe('projectUpdateBroker', () => {
  describe('successful update', () => {
    it('VALID: {projectId, name} => returns project with updated name', async () => {
      const proxy = projectUpdateBrokerProxy();
      const projectId = ProjectIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const project = ProjectStub({
        id: projectId,
        name: 'Old Name',
        path: '/home/user/my-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const newName = ProjectNameStub({ value: 'New Name' });

      proxy.setupConfig({
        config: ProjectConfigStub({ projects: [project] }),
      });

      const result = await projectUpdateBroker({ projectId, name: newName });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'New Name',
        path: '/home/user/my-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {projectId, path} => returns project with updated path', async () => {
      const proxy = projectUpdateBrokerProxy();
      const projectId = ProjectIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const project = ProjectStub({
        id: projectId,
        name: 'My App',
        path: '/home/user/old-path',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const newPath = ProjectPathStub({ value: '/home/user/new-path' });

      proxy.setupConfig({
        config: ProjectConfigStub({ projects: [project] }),
      });

      const result = await projectUpdateBroker({ projectId, path: newPath });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My App',
        path: '/home/user/new-path',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {projectId, name, path} => returns project with both updated', async () => {
      const proxy = projectUpdateBrokerProxy();
      const projectId = ProjectIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const project = ProjectStub({
        id: projectId,
        name: 'Old Name',
        path: '/home/user/old-path',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const newName = ProjectNameStub({ value: 'New Name' });
      const newPath = ProjectPathStub({ value: '/home/user/new-path' });

      proxy.setupConfig({
        config: ProjectConfigStub({ projects: [project] }),
      });

      const result = await projectUpdateBroker({ projectId, name: newName, path: newPath });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'New Name',
        path: '/home/user/new-path',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {projectId among multiple projects} => updates only matching project', async () => {
      const proxy = projectUpdateBrokerProxy();
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
      const newName = ProjectNameStub({ value: 'Updated Second' });

      proxy.setupConfig({
        config: ProjectConfigStub({ projects: [project1, project2] }),
      });

      const result = await projectUpdateBroker({ projectId, name: newName });

      expect(result).toStrictEqual({
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        name: 'Updated Second',
        path: '/home/user/second',
        createdAt: '2024-02-20T12:00:00.000Z',
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {projectId not in config} => throws project not found', async () => {
      const proxy = projectUpdateBrokerProxy();
      const projectId = ProjectIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const newName = ProjectNameStub({ value: 'New Name' });

      proxy.setupConfig({
        config: ProjectConfigStub({ projects: [] }),
      });

      await expect(projectUpdateBroker({ projectId, name: newName })).rejects.toThrow(
        /Project not found: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/u,
      );
    });

    it('ERROR: {path already used by another project} => throws duplicate path error', async () => {
      const proxy = projectUpdateBrokerProxy();
      const projectId = ProjectIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const project1 = ProjectStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'First Project',
        path: '/home/user/taken-path',
      });
      const project2 = ProjectStub({
        id: projectId,
        name: 'Second Project',
        path: '/home/user/second',
      });
      const duplicatePath = ProjectPathStub({ value: '/home/user/taken-path' });

      proxy.setupConfig({
        config: ProjectConfigStub({ projects: [project1, project2] }),
      });

      await expect(projectUpdateBroker({ projectId, path: duplicatePath })).rejects.toThrow(
        /A project with path \/home\/user\/taken-path already exists/u,
      );
    });

    it('EDGE: {path same as own current path} => succeeds without duplicate error', async () => {
      const proxy = projectUpdateBrokerProxy();
      const projectId = ProjectIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const project = ProjectStub({
        id: projectId,
        name: 'My App',
        path: '/home/user/my-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
      const samePath = ProjectPathStub({ value: '/home/user/my-app' });

      proxy.setupConfig({
        config: ProjectConfigStub({ projects: [project] }),
      });

      const result = await projectUpdateBroker({ projectId, path: samePath });

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'My App',
        path: '/home/user/my-app',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });
  });
});
