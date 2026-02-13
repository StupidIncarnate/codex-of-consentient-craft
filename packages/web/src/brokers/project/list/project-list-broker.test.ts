import { ProjectListItemStub } from '@dungeonmaster/shared/contracts';

import { projectListBroker } from './project-list-broker';
import { projectListBrokerProxy } from './project-list-broker.proxy';

describe('projectListBroker', () => {
  describe('successful fetch', () => {
    it('VALID: {} => returns project list from API', async () => {
      const proxy = projectListBrokerProxy();
      const projects = [
        ProjectListItemStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'First Project' }),
        ProjectListItemStub({ id: 'a1b2c3d4-5678-9abc-def0-123456789abc', name: 'Second Project' }),
      ];

      proxy.setupProjects({ projects });

      const result = await projectListBroker();

      expect(result).toStrictEqual(projects);
    });
  });

  describe('empty list', () => {
    it('EMPTY: {} => returns empty array', async () => {
      const proxy = projectListBrokerProxy();

      proxy.setupProjects({ projects: [] });

      const result = await projectListBroker();

      expect(result).toStrictEqual([]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network failure} => throws error', async () => {
      const proxy = projectListBrokerProxy();

      proxy.setupError({ error: new Error('Network failure') });

      await expect(projectListBroker()).rejects.toThrow('Network failure');
    });
  });

  describe('zod validation', () => {
    it('ERROR: {fetch returns invalid shape} => throws ZodError', async () => {
      const proxy = projectListBrokerProxy();

      proxy.setupInvalidResponse({ data: [{ bad: 'data' }] });

      await expect(projectListBroker()).rejects.toThrow(/invalid_type/u);
    });
  });
});
