import { ClaudeNotInstalledError } from '../resolve-claude-cli-path/claude-not-installed.error';
import { spawnStreamJson } from './spawn-stream-json';
import { spawnStreamJsonProxy } from './spawn-stream-json.proxy';

describe('spawnStreamJson()', () => {
  it('VALID: {args} => resolves the CLI path and returns the live process plus stdout', () => {
    const proxy = spawnStreamJsonProxy();
    const child = proxy.setupSuccess({ cliPath: '/fake/bin/claude' });

    const result = spawnStreamJson({ args: ['-p', 'hi', '--model', 'sonnet'] });

    expect(result).toStrictEqual({ process: child, stdout: child.stdout });
  });

  it('VALID: {cwd, env, abortSignal} => passes them through to the underlying spawn', () => {
    const proxy = spawnStreamJsonProxy();
    proxy.setupSuccess({ cliPath: '/fake/bin/claude' });
    const controller = new AbortController();

    spawnStreamJson({
      args: ['-p', 'hi'],
      cwd: '/repo',
      env: { A: '1' },
      abortSignal: controller.signal,
    });

    expect(proxy.getAllSpawnCalls()).toStrictEqual([
      [
        '/fake/bin/claude',
        ['-p', 'hi'],
        {
          stdio: ['inherit', 'pipe', 'pipe'],
          cwd: '/repo',
          env: { A: '1' },
          signal: controller.signal,
        },
      ],
    ]);
  });

  it('EMPTY: {cwd, env, abortSignal omitted} => spawn options carry none of them', () => {
    const proxy = spawnStreamJsonProxy();
    proxy.setupSuccess({ cliPath: '/fake/bin/claude' });

    spawnStreamJson({ args: ['-p', 'hi'] });

    expect(proxy.getSpawnedOptions({ cliPath: '/fake/bin/claude' })).toStrictEqual({
      stdio: ['inherit', 'pipe', 'pipe'],
    });
  });

  it('VALID: {stdinMode: "ignore"} => passes ignore as stdin', () => {
    const proxy = spawnStreamJsonProxy();
    proxy.setupSuccess({ cliPath: '/fake/bin/claude' });

    spawnStreamJson({ args: ['-p', 'hi'], stdinMode: 'ignore' });

    expect(proxy.getSpawnedOptions({ cliPath: '/fake/bin/claude' })).toStrictEqual({
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  });

  it('VALID: {stderrMode: "inherit"} => passes inherit as stderr', () => {
    const proxy = spawnStreamJsonProxy();
    proxy.setupSuccess({ cliPath: '/fake/bin/claude' });

    spawnStreamJson({ args: ['-p', 'hi'], stderrMode: 'inherit' });

    expect(proxy.getSpawnedOptions({ cliPath: '/fake/bin/claude' })).toStrictEqual({
      stdio: ['inherit', 'pipe', 'inherit'],
    });
  });

  it('VALID: {CLI exits non-zero with stderr output} => the process exit and stderr text both reach the caller', async () => {
    const proxy = spawnStreamJsonProxy();
    const child = proxy.setupSuccess({ cliPath: '/fake/bin/claude' });

    const result = spawnStreamJson({ args: ['-p', 'hi'] });

    const stderrChunks: string[] = [];
    result.process.stderr?.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk.toString());
    });
    let exitCode: number | null = null;
    result.process.on('exit', (code: number | null) => {
      exitCode = code;
    });

    child.stderr?.push(Buffer.from('fatal: something broke'));
    child.stderr?.push(null);
    child.emit('exit', 1, null);

    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(stderrChunks).toStrictEqual(['fatal: something broke']);
    expect(exitCode).toBe(1);
  });

  it('EMPTY: {CLI prints nothing on stdout} => stdout ends with no data delivered', async () => {
    const proxy = spawnStreamJsonProxy();
    const child = proxy.setupSuccess({ cliPath: '/fake/bin/claude' });

    const result = spawnStreamJson({ args: ['-p', 'hi'] });

    const received: string[] = [];
    let ended = false;
    result.stdout.on('data', (chunk: Buffer) => {
      received.push(chunk.toString());
    });
    result.stdout.on('end', () => {
      ended = true;
    });

    child.stdout?.push(null);

    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(received).toStrictEqual([]);
    expect(ended).toBe(true);
  });

  it('EDGE: {stdinMode: "ignore"} => the process exposes no writable stdin, so a caller can never hit EPIPE writing to it', () => {
    const proxy = spawnStreamJsonProxy();
    const child = proxy.setupSuccess({ cliPath: '/fake/bin/claude' });
    child.stdin = null;

    const result = spawnStreamJson({ args: ['-p', 'hi'], stdinMode: 'ignore' });

    expect(result.process.stdin).toBe(null);
  });

  it('ERROR: {claude not found anywhere} => throws ClaudeNotInstalledError before spawning', () => {
    const proxy = spawnStreamJsonProxy();
    proxy.setupCliNotInstalled();

    expect(() => spawnStreamJson({ args: ['-p', 'hi'] })).toThrow(
      new ClaudeNotInstalledError(
        'Claude CLI not found: no CLAUDE_CLI_PATH override, no installed @anthropic-ai/claude-code package, and no claude binary on PATH',
      ),
    );
  });

  it('VALID: {no setup call} => the default CLI path spawns a fresh child per spawn', () => {
    const proxy = spawnStreamJsonProxy();

    const first = spawnStreamJson({ args: ['-p', 'one'] });
    const second = spawnStreamJson({ args: ['-p', 'two'] });

    expect(new Set([first.process, second.process]).size).toBe(2);
    expect(first.stdout).toBe(first.process.stdout);
    expect(proxy.isSpawnedStdout(second.stdout)).toBe(true);
  });

  it('VALID: {setupSpawn then a default spawn} => the one-shot child comes first, then a fresh default child', () => {
    const proxy = spawnStreamJsonProxy();
    const { mockProcess } = proxy.setupSpawn();

    const first = spawnStreamJson({ args: ['-p', 'one'] });
    const second = spawnStreamJson({ args: ['-p', 'two'] });

    expect([first.process === mockProcess, second.process === mockProcess]).toStrictEqual([
      true,
      false,
    ]);
  });

  it('VALID: {recorded kill} => kill is a call-recording function returning true', () => {
    const proxy = spawnStreamJsonProxy();
    const { mockProcess } = proxy.setupSpawn();

    const killed = spawnStreamJson({ args: ['-p', 'hi'] }).process.kill('SIGTERM');

    expect(killed).toBe(true);
    expect(mockProcess.kill.mock.calls).toStrictEqual([['SIGTERM']]);
  });

  it('VALID: {setupExitOnKill} => kill makes the child emit exit with the staged code', async () => {
    const proxy = spawnStreamJsonProxy();
    proxy.setupExitOnKill({ exitCode: 143 });
    const { process: child } = spawnStreamJson({ args: ['-p', 'hi'] });
    const exits: (number | null)[] = [];
    child.on('exit', (code: number | null) => {
      exits.push(code);
    });

    child.kill();
    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(exits).toStrictEqual([143]);
  });

  it('VALID: {setupExitCode} => the child emits exit with the staged code without a kill', async () => {
    const proxy = spawnStreamJsonProxy();
    proxy.setupExitCode({ exitCode: 3 });
    const { process: child } = spawnStreamJson({ args: ['-p', 'hi'] });
    const exits: (number | null)[] = [];
    child.on('exit', (code: number | null) => {
      exits.push(code);
    });

    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(exits).toStrictEqual([3]);
  });

  it('ERROR: {setupError} => the child emits the staged error', async () => {
    const proxy = spawnStreamJsonProxy();
    proxy.setupError({ error: new Error('child broke') });
    const { process: child } = spawnStreamJson({ args: ['-p', 'hi'] });
    const errors: Error[] = [];
    child.on('error', (error: Error) => {
      errors.push(error);
    });

    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(errors).toStrictEqual([new Error('child broke')]);
  });

  it('VALID: {setupSpawnLazy then setupExitCode} => the lazily built child honours exit config set after staging', async () => {
    const proxy = spawnStreamJsonProxy();
    proxy.setupSpawnLazy();
    proxy.setupExitCode({ exitCode: 9 });
    const { process: child } = spawnStreamJson({ args: ['-p', 'hi'] });
    const exits: (number | null)[] = [];
    child.on('exit', (code: number | null) => {
      exits.push(code);
    });

    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(exits).toStrictEqual([9]);
  });

  it('ERROR: {setupSpawnThrow} => every spawn throws the staged error', () => {
    const proxy = spawnStreamJsonProxy();
    proxy.setupSpawnThrow({ error: new Error('no spawn') });

    expect(() => spawnStreamJson({ args: ['-p', 'a'] })).toThrow(new Error('no spawn'));
    expect(() => spawnStreamJson({ args: ['-p', 'b'] })).toThrow(new Error('no spawn'));
  });

  it('ERROR: {setupSpawnThrowOnce} => the first spawn throws and the second gets a child', () => {
    const proxy = spawnStreamJsonProxy();
    proxy.setupSpawnThrowOnce({ error: new Error('once') });

    expect(() => spawnStreamJson({ args: ['-p', 'a'] })).toThrow(new Error('once'));

    const second = spawnStreamJson({ args: ['-p', 'b'] });

    expect(proxy.isSpawnedStdout(second.stdout)).toBe(true);
  });

  it('VALID: {setupAutoStdoutLines} => a default child replays the lines on its stdout', async () => {
    const proxy = spawnStreamJsonProxy();
    proxy.setupAutoStdoutLines({ lines: ['{"type":"a"}', '{"type":"b"}'] });
    const { stdout } = spawnStreamJson({ args: ['-p', 'hi'] });
    const received: string[] = [];
    stdout.on('data', (chunk: Buffer) => {
      received.push(chunk.toString());
    });

    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(received).toStrictEqual(['{"type":"a"}\n{"type":"b"}\n']);
  });

  it('VALID: {emitStdoutLines} => the lines reach every spawned child stdout', async () => {
    const proxy = spawnStreamJsonProxy();
    const first = spawnStreamJson({ args: ['-p', 'one'] });
    const second = spawnStreamJson({ args: ['-p', 'two'] });
    const received: string[] = [];
    first.stdout.on('data', (chunk: Buffer) => {
      received.push(`first:${chunk.toString()}`);
    });
    second.stdout.on('data', (chunk: Buffer) => {
      received.push(`second:${chunk.toString()}`);
    });

    proxy.emitStdoutLines({ lines: ['x'] });
    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(received).toStrictEqual(['first:x\n', 'second:x\n']);
  });

  it('VALID: {two spawns} => getAllSpawnCalls returns each full tuple in call order', () => {
    const proxy = spawnStreamJsonProxy();

    spawnStreamJson({ args: ['-p', 'one'], cwd: '/a' });
    spawnStreamJson({ args: ['-p', 'two'], stdinMode: 'ignore' });

    expect(proxy.getAllSpawnCalls()).toStrictEqual([
      ['/fake/bin/claude', ['-p', 'one'], { stdio: ['inherit', 'pipe', 'pipe'], cwd: '/a' }],
      ['/fake/bin/claude', ['-p', 'two'], { stdio: ['ignore', 'pipe', 'pipe'] }],
    ]);
  });

  it('VALID: {setupCliPath} => spawns and read-back address the staged path', () => {
    const proxy = spawnStreamJsonProxy();
    proxy.setupCliPath({ cliPath: '/other/claude' });

    spawnStreamJson({ args: ['-p', 'hi'] });

    expect(proxy.getAllSpawnCalls()).toStrictEqual([
      ['/other/claude', ['-p', 'hi'], { stdio: ['inherit', 'pipe', 'pipe'] }],
    ]);
  });
});
