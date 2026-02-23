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

  describe('POST /api/guilds/:guildId/chat (streaming)', () => {
    const STREAM_SETTLE_MS = 50;

    const setupGuildChatStreamContext = (): ReturnType<typeof StartServerProxy> => {
      const proxy = StartServerProxy();
      const guild = GuildStub();
      proxy.setupGetGuild({ guild });
      return proxy;
    };

    it('VALID: {stream with tool_use lines} => broadcasts all lines including tool calls via WebSocket', async () => {
      const proxy = setupGuildChatStreamContext();
      const chat = proxy.setupChatSpawn();
      const guildId = GuildIdStub();

      const response = await proxy.request(`/api/guilds/${guildId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'hello' }),
      });

      expect(response.status).toBe(200);

      const body: unknown = await response.json();

      expect(Reflect.get(body as object, 'chatProcessId')).toBeDefined();

      chat.emitLine(
        '{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Let me check"}]}}',
      );
      chat.emitLine(
        '{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","id":"tu_1","name":"Read","input":{"path":"/bar"}}]}}',
      );
      chat.emitLine('{"type":"tool_result","content":"file data"}');
      chat.emitLine(
        '{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Done"}]}}',
      );

      await new Promise<void>((resolve) => {
        setTimeout(resolve, STREAM_SETTLE_MS);
      });

      const messages = proxy.getBroadcastedMessages();
      const chatOutputs = messages.filter((m) => m.type === 'chat-output');

      expect(chatOutputs).toHaveLength(4);

      const lines = chatOutputs.map((m) => String(Reflect.get(m.payload as object, 'line')));

      expect(lines.some((l) => l.includes('tool_use'))).toBe(true);
      expect(lines.some((l) => l.includes('tool_result'))).toBe(true);
    });

    it('VALID: {stream lines then exit} => broadcasts all outputs then chat-complete', async () => {
      const proxy = setupGuildChatStreamContext();
      const chat = proxy.setupChatSpawn();
      const guildId = GuildIdStub();

      await proxy.request(`/api/guilds/${guildId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'hello' }),
      });

      chat.emitLine('{"type":"assistant","message":"thinking"}');
      chat.emitLine(
        '{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","id":"tu_1","name":"Grep","input":{"pattern":"foo"}}]}}',
      );
      chat.emitLine('{"type":"tool_result","content":"match found"}');

      await new Promise<void>((resolve) => {
        setTimeout(resolve, STREAM_SETTLE_MS);
      });

      chat.emitExit(0);

      await new Promise<void>((resolve) => {
        setTimeout(resolve, STREAM_SETTLE_MS);
      });

      const messages = proxy.getBroadcastedMessages();
      const chatOutputs = messages.filter((m) => m.type === 'chat-output');
      const chatCompletes = messages.filter((m) => m.type === 'chat-complete');

      expect(chatOutputs).toHaveLength(3);
      expect(chatCompletes).toHaveLength(1);
      expect(Reflect.get(chatCompletes[0]?.payload as object, 'exitCode')).toBe(0);
    });

    it('INVALID: {missing message} => 400 with error', async () => {
      const proxy = setupGuildChatStreamContext();
      proxy.setupChatSpawn();
      const guildId = GuildIdStub();

      const response = await proxy.request(`/api/guilds/${guildId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);

      const body: unknown = await response.json();

      expect(toPlain(body)).toStrictEqual(toPlain({ error: 'message is required' }));
    });

    it('VALID: {new session, no sessionId} => spawns Claude CLI with ChaosWhisperer prompt prepended to message', async () => {
      const proxy = setupGuildChatStreamContext();
      proxy.setupChatSpawn();
      const guildId = GuildIdStub();

      await proxy.request(`/api/guilds/${guildId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Build a login page' }),
      });

      const spawnCalls = proxy.getSpawnedArgs();
      const lastCall = spawnCalls[spawnCalls.length - 1];
      const args = lastCall?.[1] as unknown[];
      const dashPIndex = args.indexOf('-p');
      const prompt = Reflect.get(args, dashPIndex + 1) as never;

      expect(String(prompt).startsWith('# ChaosWhisperer')).toBe(true);
      expect(String(prompt).endsWith('Build a login page')).toBe(true);
    });

    it('VALID: {message: "hello"} => response includes chatProcessId as string', async () => {
      const proxy = setupGuildChatStreamContext();
      proxy.setupChatSpawn();
      const guildId = GuildIdStub();

      const response = await proxy.request(`/api/guilds/${guildId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'hello' }),
      });

      const body: unknown = await response.json();

      expect(response.status).toBe(200);
      expect(typeof Reflect.get(body as object, 'chatProcessId')).toBe('string');
    });
  });

  describe('POST /api/sessions/:sessionId/chat (streaming)', () => {
    const STREAM_SETTLE_MS = 50;

    const setupSessionChatStreamContext = (): ReturnType<typeof StartServerProxy> => {
      const proxy = StartServerProxy();
      const guild = GuildStub();
      proxy.setupGetGuild({ guild });
      return proxy;
    };

    it('VALID: {message, guildId, sessionId} => 200 with chatProcessId', async () => {
      const proxy = setupSessionChatStreamContext();
      proxy.setupChatSpawn();
      const sessionId = SessionIdStub();
      const guildId = GuildIdStub();

      const response = await proxy.request(`/api/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'continue work', guildId }),
      });

      expect(response.status).toBe(200);

      const body: unknown = await response.json();

      expect(typeof Reflect.get(body as object, 'chatProcessId')).toBe('string');
    });

    it('VALID: {resume session} => spawns Claude CLI with --resume flag and raw message (no ChaosWhisperer)', async () => {
      const proxy = setupSessionChatStreamContext();
      proxy.setupChatSpawn();
      const sessionId = SessionIdStub();
      const guildId = GuildIdStub();

      await proxy.request(`/api/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'continue work', guildId }),
      });

      const spawnCalls = proxy.getSpawnedArgs();
      const lastCall = spawnCalls[spawnCalls.length - 1];
      const args = lastCall?.[1] as unknown[];

      expect(args.includes('--resume')).toBe(true);

      const resumeIndex = args.indexOf('--resume');
      const resumeValue = Reflect.get(args, resumeIndex + 1) as never;

      expect(String(resumeValue)).toBe(String(sessionId));

      const dashPIndex = args.indexOf('-p');
      const prompt = Reflect.get(args, dashPIndex + 1) as never;

      expect(String(prompt)).toBe('continue work');
    });

    it('VALID: {stream lines then exit} => broadcasts outputs then chat-complete with sessionId', async () => {
      const proxy = setupSessionChatStreamContext();
      const chat = proxy.setupChatSpawn();
      const sessionId = SessionIdStub();
      const guildId = GuildIdStub();

      await proxy.request(`/api/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'continue work', guildId }),
      });

      chat.emitLine('{"type":"assistant","message":"working on it"}');

      await new Promise<void>((resolve) => {
        setTimeout(resolve, STREAM_SETTLE_MS);
      });

      chat.emitExit(0);

      await new Promise<void>((resolve) => {
        setTimeout(resolve, STREAM_SETTLE_MS);
      });

      const messages = proxy.getBroadcastedMessages();
      const chatOutputs = messages.filter((m) => m.type === 'chat-output');
      const chatCompletes = messages.filter((m) => m.type === 'chat-complete');

      expect(chatOutputs).toHaveLength(1);
      expect(chatCompletes).toHaveLength(1);
      expect(Reflect.get(chatCompletes[0]?.payload as object, 'exitCode')).toBe(0);
      expect(Reflect.get(chatCompletes[0]?.payload as object, 'sessionId')).toBe(sessionId);
    });

    it('INVALID: {missing message} => 400 with error', async () => {
      const proxy = setupSessionChatStreamContext();
      proxy.setupChatSpawn();
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
      const proxy = setupSessionChatStreamContext();
      proxy.setupChatSpawn();
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
      const proxy = setupSessionChatStreamContext();
      proxy.setupChatSpawn();
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

  describe('POST /api/sessions/:sessionId/chat/:chatProcessId/stop', () => {
    it('VALID: {existing process} => 200 with stopped true', async () => {
      const proxy = StartServerProxy();
      const guild = GuildStub();
      proxy.setupGetGuild({ guild });
      proxy.setupChatSpawn();
      const guildId = GuildIdStub();

      const response = await proxy.request(`/api/guilds/${guildId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'hello' }),
      });

      const body: unknown = await response.json();
      const chatProcessId = Reflect.get(body as object, 'chatProcessId');

      const sessionId = SessionIdStub();
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

  describe('GET /api/sessions/:sessionId/chat/history', () => {
    it('VALID: {sessionId, guildId} => 200 with filtered user/assistant entries', async () => {
      const proxy = StartServerProxy();
      const guild = GuildStub();
      proxy.setupGetGuild({ guild });

      const jsonlContent = [
        '{"type":"user","message":"hello","timestamp":"2025-01-01T00:00:00Z"}',
        '{"type":"assistant","message":"hi","timestamp":"2025-01-01T00:00:01Z"}',
        '{"type":"system","message":"init","timestamp":"2025-01-01T00:00:02Z"}',
      ].join('\n');
      proxy.setupJsonlContent({ content: jsonlContent });

      const sessionId = SessionIdStub();
      const guildId = GuildIdStub();

      const response = await proxy.request(
        `/api/sessions/${sessionId}/chat/history?guildId=${guildId}`,
      );

      expect(response.status).toBe(200);

      const body: unknown = await response.json();
      const entries = body as unknown[];

      expect(entries).toHaveLength(2);
      expect(Reflect.get(entries[0] as object, 'type')).toBe('user');
      expect(Reflect.get(entries[1] as object, 'type')).toBe('assistant');
    });

    it('INVALID: {missing guildId} => 400 with error', async () => {
      const proxy = StartServerProxy();
      const sessionId = SessionIdStub();

      const response = await proxy.request(`/api/sessions/${sessionId}/chat/history`);

      expect(response.status).toBe(400);

      const body: unknown = await response.json();

      expect(toPlain(body)).toStrictEqual(
        toPlain({ error: 'guildId query parameter is required' }),
      );
    });
  });
});
