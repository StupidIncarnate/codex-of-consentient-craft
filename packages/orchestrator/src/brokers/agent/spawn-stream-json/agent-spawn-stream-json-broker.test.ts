import { readFile } from '#gateway/node/fs__promises';
import { setImmediate } from '#gateway/node/setImmediate';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import { locationsStatics, sessionSnippetStatics } from '@dungeonmaster/shared/statics';

import { agentSpawnStreamJsonBroker } from './agent-spawn-stream-json-broker';
import { agentSpawnStreamJsonBrokerProxy } from './agent-spawn-stream-json-broker.proxy';

const HOOKS_ONLY_SETTINGS = '{"hooks":{}}';

describe('agentSpawnStreamJsonBroker', () => {
  describe('without resumeSessionId', () => {
    it('VALID: {prompt: "Hello", cwd: repo root, model: sonnet} => spawns with stream-json output, --model, and inline --settings from .claude/settings.json', () => {
      const proxy = agentSpawnStreamJsonBrokerProxy();
      const { mockProcess } = proxy.setupSpawn();

      const result = agentSpawnStreamJsonBroker({
        prompt: 'Hello',
        cwd: '/repo',
        model: 'sonnet',
      });

      expect(result).toStrictEqual({ process: mockProcess, stdout: mockProcess.stdout });
      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'sonnet',
        '--settings',
        HOOKS_ONLY_SETTINGS,
      ]);
    });
  });

  describe('with resumeSessionId', () => {
    it('VALID: {resumeSessionId: "abc-123", model: opus} => --resume follows --settings', () => {
      const proxy = agentSpawnStreamJsonBrokerProxy();
      proxy.setupSpawn();

      agentSpawnStreamJsonBroker({
        prompt: 'Hello',
        cwd: '/repo',
        resumeSessionId: SessionIdStub({ value: 'abc-123' }),
        model: 'opus',
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'opus',
        '--settings',
        HOOKS_ONLY_SETTINGS,
        '--resume',
        'abc-123',
      ]);
    });
  });

  describe('addDir parameter', () => {
    it('VALID: {addDir: quest images path, resumeSessionId} => --add-dir follows --resume', () => {
      const proxy = agentSpawnStreamJsonBrokerProxy();
      proxy.setupSpawn();
      const addDir = `/home/user/.dungeonmaster/quests/q-1/${locationsStatics.quest.imagesDir}`;

      agentSpawnStreamJsonBroker({
        prompt: 'Hello',
        cwd: '/repo',
        resumeSessionId: SessionIdStub({ value: 'abc-123' }),
        model: 'sonnet',
        addDir,
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'sonnet',
        '--settings',
        HOOKS_ONLY_SETTINGS,
        '--resume',
        'abc-123',
        '--add-dir',
        addDir,
      ]);
    });

    it('EMPTY: {addDir omitted} => argv carries no --add-dir flag', () => {
      const proxy = agentSpawnStreamJsonBrokerProxy();
      proxy.setupSpawn();

      agentSpawnStreamJsonBroker({
        prompt: 'Hello',
        cwd: '/repo',
        model: 'sonnet',
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'sonnet',
        '--settings',
        HOOKS_ONLY_SETTINGS,
      ]);
    });
  });

  describe('settings file', () => {
    it('EMPTY: {cwd: repo root, settings file missing} => spawns without --settings', () => {
      const proxy = agentSpawnStreamJsonBrokerProxy();
      proxy.setupSettingsNotFound();
      proxy.setupSpawn();

      agentSpawnStreamJsonBroker({
        prompt: 'Hello',
        cwd: '/repo',
        model: 'haiku',
      });

      expect(proxy.getSettingsReads()).toStrictEqual([['/repo/.claude/settings.json', 'utf8']]);
      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'haiku',
      ]);
    });

    it('EMPTY: {cwd omitted} => never reads settings and spawns without --settings', () => {
      const proxy = agentSpawnStreamJsonBrokerProxy();
      proxy.setupSpawn();

      agentSpawnStreamJsonBroker({
        prompt: 'Hello',
        model: 'haiku',
      });

      expect(proxy.getSettingsReads()).toStrictEqual([]);
      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'haiku',
      ]);
    });

    it('VALID: {disableToolSearch: true, settings carry hooks} => --settings has the hooks stripped', () => {
      const proxy = agentSpawnStreamJsonBrokerProxy();
      proxy.setupSettingsJson({ json: '{"hooks":{"SessionStart":[]},"permissions":{"allow":[]}}' });
      proxy.setupSpawn();

      agentSpawnStreamJsonBroker({
        prompt: 'Hello',
        cwd: '/repo',
        model: 'haiku',
        disableToolSearch: true,
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Hello',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'haiku',
        '--settings',
        '{"permissions":{"allow":[]}}',
      ]);
    });
  });

  describe('spawn options', () => {
    it('VALID: {cwd provided} => passes cwd to the spawn', () => {
      const proxy = agentSpawnStreamJsonBrokerProxy();
      proxy.setupSpawn();

      agentSpawnStreamJsonBroker({
        prompt: 'Hello',
        cwd: '/repo',
        model: 'sonnet',
      });

      expect(proxy.getSpawnedCwd()).toBe('/repo');
    });

    it('EMPTY: {cwd omitted} => passes no cwd to the spawn', () => {
      const proxy = agentSpawnStreamJsonBrokerProxy();
      proxy.setupSpawn();

      agentSpawnStreamJsonBroker({
        prompt: 'Hello',
        model: 'sonnet',
      });

      expect(proxy.getSpawnedCwd()).toBe(undefined);
    });

    it('VALID: {stdinMode omitted, onStderrLine omitted} => stdin and stderr inherit', () => {
      const proxy = agentSpawnStreamJsonBrokerProxy();
      proxy.setupSpawn();

      agentSpawnStreamJsonBroker({
        prompt: 'Hello',
        model: 'sonnet',
      });

      expect(proxy.getSpawnedStdinMode()).toBe('inherit');
      expect(proxy.getSpawnedStderrMode()).toBe('inherit');
    });

    it('VALID: {stdinMode: "ignore"} => stdin is ignored', () => {
      const proxy = agentSpawnStreamJsonBrokerProxy();
      proxy.setupSpawn();

      agentSpawnStreamJsonBroker({
        prompt: 'Hello',
        model: 'sonnet',
        stdinMode: 'ignore',
      });

      expect(proxy.getSpawnedStdinMode()).toBe('ignore');
    });

    it('VALID: {prompt: absolute image path} => -p carries the prompt verbatim', () => {
      const proxy = agentSpawnStreamJsonBrokerProxy();
      proxy.setupSpawn();
      const prompt = 'Look at /home/user/.dungeonmaster/quests/q-1/images/shot.png please';

      agentSpawnStreamJsonBroker({ prompt, model: 'sonnet' });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        'Look at /home/user/.dungeonmaster/quests/q-1/images/shot.png please',
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'sonnet',
      ]);
    });
  });

  describe('environment', () => {
    it('VALID: {any spawn} => env pins CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS to "0"', () => {
      const proxy = agentSpawnStreamJsonBrokerProxy();
      proxy.setupSpawn();

      agentSpawnStreamJsonBroker({
        prompt: 'Hello',
        model: 'sonnet',
      });

      expect(proxy.getSpawnedEnvValue({ name: 'CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS' })).toBe('0');
    });

    it('VALID: {disableToolSearch: true} => env sets ENABLE_TOOL_SEARCH to "false"', () => {
      const proxy = agentSpawnStreamJsonBrokerProxy();
      proxy.setupSpawn();

      agentSpawnStreamJsonBroker({
        prompt: 'Hello',
        model: 'haiku',
        disableToolSearch: true,
      });

      expect(proxy.getSpawnedEnvValue({ name: 'ENABLE_TOOL_SEARCH' })).toBe('false');
    });
  });

  describe('stderr tagging', () => {
    it('VALID: {onStderrLine, child writes two stderr lines} => stderr is piped and each line is forwarded', async () => {
      const proxy = agentSpawnStreamJsonBrokerProxy();
      const { mockProcess } = proxy.setupSpawn();
      const onStderrLine = jest.fn();

      agentSpawnStreamJsonBroker({
        prompt: 'Hello',
        model: 'sonnet',
        onStderrLine,
      });
      mockProcess.stderr?.push('first stderr line\nsecond stderr line\n');
      await new Promise<undefined>((resolve) => {
        setImmediate(() => {
          resolve(undefined);
        });
      });

      expect(proxy.getSpawnedStderrMode()).toBe('pipe');
      expect(onStderrLine.mock.calls).toStrictEqual([
        [{ line: 'first stderr line' }],
        [{ line: 'second stderr line' }],
      ]);
    });

    it('ERROR: {onStderrLine throws} => the failure is written to stderr and the reader keeps going', async () => {
      const proxy = agentSpawnStreamJsonBrokerProxy();
      const { mockProcess } = proxy.setupSpawn();
      const onStderrLine = jest.fn().mockImplementation(() => {
        throw new Error('tagger exploded');
      });

      agentSpawnStreamJsonBroker({
        prompt: 'Hello',
        model: 'sonnet',
        onStderrLine,
      });
      mockProcess.stderr?.push('one\ntwo\n');
      await new Promise<undefined>((resolve) => {
        setImmediate(() => {
          resolve(undefined);
        });
      });

      expect(onStderrLine.mock.calls).toStrictEqual([[{ line: 'one' }], [{ line: 'two' }]]);
      expect(proxy.getStderrWrites()).toStrictEqual([
        '[spawn-stream-json] onStderrLine failed: Error: tagger exploded\n',
        '[spawn-stream-json] onStderrLine failed: Error: tagger exploded\n',
      ]);
    });
  });

  describe('spawn failure', () => {
    it('ERROR: {spawnStreamJson throws} => the error propagates to the caller', () => {
      const proxy = agentSpawnStreamJsonBrokerProxy();
      proxy.setupSpawnThrow({ error: new Error('claude not installed') });

      expect(() =>
        agentSpawnStreamJsonBroker({
          prompt: 'Hello',
          model: 'sonnet',
        }),
      ).toThrow(/^claude not installed$/u);
    });
  });

  describe('session snippets', () => {
    const EXPECTED_SNIPPET_KEYS = Object.keys(sessionSnippetStatics);

    it('VALID: {this checkout .claude/settings.json} => the --settings blob registers a hook for every configured snippet key', async () => {
      const repoRoot = `${__dirname}/../../../../../..`;
      const settingsPath = `${repoRoot}/${locationsStatics.repoRoot.claude.dir}/${locationsStatics.repoRoot.claude.settings}`;
      const contents = await readFile(settingsPath);

      const matched = [...contents.matchAll(/dungeonmaster-session-snippet ([A-Za-z]+)/gu)].map(
        (match) => match[1]!,
      );
      const registeredKeys = [...new Set(matched)].sort((a, b) => a.localeCompare(b));

      expect(registeredKeys).toStrictEqual(
        [...EXPECTED_SNIPPET_KEYS].sort((a, b) => a.localeCompare(b)),
      );
    });
  });

  describe('exit config', () => {
    it('VALID: {setupSuccess exit 0, default child} => the child emits exit 0 once the spawn returns', async () => {
      const proxy = agentSpawnStreamJsonBrokerProxy();
      proxy.setupSuccess({ exitCode: 0 });
      const onExit = jest.fn();

      const { process: child } = agentSpawnStreamJsonBroker({
        prompt: 'Hello',
        model: 'sonnet',
      });
      child.on('exit', onExit);
      await new Promise<undefined>((resolve) => {
        setImmediate(() => {
          resolve(undefined);
        });
      });
      await new Promise<undefined>((resolve) => {
        setImmediate(() => {
          resolve(undefined);
        });
      });

      expect(onExit).toHaveBeenCalledTimes(1);
      expect(onExit).toHaveBeenCalledWith(0);
    });
  });
});
