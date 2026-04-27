import {
  AssistantTextStreamLineStub,
  DependencyStepStub,
  ExitCodeStub,
  FilePathStub,
  SessionIdStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { ContinuationContextStub } from '../../../contracts/continuation-context/continuation-context.stub';
import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';
import {
  CodeweaverWorkUnitStub,
  LawbringerWorkUnitStub,
  PathseekerWorkUnitStub,
  SiegemasterWorkUnitStub,
  SpiritmenderWorkUnitStub,
} from '../../../contracts/work-unit/work-unit.stub';
import { spawnedOptionsSnapshotTransformer } from '../../../transformers/spawned-options-snapshot/spawned-options-snapshot-transformer';
import { agentSpawnByRoleBroker } from './agent-spawn-by-role-broker';
import { agentSpawnByRoleBrokerProxy } from './agent-spawn-by-role-broker.proxy';

type SessionId = ReturnType<typeof SessionIdStub>;

const SESSION_ID = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });

const makeSessionIdLine = ({ sessionId }: { sessionId: SessionId }) =>
  JSON.stringify({ session_id: sessionId });

describe('agentSpawnByRoleBroker', () => {
  describe('successful spawn', () => {
    it('VALID: {codeweaver workUnit} => returns result with session ID', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });
      const sessionLine = makeSessionIdLine({ sessionId: SESSION_ID });

      proxy.setupSpawnAndMonitor({
        lines: [sessionLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: [],
      });
    });

    it('VALID: {pathseeker workUnit} => resolves pathseeker prompt template with quest ID injected', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const workUnit = PathseekerWorkUnitStub();

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: [],
      });

      const spawnedArgs = proxy.getSpawnedArgs() as unknown[];
      const [, prompt] = spawnedArgs;

      expect(String(prompt)).toMatch(/^Quest ID: add-auth$/mu);
      expect(String(prompt)).toMatch(/^### Status: `seek_scope`$/mu);
    });

    it('VALID: {siegemaster workUnit} => resolves siegemaster prompt template', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const workUnit = SiegemasterWorkUnitStub();

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: [],
      });
    });

    it('VALID: {lawbringer workUnit} => resolves lawbringer prompt template', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const workUnit = LawbringerWorkUnitStub();

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: [],
      });
    });

    it('VALID: {spiritmender workUnit} => resolves spiritmender prompt template', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const workUnit = SpiritmenderWorkUnitStub();

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: [],
      });
    });
  });

  describe('continuation context', () => {
    it('VALID: {continuationContext provided} => appends continuation context to prompt', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });
      const continuationContext = ContinuationContextStub({ value: 'Resume from gate 3' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({
        workUnit,
        startPath,
        continuationContext,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: [],
      });
    });
  });

  describe('resume session', () => {
    it('VALID: {resumeSessionId provided} => passes session ID to spawn', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });
      const resumeSessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({
        workUnit,
        startPath,
        resumeSessionId,
      });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: [],
      });
    });
  });

  describe('spawn failure', () => {
    it('ERROR: {spawn throws} => returns crashed result', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });

      proxy.setupSpawnFailure();

      const startPath = FilePathStub({ value: '/project/src' });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        crashed: true,
        capturedOutput: [],
        signal: null,
        sessionId: null,
        exitCode: null,
      });
    });
  });

  describe('crash exit', () => {
    it('VALID: {process exits with code 1} => returns crashed true', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });
      const startPath = FilePathStub({ value: '/project/src' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 1 }),
      });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 1,
        signal: null,
        crashed: true,
        capturedOutput: [],
      });
    });
  });

  describe('signal extraction', () => {
    it('VALID: {stdout emits signal-back tool use line} => returns signal in result', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });
      const startPath = FilePathStub({ value: '/project/src' });
      const stepId = StepIdStub();

      const signalLine = JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'mcp__dungeonmaster__signal-back',
              input: {
                signal: 'complete',
                stepId,
                summary: 'All done',
              },
            },
          ],
        },
      });

      proxy.setupSpawnAndMonitor({
        lines: [signalLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: {
          signal: 'complete',
          summary: 'All done',
        },
        crashed: false,
        capturedOutput: [],
      });
    });
  });

  describe('disk-fallback signal extraction', () => {
    it('VALID: {stream emits no signal, sessionId resolved, JSONL on disk has signal-back} => returns signal from disk fallback', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });
      const startPath = FilePathStub({ value: '/project/src' });
      const sessionLine = makeSessionIdLine({ sessionId: SESSION_ID });

      // Stream provides only the session-id line — no signal-back tool_use line in stream.
      proxy.setupSpawnAndMonitor({
        lines: [sessionLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      // But the on-disk session JSONL contains a signal-back tool_use line (the agent did
      // call mcp__dungeonmaster__signal-back; the live stream parser missed it).
      const diskSignalLine = JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'mcp__dungeonmaster__signal-back',
              input: {
                signal: 'complete',
                summary: 'recovered from disk',
              },
            },
          ],
        },
      });
      proxy.setupSessionJsonlContent({ content: `${diskSignalLine}\n` });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        exitCode: 0,
        signal: { signal: 'complete', summary: 'recovered from disk' },
        crashed: false,
        capturedOutput: [],
      });
    });

    it('VALID: {stream emits no signal, sessionId resolved, JSONL on disk has multiple signals} => returns LAST signal from disk', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });
      const startPath = FilePathStub({ value: '/project/src' });
      const sessionLine = makeSessionIdLine({ sessionId: SESSION_ID });

      proxy.setupSpawnAndMonitor({
        lines: [sessionLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const firstSignalLine = JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'mcp__dungeonmaster__signal-back',
              input: { signal: 'failed', summary: 'first try' },
            },
          ],
        },
      });
      const lastSignalLine = JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'mcp__dungeonmaster__signal-back',
              input: { signal: 'complete', summary: 'final answer' },
            },
          ],
        },
      });
      proxy.setupSessionJsonlContent({
        content: `${firstSignalLine}\n${lastSignalLine}\n`,
      });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        exitCode: 0,
        signal: { signal: 'complete', summary: 'final answer' },
        crashed: false,
        capturedOutput: [],
      });
    });

    it('VALID: {stream emits no signal, sessionId resolved, JSONL missing on disk} => returns signal null', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });
      const startPath = FilePathStub({ value: '/project/src' });
      const sessionLine = makeSessionIdLine({ sessionId: SESSION_ID });

      proxy.setupSpawnAndMonitor({
        lines: [sessionLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });
      proxy.setupSessionJsonlMissing();

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: [],
      });
    });

    it('VALID: {stream emits signal, JSONL on disk also has signal} => keeps stream signal (no fallback)', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });
      const startPath = FilePathStub({ value: '/project/src' });
      const stepId = StepIdStub();

      const streamSignalLine = JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'mcp__dungeonmaster__signal-back',
              input: { signal: 'complete', stepId, summary: 'from stream' },
            },
          ],
        },
      });
      proxy.setupSpawnAndMonitor({
        lines: [streamSignalLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const diskSignalLine = JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'mcp__dungeonmaster__signal-back',
              input: { signal: 'failed', summary: 'should not be used' },
            },
          ],
        },
      });
      proxy.setupSessionJsonlContent({ content: `${diskSignalLine}\n` });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: { signal: 'complete', summary: 'from stream' },
        crashed: false,
        capturedOutput: [],
      });
    });
  });

  describe('text capture', () => {
    it('VALID: {stdout emits assistant text line} => returns capturedOutput with text', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });
      const startPath = FilePathStub({ value: '/project/src' });

      const textLine = JSON.stringify(AssistantTextStreamLineStub());

      proxy.setupSpawnAndMonitor({
        lines: [textLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const result = await agentSpawnByRoleBroker({ workUnit, startPath });

      expect(result).toStrictEqual({
        sessionId: null,
        exitCode: 0,
        signal: null,
        crashed: false,
        capturedOutput: ['Hello, I can help with that.'],
      });
    });
  });

  describe('session-id resolution failure', () => {
    it('ERROR: {onSessionId throws} => writes error to stderr', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });
      const startPath = FilePathStub({ value: '/project/src' });
      const sessionLine = makeSessionIdLine({ sessionId: SESSION_ID });
      const stderrSpy = proxy.setupStderrCapture();

      proxy.setupSpawnAndMonitor({
        lines: [sessionLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      const onSessionId = (): void => {
        throw new Error('callback exploded');
      };

      await agentSpawnByRoleBroker({ workUnit, startPath, onSessionId });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(stderrSpy.mock.calls.length).toBeGreaterThan(0);
      expect(stderrSpy.mock.calls[0]?.[0]).toMatch(
        /^\[agent-spawn\] session-id resolution failed:.*callback exploded\n$/u,
      );
    });
  });

  describe('model resolution', () => {
    it('VALID: {pathseeker workUnit, no smoketest override} => spawns with --model opus', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const workUnit = PathseekerWorkUnitStub();
      const startPath = FilePathStub({ value: '/project/src' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await agentSpawnByRoleBroker({ workUnit, startPath });

      const spawnedArgs = proxy.getSpawnedArgs() as readonly unknown[];
      const modelIdx = spawnedArgs.indexOf('--model');

      expect(modelIdx).toBeGreaterThan(-1);
      expect(spawnedArgs[modelIdx + 1]).toBe('opus');
    });

    it('VALID: {codeweaver workUnit, no smoketest override} => spawns with --model sonnet', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });
      const startPath = FilePathStub({ value: '/project/src' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await agentSpawnByRoleBroker({ workUnit, startPath });

      const spawnedArgs = proxy.getSpawnedArgs() as readonly unknown[];
      const modelIdx = spawnedArgs.indexOf('--model');

      expect(modelIdx).toBeGreaterThan(-1);
      expect(spawnedArgs[modelIdx + 1]).toBe('sonnet');
    });

    it('VALID: {siegemaster workUnit, no smoketest override} => spawns with --model opus', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const workUnit = SiegemasterWorkUnitStub();
      const startPath = FilePathStub({ value: '/project/src' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await agentSpawnByRoleBroker({ workUnit, startPath });

      const spawnedArgs = proxy.getSpawnedArgs() as readonly unknown[];
      const modelIdx = spawnedArgs.indexOf('--model');

      expect(modelIdx).toBeGreaterThan(-1);
      expect(spawnedArgs[modelIdx + 1]).toBe('opus');
    });

    it('VALID: {pathseeker workUnit with smoketestPromptOverride} => spawns with --model haiku (smoketest wins)', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const workUnit = PathseekerWorkUnitStub({
        smoketestPromptOverride: PromptTextStub({ value: 'smoketest canned prompt' }),
      });
      const startPath = FilePathStub({ value: '/project/src' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await agentSpawnByRoleBroker({ workUnit, startPath });

      const spawnedArgs = proxy.getSpawnedArgs() as readonly unknown[];
      const modelIdx = spawnedArgs.indexOf('--model');

      expect(modelIdx).toBeGreaterThan(-1);
      expect(spawnedArgs[modelIdx + 1]).toBe('haiku');
    });

    it('VALID: {workUnit with smoketestPromptOverride} => spawn env sets ENABLE_TOOL_SEARCH=false so haiku can reach MCP tools', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const workUnit = PathseekerWorkUnitStub({
        smoketestPromptOverride: PromptTextStub({ value: 'smoketest canned prompt' }),
      });
      const startPath = FilePathStub({ value: '/project/src' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await agentSpawnByRoleBroker({ workUnit, startPath });

      const options = spawnedOptionsSnapshotTransformer({ rawOptions: proxy.getSpawnedOptions() });

      expect(options.env?.ENABLE_TOOL_SEARCH).toBe('false');
    });

    it('VALID: {workUnit without smoketestPromptOverride} => spawn env does not set ENABLE_TOOL_SEARCH', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const workUnit = PathseekerWorkUnitStub();
      const startPath = FilePathStub({ value: '/project/src' });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await agentSpawnByRoleBroker({ workUnit, startPath });

      const options = spawnedOptionsSnapshotTransformer({ rawOptions: proxy.getSpawnedOptions() });

      expect(options.env?.ENABLE_TOOL_SEARCH).toBe(undefined);
    });
  });

  describe('cwd resolution', () => {
    it('VALID: {smoketest spawn with non-repo-root startPath} => resolves cwd to configRoot via configRootFindBroker', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const workUnit = PathseekerWorkUnitStub({
        smoketestPromptOverride: PromptTextStub({ value: 'smoketest canned prompt' }),
      });
      const startPath = FilePathStub({ value: '/home/user/.dungeonmaster-dev' });
      const repoRoot = '/home/user/repo';

      proxy.setupConfigRoot({ root: repoRoot });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await agentSpawnByRoleBroker({ workUnit, startPath });

      const options = spawnedOptionsSnapshotTransformer({ rawOptions: proxy.getSpawnedOptions() });

      expect(options.cwd).toBe(repoRoot);
      expect(proxy.getConfigRootCalls()).toStrictEqual([[{ startPath, kind: 'repo-root' }]]);
    });

    it('VALID: {non-smoketest spawn} => resolves cwd to configRoot via configRootFindBroker (idempotent for repo-root startPaths)', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });
      const startPath = FilePathStub({ value: '/project/src' });
      const repoRoot = '/project';

      proxy.setupConfigRoot({ root: repoRoot });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await agentSpawnByRoleBroker({ workUnit, startPath });

      const options = spawnedOptionsSnapshotTransformer({ rawOptions: proxy.getSpawnedOptions() });

      expect(options.cwd).toBe(repoRoot);
      expect(proxy.getConfigRootCalls()).toStrictEqual([[{ startPath, kind: 'repo-root' }]]);
    });

    it('VALID: {configRootFindBroker rejects (no .dungeonmaster.json ancestor)} => falls back to startPath as cwd', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });
      const startPath = FilePathStub({ value: '/tmp/dm-e2e-isolated-guild' });

      proxy.setupConfigRootRejection({ error: new Error('no project root') });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await agentSpawnByRoleBroker({ workUnit, startPath });

      const options = spawnedOptionsSnapshotTransformer({ rawOptions: proxy.getSpawnedOptions() });

      expect(options.cwd).toBe('/tmp/dm-e2e-isolated-guild');
      expect(proxy.getConfigRootCalls()).toStrictEqual([[{ startPath, kind: 'repo-root' }]]);
    });

    it('VALID: {non-smoketest spawn for auto-spawned recovery pathseeker on smoketest quest} => walks up from smoketest guild path to repo root', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      // Recovery pathseeker auto-spawned mid-flight has no smoketestPromptOverride.
      const workUnit = PathseekerWorkUnitStub();
      const startPath = FilePathStub({ value: '/home/user/.dungeonmaster-dev' });
      const repoRoot = '/home/user/repo';

      proxy.setupConfigRoot({ root: repoRoot });

      proxy.setupSpawnAndMonitor({
        lines: [],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await agentSpawnByRoleBroker({ workUnit, startPath });

      const options = spawnedOptionsSnapshotTransformer({ rawOptions: proxy.getSpawnedOptions() });

      expect(options.cwd).toBe(repoRoot);
      expect(proxy.getConfigRootCalls()).toStrictEqual([[{ startPath, kind: 'repo-root' }]]);
    });
  });

  describe('onLine forwarding', () => {
    it('VALID: {onLine callback provided, stdout emits lines} => callback receives lines', async () => {
      const proxy = agentSpawnByRoleBrokerProxy();
      const step = DependencyStepStub();
      const workUnit = CodeweaverWorkUnitStub({ steps: [step] });
      const startPath = FilePathStub({ value: '/project/src' });
      const onLine = jest.fn();
      const sessionLine = makeSessionIdLine({ sessionId: SESSION_ID });

      proxy.setupSpawnAndMonitor({
        lines: [sessionLine],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await agentSpawnByRoleBroker({ workUnit, startPath, onLine });

      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine.mock.calls[0][0]).toStrictEqual({ line: sessionLine });
    });
  });
});
