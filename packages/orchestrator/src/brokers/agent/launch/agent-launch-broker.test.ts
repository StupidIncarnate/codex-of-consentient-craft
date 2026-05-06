import {
  AssistantTextStreamLineStub,
  ExitCodeStub,
  GuildConfigStub,
  GuildIdStub,
  GuildStub,
  QuestIdStub,
  QuestWorkItemIdStub,
  RepoRootCwdStub,
  SessionIdStub,
  SystemInitStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { streamLineToJsonLineTransformer } from '@dungeonmaster/shared/transformers';

import { ClaudeModelStub } from '../../../contracts/claude-model/claude-model.stub';
import { ProcessIdPrefixStub } from '../../../contracts/process-id-prefix/process-id-prefix.stub';
import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';

import { agentLaunchBroker } from './agent-launch-broker';
import { agentLaunchBrokerProxy } from './agent-launch-broker.proxy';

const flushImmediate = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

const flushImmediateMany = async (remaining = 20): Promise<void> => {
  if (remaining <= 0) {
    return;
  }
  await flushImmediate();
  await flushImmediateMany(remaining - 1);
};

const PROCESS_UUID = '00000000-0000-4000-8000-000000000a01';

describe('agentLaunchBroker', () => {
  describe('spawn lifecycle', () => {
    it('VALID: {spawn emits assistant text line} => onEntries fires with parsed ChatEntry batch', async () => {
      const proxy = agentLaunchBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      proxy.setupMainTailGuild({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/user',
      });

      const assistantLine = streamLineToJsonLineTransformer({
        streamLine: {
          ...AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'launcher emit' }],
            },
          }),
          uuid: 'launcher-line-1',
          timestamp: '2025-01-01T00:00:00Z',
        },
      });
      proxy.setupSpawnAndEmitLines({ lines: [assistantLine], exitCode: 0 });

      const onEntries = jest.fn();
      const onComplete = jest.fn();

      agentLaunchBroker({
        guildId,
        questId: QuestIdStub({ value: 'q-launch-1' }),
        questWorkItemId: QuestWorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
        processIdPrefix: ProcessIdPrefixStub({ value: 'proc' }),
        prompt: PromptTextStub({ value: 'pathseeker prompt' }),
        cwd: RepoRootCwdStub({ value: '/home/user/my-project' }),
        model: ClaudeModelStub(),
        onEntries,
        onText: () => {},
        onSignal: () => {},
        onSessionId: () => {},
        onComplete,
        registerProcess: () => {},
      });

      await flushImmediate();
      await flushImmediate();

      expect(onEntries).toHaveBeenCalledWith({
        chatProcessId: `proc-${PROCESS_UUID}`,
        sessionId: undefined,
        entries: [
          {
            role: 'assistant',
            type: 'text',
            content: 'launcher emit',
            uuid: 'launcher-line-1:0',
            timestamp: '2025-01-01T00:00:00Z',
            source: 'session',
          },
        ],
      });
    });

    it('VALID: {spawn exits with exitCode 0} => onComplete fires with chatProcessId, exitCode 0, null sessionId', async () => {
      const proxy = agentLaunchBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      proxy.setupMainTailGuild({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/user',
      });
      proxy.setupSpawnAndEmitLines({ lines: [], exitCode: 0 });

      const onComplete = jest.fn();

      agentLaunchBroker({
        guildId,
        questId: QuestIdStub({ value: 'q-launch-complete' }),
        questWorkItemId: QuestWorkItemIdStub({
          value: 'f47ac10b-58cc-4372-a567-0e02b2c3d480',
        }),
        processIdPrefix: ProcessIdPrefixStub({ value: 'proc' }),
        prompt: PromptTextStub({ value: 'p' }),
        cwd: RepoRootCwdStub({ value: '/home/user/my-project' }),
        model: ClaudeModelStub(),
        onEntries: () => {},
        onText: () => {},
        onSignal: () => {},
        onSessionId: () => {},
        onComplete,
        registerProcess: () => {},
      });

      await flushImmediate();
      await flushImmediate();

      expect(onComplete).toHaveBeenCalledWith({
        chatProcessId: `proc-${PROCESS_UUID}`,
        exitCode: ExitCodeStub({ value: 0 }),
        sessionId: null,
      });
    });
  });

  describe('process registration', () => {
    it('VALID: {launcher invoked} => registerProcess fires once with composed kill function and identity fields', async () => {
      const proxy = agentLaunchBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const questId = QuestIdStub({ value: 'q-register-1' });
      const questWorkItemId = QuestWorkItemIdStub({
        value: 'f47ac10b-58cc-4372-a567-0e02b2c3d481',
      });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      proxy.setupMainTailGuild({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/user',
      });
      proxy.setupSpawnAndEmitLines({ lines: [], exitCode: 0 });

      const registerProcess = jest.fn();

      agentLaunchBroker({
        guildId,
        questId,
        questWorkItemId,
        processIdPrefix: ProcessIdPrefixStub({ value: 'proc' }),
        prompt: PromptTextStub({ value: 'p' }),
        cwd: RepoRootCwdStub({ value: '/home/user/my-project' }),
        model: ClaudeModelStub(),
        onEntries: () => {},
        onText: () => {},
        onSignal: () => {},
        onSessionId: () => {},
        onComplete: () => {},
        registerProcess,
      });

      await flushImmediate();
      await flushImmediate();

      expect(registerProcess).toHaveBeenCalledTimes(1);

      const [[registerArg]] = registerProcess.mock.calls;

      expect(registerArg).toStrictEqual({
        processId: `proc-${PROCESS_UUID}`,
        questId,
        questWorkItemId,
        kill: expect.any(Function),
      });
    });
  });

  describe('sessionId surfacing', () => {
    it('VALID: {system/init line resolves sessionId} => onSessionId fires with extracted sessionId', async () => {
      const proxy = agentLaunchBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      proxy.setupMainTailGuild({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/user',
      });

      const initLine = streamLineToJsonLineTransformer({
        streamLine: SystemInitStreamLineStub({ session_id: 'session-launch-init' }),
      });
      proxy.setupSpawnAndEmitLines({ lines: [initLine], exitCode: 0 });

      const onSessionId = jest.fn();

      agentLaunchBroker({
        guildId,
        questId: QuestIdStub({ value: 'q-init' }),
        questWorkItemId: QuestWorkItemIdStub({
          value: 'f47ac10b-58cc-4372-a567-0e02b2c3d482',
        }),
        processIdPrefix: ProcessIdPrefixStub({ value: 'proc' }),
        prompt: PromptTextStub({ value: 'p' }),
        cwd: RepoRootCwdStub({ value: '/home/user/my-project' }),
        model: ClaudeModelStub(),
        onEntries: () => {},
        onText: () => {},
        onSignal: () => {},
        onSessionId,
        onComplete: () => {},
        registerProcess: () => {},
      });

      await flushImmediate();
      await flushImmediate();

      expect(onSessionId).toHaveBeenCalledWith({
        chatProcessId: `proc-${PROCESS_UUID}`,
        sessionId: 'session-launch-init',
      });
    });
  });

  describe('processId prefix', () => {
    it('VALID: {prefix: "chat"} => processId is "chat-<uuid>"', () => {
      const proxy = agentLaunchBrokerProxy();
      proxy.setupSpawnAndEmitLines({ lines: [], exitCode: 0 });

      const result = agentLaunchBroker({
        guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
        questId: QuestIdStub({ value: 'q-prefix-chat' }),
        questWorkItemId: QuestWorkItemIdStub({
          value: 'f47ac10b-58cc-4372-a567-0e02b2c3d483',
        }),
        processIdPrefix: ProcessIdPrefixStub({ value: 'chat' }),
        prompt: PromptTextStub({ value: 'p' }),
        cwd: RepoRootCwdStub({ value: '/home/user/my-project' }),
        model: ClaudeModelStub(),
        onEntries: () => {},
        onText: () => {},
        onSignal: () => {},
        onSessionId: () => {},
        onComplete: () => {},
        registerProcess: () => {},
      });

      expect(result.processId).toBe(`chat-${PROCESS_UUID}`);
    });

    it('VALID: {prefix: "design"} => processId is "design-<uuid>"', () => {
      const proxy = agentLaunchBrokerProxy();
      proxy.setupSpawnAndEmitLines({ lines: [], exitCode: 0 });

      const result = agentLaunchBroker({
        guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
        questId: QuestIdStub({ value: 'q-prefix-design' }),
        questWorkItemId: QuestWorkItemIdStub({
          value: 'f47ac10b-58cc-4372-a567-0e02b2c3d484',
        }),
        processIdPrefix: ProcessIdPrefixStub({ value: 'design' }),
        prompt: PromptTextStub({ value: 'p' }),
        cwd: RepoRootCwdStub({ value: '/home/user/my-project' }),
        model: ClaudeModelStub(),
        onEntries: () => {},
        onText: () => {},
        onSignal: () => {},
        onSessionId: () => {},
        onComplete: () => {},
        registerProcess: () => {},
      });

      expect(result.processId).toBe(`design-${PROCESS_UUID}`);
    });

    it('VALID: {prefix: "proc"} => processId is "proc-<uuid>"', () => {
      const proxy = agentLaunchBrokerProxy();
      proxy.setupSpawnAndEmitLines({ lines: [], exitCode: 0 });

      const result = agentLaunchBroker({
        guildId: GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
        questId: QuestIdStub({ value: 'q-prefix-proc' }),
        questWorkItemId: QuestWorkItemIdStub({
          value: 'f47ac10b-58cc-4372-a567-0e02b2c3d485',
        }),
        processIdPrefix: ProcessIdPrefixStub({ value: 'proc' }),
        prompt: PromptTextStub({ value: 'p' }),
        cwd: RepoRootCwdStub({ value: '/home/user/my-project' }),
        model: ClaudeModelStub(),
        onEntries: () => {},
        onText: () => {},
        onSignal: () => {},
        onSessionId: () => {},
        onComplete: () => {},
        registerProcess: () => {},
      });

      expect(result.processId).toBe(`proc-${PROCESS_UUID}`);
    });
  });

  describe('post-exit main-session-tail', () => {
    it('VALID: {spawn exits with resumeSessionId, tail change triggers} => onEntries fires with task-notification entry from JSONL append', async () => {
      const proxy = agentLaunchBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guild = GuildStub({ id: guildId, path: '/home/testuser/my-project' });
      proxy.setupMainTailGuild({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/testuser',
      });
      proxy.setupMainTailLines({
        lines: [
          JSON.stringify({
            type: 'user',
            uuid: 'post-exit-task-line-uuid',
            timestamp: '2025-01-01T00:00:00.000Z',
            message: {
              role: 'user',
              content:
                '<task-notification><task-id>bg-task-1</task-id><status>completed</status><summary>BG done</summary><result>ok</result></task-notification>',
            },
          }),
        ],
      });
      proxy.setupSpawnAndEmitLines({ lines: [], exitCode: 0 });

      const onEntries = jest.fn();

      agentLaunchBroker({
        guildId,
        questId: QuestIdStub({ value: 'q-post-exit' }),
        questWorkItemId: QuestWorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d487' }),
        processIdPrefix: ProcessIdPrefixStub({ value: 'proc' }),
        prompt: PromptTextStub({ value: 'p' }),
        cwd: RepoRootCwdStub({ value: '/home/testuser/my-project' }),
        model: ClaudeModelStub(),
        resumeSessionId: SessionIdStub({ value: 'session-post-exit' }),
        onEntries,
        onText: () => {},
        onSignal: () => {},
        onSessionId: () => {},
        onComplete: () => {},
        registerProcess: () => {},
      });

      // Drain spawn → exit → launcher.onComplete → startMainTailLayerBroker async chain so
      // the watcher is registered before the test triggers the file-change synthesis.
      await flushImmediateMany();

      proxy.triggerMainTailChange();

      await flushImmediateMany();

      expect(onEntries).toHaveBeenCalledWith({
        chatProcessId: `proc-${PROCESS_UUID}`,
        sessionId: 'session-post-exit',
        entries: [
          {
            role: 'system',
            type: 'task_notification',
            taskId: 'bg-task-1',
            status: 'completed',
            summary: 'BG done',
            result: 'ok',
            source: 'session',
            uuid: 'post-exit-task-line-uuid:task-notification',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
        ],
      });
    });
  });

  describe('kill composition', () => {
    it('VALID: {return.kill called before spawn exits} => spawn process is killed and onComplete fires', async () => {
      const proxy = agentLaunchBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      proxy.setupMainTailGuild({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/user',
      });
      const { mockProcess } = proxy.setupSpawnExitOnKill({ lines: [], exitCode: null });

      const onComplete = jest.fn();

      const result = agentLaunchBroker({
        guildId,
        questId: QuestIdStub({ value: 'q-kill' }),
        questWorkItemId: QuestWorkItemIdStub({
          value: 'f47ac10b-58cc-4372-a567-0e02b2c3d486',
        }),
        processIdPrefix: ProcessIdPrefixStub({ value: 'proc' }),
        prompt: PromptTextStub({ value: 'p' }),
        cwd: RepoRootCwdStub({ value: '/home/user/my-project' }),
        model: ClaudeModelStub(),
        onEntries: () => {},
        onText: () => {},
        onSignal: () => {},
        onSessionId: () => {},
        onComplete,
        registerProcess: () => {},
      });

      result.kill();

      await flushImmediate();
      await flushImmediate();

      expect(mockProcess.kill).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
