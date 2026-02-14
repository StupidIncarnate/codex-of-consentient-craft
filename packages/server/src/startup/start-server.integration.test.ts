import {
  ProjectListItemStub,
  ProjectStub,
  ProjectIdStub,
  DirectoryEntryStub,
  QuestListItemStub,
} from '@dungeonmaster/shared/contracts';
import { AddQuestResultStub } from '@dungeonmaster/orchestrator/testing';

import { StartServerProxy } from './start-server.proxy';

const toPlain = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe('StartServer', () => {
  describe('GET /api/health', () => {
    it('VALID: {} => 200 with status ok and timestamp', async () => {
      const proxy = StartServerProxy();
      const response = await proxy.request('/api/health');
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(Reflect.get(body as object, 'status')).toBe('ok');
    });
  });

  describe('GET /api/projects', () => {
    it('VALID: no projects => 200 empty array', async () => {
      const proxy = StartServerProxy();
      proxy.setupListProjects({ projects: [] });

      const response = await proxy.request('/api/projects');
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(body).toStrictEqual([]);
    });

    it('VALID: with projects => 200 array of projects', async () => {
      const proxy = StartServerProxy();
      const project1 = ProjectListItemStub();
      const project2 = ProjectListItemStub({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Second Project',
      });
      proxy.setupListProjects({ projects: [project1, project2] });

      const response = await proxy.request('/api/projects');
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(toPlain(body)).toStrictEqual(toPlain([project1, project2]));
    });

    it('INVALID: orchestrator error => 500 with error message', async () => {
      const proxy = StartServerProxy();
      proxy.setupListProjectsError({ error: new Error('list failed') });

      const response = await proxy.request('/api/projects');
      const body: unknown = await response.json();

      expect(response.status).toBe(500);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'list failed' }));
    });
  });

  describe('POST /api/projects', () => {
    it('VALID: name and path => 201 with project result', async () => {
      const proxy = StartServerProxy();
      const project = ProjectStub();
      proxy.setupAddProject({ project });

      const response = await proxy.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My Project', path: '/home/user/my-project' }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(201);
      expect(toPlain(body)).toStrictEqual(toPlain(project));
    });

    it('INVALID: non-object body => 400 with error', async () => {
      const proxy = StartServerProxy();
      const response = await proxy.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify('not-an-object'),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'Request body must be a JSON object' }));
    });

    it('INVALID: missing name => 400 with error', async () => {
      const proxy = StartServerProxy();
      const response = await proxy.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/some/path' }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'name and path are required strings' }));
    });

    it('INVALID: missing path => 400 with error', async () => {
      const proxy = StartServerProxy();
      const response = await proxy.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My Project' }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'name and path are required strings' }));
    });

    it('INVALID: orchestrator error => 500 with error message', async () => {
      const proxy = StartServerProxy();
      proxy.setupAddProjectError({ error: new Error('add failed') });

      const response = await proxy.request('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My Project', path: '/home/user/my-project' }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(500);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'add failed' }));
    });
  });

  describe('GET /api/projects/:projectId', () => {
    it('VALID: existing project => 200 with project', async () => {
      const proxy = StartServerProxy();
      const project = ProjectStub();
      proxy.setupGetProject({ project });

      const projectId = ProjectIdStub();
      const response = await proxy.request(`/api/projects/${projectId}`);
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(toPlain(body)).toStrictEqual(toPlain(project));
    });

    it('INVALID: orchestrator error => 500 with error message', async () => {
      const proxy = StartServerProxy();
      proxy.setupGetProjectError({ error: new Error('get failed') });

      const projectId = ProjectIdStub();
      const response = await proxy.request(`/api/projects/${projectId}`);
      const body: unknown = await response.json();

      expect(response.status).toBe(500);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'get failed' }));
    });
  });

  describe('PATCH /api/projects/:projectId', () => {
    it('VALID: name update => 200 with updated project', async () => {
      const proxy = StartServerProxy();
      const project = ProjectStub({ name: 'Updated Name' });
      proxy.setupUpdateProject({ project });

      const projectId = ProjectIdStub();
      const response = await proxy.request(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(toPlain(body)).toStrictEqual(toPlain(project));
    });

    it('INVALID: non-object body => 400 with error', async () => {
      const proxy = StartServerProxy();
      const projectId = ProjectIdStub();
      const response = await proxy.request(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify('not-an-object'),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'Request body must be a JSON object' }));
    });

    it('INVALID: orchestrator error => 500 with error message', async () => {
      const proxy = StartServerProxy();
      proxy.setupUpdateProjectError({ error: new Error('update failed') });

      const projectId = ProjectIdStub();
      const response = await proxy.request(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(500);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'update failed' }));
    });
  });

  describe('DELETE /api/projects/:projectId', () => {
    it('VALID: existing project => 200 with success true', async () => {
      const proxy = StartServerProxy();
      const projectId = ProjectIdStub();
      const response = await proxy.request(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(toPlain(body)).toStrictEqual({ success: true });
    });

    it('INVALID: orchestrator error => 500 with error message', async () => {
      const proxy = StartServerProxy();
      proxy.setupRemoveProjectError({ error: new Error('remove failed') });

      const projectId = ProjectIdStub();
      const response = await proxy.request(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(500);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'remove failed' }));
    });
  });

  describe('POST /api/directories/browse', () => {
    it('VALID: empty path => 200 with entries', async () => {
      const proxy = StartServerProxy();
      const entries = [DirectoryEntryStub()];
      proxy.setupBrowseDirectories({ entries });

      const response = await proxy.request('/api/directories/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(toPlain(body)).toStrictEqual(toPlain(entries));
    });

    it('VALID: with path => 200 with entries', async () => {
      const proxy = StartServerProxy();
      const entries = [DirectoryEntryStub({ name: 'sub-folder', path: '/home/user/sub-folder' })];
      proxy.setupBrowseDirectories({ entries });

      const response = await proxy.request('/api/directories/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/home/user' }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(toPlain(body)).toStrictEqual(toPlain(entries));
    });

    it('INVALID: orchestrator error => 500 with error message', async () => {
      const proxy = StartServerProxy();
      proxy.setupBrowseDirectoriesError({ error: new Error('browse failed') });

      const response = await proxy.request('/api/directories/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(500);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'browse failed' }));
    });
  });

  describe('GET /api/quests', () => {
    it('VALID: with projectId => 200 with quests', async () => {
      const proxy = StartServerProxy();
      const quests = [QuestListItemStub()];
      proxy.setupListQuests({ quests });

      const projectId = ProjectIdStub();
      const response = await proxy.request(`/api/quests?projectId=${projectId}`);
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(toPlain(body)).toStrictEqual(toPlain(quests));
    });

    it('INVALID: missing projectId => 400 with error', async () => {
      const proxy = StartServerProxy();
      const response = await proxy.request('/api/quests');
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(toPlain(body)).toStrictEqual(
        toPlain({ error: 'projectId query parameter is required' }),
      );
    });

    it('INVALID: orchestrator error => 500 with error message', async () => {
      const proxy = StartServerProxy();
      proxy.setupListQuestsError({ error: new Error('list quests failed') });

      const projectId = ProjectIdStub();
      const response = await proxy.request(`/api/quests?projectId=${projectId}`);
      const body: unknown = await response.json();

      expect(response.status).toBe(500);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'list quests failed' }));
    });
  });

  describe('POST /api/quests', () => {
    it('VALID: title, userRequest, projectId => 201 with result', async () => {
      const proxy = StartServerProxy();
      const result = AddQuestResultStub();
      proxy.setupAddQuest({ result });

      const projectId = ProjectIdStub();
      const response = await proxy.request('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Quest',
          userRequest: 'Build a feature',
          projectId,
        }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(201);
      expect(toPlain(body)).toStrictEqual(toPlain(result));
    });

    it('INVALID: missing title => 400 with error', async () => {
      const proxy = StartServerProxy();
      const projectId = ProjectIdStub();
      const response = await proxy.request('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRequest: 'Build a feature', projectId }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(toPlain(body)).toStrictEqual(
        toPlain({ error: 'title and userRequest are required strings' }),
      );
    });

    it('INVALID: missing projectId => 400 with error', async () => {
      const proxy = StartServerProxy();
      const response = await proxy.request('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Quest', userRequest: 'Build a feature' }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'projectId is required' }));
    });

    it('INVALID: orchestrator error => 500 with error message', async () => {
      const proxy = StartServerProxy();
      proxy.setupAddQuestError({ error: new Error('add quest failed') });

      const projectId = ProjectIdStub();
      const response = await proxy.request('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Quest',
          userRequest: 'Build a feature',
          projectId,
        }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(500);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'add quest failed' }));
    });
  });

  describe('GET /', () => {
    it('VALID: {} => 302 redirect to localhost:5173', async () => {
      const proxy = StartServerProxy();
      const response = await proxy.request('/');

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('http://localhost:5173');
    });
  });

  describe('GET /api/docs/architecture', () => {
    it('VALID: {} => 200 with content', async () => {
      const proxy = StartServerProxy();
      const response = await proxy.request('/api/docs/architecture');
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(typeof Reflect.get(body as object, 'content')).toBe('string');
    });
  });

  describe('GET /api/docs/syntax-rules', () => {
    it('VALID: {} => 200 with content', async () => {
      const proxy = StartServerProxy();
      const response = await proxy.request('/api/docs/syntax-rules');
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(typeof Reflect.get(body as object, 'content')).toBe('string');
    });
  });
});
