import {
  GuildListItemStub,
  GuildStub,
  GuildIdStub,
  DirectoryEntryStub,
  QuestListItemStub,
  SessionIdStub,
  ProcessIdStub,
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

  describe('GET /api/guilds', () => {
    it('VALID: no guilds => 200 empty array', async () => {
      const proxy = StartServerProxy();
      proxy.setupListGuilds({ guilds: [] });

      const response = await proxy.request('/api/guilds');
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(body).toStrictEqual([]);
    });

    it('VALID: with guilds => 200 array of guilds', async () => {
      const proxy = StartServerProxy();
      const guild1 = GuildListItemStub();
      const guild2 = GuildListItemStub({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Second Guild',
      });
      proxy.setupListGuilds({ guilds: [guild1, guild2] });

      const response = await proxy.request('/api/guilds');
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(toPlain(body)).toStrictEqual(toPlain([guild1, guild2]));
    });

    it('INVALID: orchestrator error => 500 with error message', async () => {
      const proxy = StartServerProxy();
      proxy.setupListGuildsError({ error: new Error('list failed') });

      const response = await proxy.request('/api/guilds');
      const body: unknown = await response.json();

      expect(response.status).toBe(500);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'list failed' }));
    });
  });

  describe('POST /api/guilds', () => {
    it('VALID: name and path => 201 with guild result', async () => {
      const proxy = StartServerProxy();
      const guild = GuildStub();
      proxy.setupAddGuild({ guild });

      const response = await proxy.request('/api/guilds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My Guild', path: '/home/user/my-guild' }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(201);
      expect(toPlain(body)).toStrictEqual(toPlain(guild));
    });

    it('INVALID: non-object body => 400 with error', async () => {
      const proxy = StartServerProxy();
      const response = await proxy.request('/api/guilds', {
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
      const response = await proxy.request('/api/guilds', {
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
      const response = await proxy.request('/api/guilds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My Guild' }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'name and path are required strings' }));
    });

    it('INVALID: orchestrator error => 500 with error message', async () => {
      const proxy = StartServerProxy();
      proxy.setupAddGuildError({ error: new Error('add failed') });

      const response = await proxy.request('/api/guilds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My Guild', path: '/home/user/my-guild' }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(500);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'add failed' }));
    });
  });

  describe('GET /api/guilds/:guildId', () => {
    it('VALID: existing guild => 200 with guild', async () => {
      const proxy = StartServerProxy();
      const guild = GuildStub();
      proxy.setupGetGuild({ guild });

      const guildId = GuildIdStub();
      const response = await proxy.request(`/api/guilds/${guildId}`);
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(toPlain(body)).toStrictEqual(toPlain(guild));
    });

    it('INVALID: orchestrator error => 500 with error message', async () => {
      const proxy = StartServerProxy();
      proxy.setupGetGuildError({ error: new Error('get failed') });

      const guildId = GuildIdStub();
      const response = await proxy.request(`/api/guilds/${guildId}`);
      const body: unknown = await response.json();

      expect(response.status).toBe(500);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'get failed' }));
    });
  });

  describe('PATCH /api/guilds/:guildId', () => {
    it('VALID: name update => 200 with updated guild', async () => {
      const proxy = StartServerProxy();
      const guild = GuildStub({ name: 'Updated Name' });
      proxy.setupUpdateGuild({ guild });

      const guildId = GuildIdStub();
      const response = await proxy.request(`/api/guilds/${guildId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(toPlain(body)).toStrictEqual(toPlain(guild));
    });

    it('INVALID: non-object body => 400 with error', async () => {
      const proxy = StartServerProxy();
      const guildId = GuildIdStub();
      const response = await proxy.request(`/api/guilds/${guildId}`, {
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
      proxy.setupUpdateGuildError({ error: new Error('update failed') });

      const guildId = GuildIdStub();
      const response = await proxy.request(`/api/guilds/${guildId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(500);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'update failed' }));
    });
  });

  describe('DELETE /api/guilds/:guildId', () => {
    it('VALID: existing guild => 200 with success true', async () => {
      const proxy = StartServerProxy();
      const guildId = GuildIdStub();
      const response = await proxy.request(`/api/guilds/${guildId}`, {
        method: 'DELETE',
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(toPlain(body)).toStrictEqual({ success: true });
    });

    it('INVALID: orchestrator error => 500 with error message', async () => {
      const proxy = StartServerProxy();
      proxy.setupRemoveGuildError({ error: new Error('remove failed') });

      const guildId = GuildIdStub();
      const response = await proxy.request(`/api/guilds/${guildId}`, {
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
    it('VALID: with guildId => 200 with quests', async () => {
      const proxy = StartServerProxy();
      const quests = [QuestListItemStub()];
      proxy.setupListQuests({ quests });

      const guildId = GuildIdStub();
      const response = await proxy.request(`/api/quests?guildId=${guildId}`);
      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(toPlain(body)).toStrictEqual(toPlain(quests));
    });

    it('INVALID: missing guildId => 400 with error', async () => {
      const proxy = StartServerProxy();
      const response = await proxy.request('/api/quests');
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(toPlain(body)).toStrictEqual(
        toPlain({ error: 'guildId query parameter is required' }),
      );
    });

    it('INVALID: orchestrator error => 500 with error message', async () => {
      const proxy = StartServerProxy();
      proxy.setupListQuestsError({ error: new Error('list quests failed') });

      const guildId = GuildIdStub();
      const response = await proxy.request(`/api/quests?guildId=${guildId}`);
      const body: unknown = await response.json();

      expect(response.status).toBe(500);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'list quests failed' }));
    });
  });

  describe('POST /api/quests', () => {
    it('VALID: title, userRequest, guildId => 201 with result', async () => {
      const proxy = StartServerProxy();
      const result = AddQuestResultStub();
      proxy.setupAddQuest({ result });

      const guildId = GuildIdStub();
      const response = await proxy.request('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Quest',
          userRequest: 'Build a feature',
          guildId,
        }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(201);
      expect(toPlain(body)).toStrictEqual(toPlain(result));
    });

    it('INVALID: missing title => 400 with error', async () => {
      const proxy = StartServerProxy();
      const guildId = GuildIdStub();
      const response = await proxy.request('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRequest: 'Build a feature', guildId }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(toPlain(body)).toStrictEqual(
        toPlain({ error: 'title and userRequest are required strings' }),
      );
    });

    it('INVALID: missing guildId => 400 with error', async () => {
      const proxy = StartServerProxy();
      const response = await proxy.request('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Quest', userRequest: 'Build a feature' }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(400);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'guildId is required' }));
    });

    it('INVALID: orchestrator error => 500 with error message', async () => {
      const proxy = StartServerProxy();
      proxy.setupAddQuestError({ error: new Error('add quest failed') });

      const guildId = GuildIdStub();
      const response = await proxy.request('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Quest',
          userRequest: 'Build a feature',
          guildId,
        }),
      });
      const body: unknown = await response.json();

      expect(response.status).toBe(500);
      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'add quest failed' }));
    });
  });

  describe('GET /', () => {
    it('VALID: {} => 302 redirect to web SPA port', async () => {
      const proxy = StartServerProxy();
      const response = await proxy.request('/');

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('http://dungeonmaster.localhost:3738');
    });
  });

  describe('POST /api/sessions/new', () => {
    it('VALID: {guildId, message} => 200 with chatProcessId', async () => {
      const proxy = StartServerProxy();
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-001' });
      proxy.setupStartChat({ chatProcessId });
      const guildId = GuildIdStub();

      const response = await proxy.request('/api/sessions/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId, message: 'hello' }),
      });

      expect(response.status).toBe(200);

      const body: unknown = await response.json();

      expect(toPlain(body)).toStrictEqual(toPlain({ chatProcessId: 'chat-proc-001' }));
    });

    it('INVALID: {missing message} => 400 with error', async () => {
      const proxy = StartServerProxy();
      const guildId = GuildIdStub();

      const response = await proxy.request('/api/sessions/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId }),
      });

      expect(response.status).toBe(400);

      const body: unknown = await response.json();

      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'message is required' }));
    });

    it('INVALID: {missing guildId} => 400 with error', async () => {
      const proxy = StartServerProxy();

      const response = await proxy.request('/api/sessions/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'hello' }),
      });

      expect(response.status).toBe(400);

      const body: unknown = await response.json();

      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'guildId is required' }));
    });
  });

  describe('POST /api/sessions/:sessionId/chat', () => {
    it('VALID: {message, guildId, sessionId} => 200 with chatProcessId', async () => {
      const proxy = StartServerProxy();
      const chatProcessId = ProcessIdStub({ value: 'session-proc-001' });
      proxy.setupStartChat({ chatProcessId });
      const sessionId = SessionIdStub();
      const guildId = GuildIdStub();

      const response = await proxy.request(`/api/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'continue work', guildId }),
      });

      expect(response.status).toBe(200);

      const body: unknown = await response.json();

      expect(toPlain(body)).toStrictEqual(toPlain({ chatProcessId: 'session-proc-001' }));
    });

    it('INVALID: {missing message} => 400 with error', async () => {
      const proxy = StartServerProxy();
      const sessionId = SessionIdStub();
      const guildId = GuildIdStub();

      const response = await proxy.request(`/api/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId }),
      });

      expect(response.status).toBe(400);

      const body: unknown = await response.json();

      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'message is required' }));
    });

    it('INVALID: {missing guildId} => 400 with error', async () => {
      const proxy = StartServerProxy();
      const sessionId = SessionIdStub();

      const response = await proxy.request(`/api/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'hello' }),
      });

      expect(response.status).toBe(400);

      const body: unknown = await response.json();

      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'guildId is required' }));
    });

    it('INVALID: {non-object body} => 400 with error', async () => {
      const proxy = StartServerProxy();
      const sessionId = SessionIdStub();

      const response = await proxy.request(`/api/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify('not-an-object'),
      });

      expect(response.status).toBe(400);

      const body: unknown = await response.json();

      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'Request body must be a JSON object' }));
    });
  });

  describe('WebSocket replay-history message', () => {
    it('VALID: {type: "replay-history", sessionId, guildId, chatProcessId} => calls replayChatHistory', async () => {
      const proxy = StartServerProxy();
      const sessionId = SessionIdStub();
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub();

      proxy.simulateWsMessage({
        data: JSON.stringify({
          type: 'replay-history',
          sessionId,
          guildId,
          chatProcessId,
        }),
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      const calls = proxy.getCapturedReplayChatHistoryCalls();

      expect(calls).toStrictEqual([[{ sessionId, guildId, chatProcessId }]]);
    });

    it('INVALID: {type: "replay-history", missing sessionId} => does not call replayChatHistory', async () => {
      const proxy = StartServerProxy();
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub();

      proxy.simulateWsMessage({
        data: JSON.stringify({
          type: 'replay-history',
          guildId,
          chatProcessId,
        }),
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      const calls = proxy.getCapturedReplayChatHistoryCalls();

      expect(calls).toStrictEqual([]);
    });

    it('INVALID: {type: "replay-history", missing guildId} => does not call replayChatHistory', async () => {
      const proxy = StartServerProxy();
      const sessionId = SessionIdStub();
      const chatProcessId = ProcessIdStub();

      proxy.simulateWsMessage({
        data: JSON.stringify({
          type: 'replay-history',
          sessionId,
          chatProcessId,
        }),
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      const calls = proxy.getCapturedReplayChatHistoryCalls();

      expect(calls).toStrictEqual([]);
    });

    it('INVALID: {non-JSON data} => does not call replayChatHistory', async () => {
      const proxy = StartServerProxy();

      proxy.simulateWsMessage({
        data: 'not-json',
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      const calls = proxy.getCapturedReplayChatHistoryCalls();

      expect(calls).toStrictEqual([]);
    });

    it('INVALID: {non-object data} => does not call replayChatHistory', async () => {
      const proxy = StartServerProxy();

      proxy.simulateWsMessage({
        data: JSON.stringify('a string'),
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      const calls = proxy.getCapturedReplayChatHistoryCalls();

      expect(calls).toStrictEqual([]);
    });

    it('INVALID: {null data} => does not call replayChatHistory', async () => {
      const proxy = StartServerProxy();

      proxy.simulateWsMessage({
        data: JSON.stringify(null),
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      const calls = proxy.getCapturedReplayChatHistoryCalls();

      expect(calls).toStrictEqual([]);
    });

    it('EDGE: {unknown type} => does not call replayChatHistory', async () => {
      const proxy = StartServerProxy();

      proxy.simulateWsMessage({
        data: JSON.stringify({ type: 'unknown-type' }),
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      const calls = proxy.getCapturedReplayChatHistoryCalls();

      expect(calls).toStrictEqual([]);
    });
  });

  describe('POST /api/sessions/:sessionId/chat/:chatProcessId/stop', () => {
    it('VALID: {existing process} => 200 with stopped true', async () => {
      const proxy = StartServerProxy();
      proxy.setupStopChat({ stopped: true });
      const sessionId = SessionIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-active-123' });

      const stopResponse = await proxy.request(
        `/api/sessions/${sessionId}/chat/${chatProcessId}/stop`,
        { method: 'POST' },
      );

      expect(stopResponse.status).toBe(200);

      const stopBody: unknown = await stopResponse.json();

      expect(toPlain(stopBody)).toStrictEqual(toPlain({ stopped: true }));
    });

    it('INVALID: {non-existent process} => 404 with error', async () => {
      const proxy = StartServerProxy();
      proxy.setupStopChat({ stopped: false });
      const sessionId = SessionIdStub();
      const fakeProcessId = ProcessIdStub();

      const response = await proxy.request(
        `/api/sessions/${sessionId}/chat/${fakeProcessId}/stop`,
        { method: 'POST' },
      );

      expect(response.status).toBe(404);

      const body: unknown = await response.json();

      expect(toPlain(body)).toStrictEqual(
        toPlain({ error: 'Process not found or already exited' }),
      );
    });
  });
});
