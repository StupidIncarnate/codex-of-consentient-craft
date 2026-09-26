import { ClaudeNotInstalledError } from './claude-not-installed-error';
import { spawnStreamJson } from './claude-spawn-stream-json';
import { spawnStreamJsonProxy } from './claude-spawn-stream-json.proxy';

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

    expect(proxy.getSpawnedOptions({ cliPath: '/fake/bin/claude' })).toStrictEqual({
      command: '/fake/bin/claude',
      args: ['-p', 'hi'],
      stdin: 'inherit',
      stderr: 'pipe',
      cwd: '/repo',
      env: { A: '1' },
      abortSignal: controller.signal,
    });
  });

  it('EMPTY: {cwd, env, abortSignal omitted} => spawn options carry none of them', () => {
    const proxy = spawnStreamJsonProxy();
    proxy.setupSuccess({ cliPath: '/fake/bin/claude' });

    spawnStreamJson({ args: ['-p', 'hi'] });

    expect(proxy.getSpawnedOptions({ cliPath: '/fake/bin/claude' })).toStrictEqual({
      command: '/fake/bin/claude',
      args: ['-p', 'hi'],
      stdin: 'inherit',
      stderr: 'pipe',
    });
  });

  it('VALID: {stdinMode: "ignore"} => passes ignore as stdin', () => {
    const proxy = spawnStreamJsonProxy();
    proxy.setupSuccess({ cliPath: '/fake/bin/claude' });

    spawnStreamJson({ args: ['-p', 'hi'], stdinMode: 'ignore' });

    expect(proxy.getSpawnedOptions({ cliPath: '/fake/bin/claude' })).toStrictEqual({
      command: '/fake/bin/claude',
      args: ['-p', 'hi'],
      stdin: 'ignore',
      stderr: 'pipe',
    });
  });

  it('VALID: {stderrMode: "inherit"} => passes inherit as stderr', () => {
    const proxy = spawnStreamJsonProxy();
    proxy.setupSuccess({ cliPath: '/fake/bin/claude' });

    spawnStreamJson({ args: ['-p', 'hi'], stderrMode: 'inherit' });

    expect(proxy.getSpawnedOptions({ cliPath: '/fake/bin/claude' })).toStrictEqual({
      command: '/fake/bin/claude',
      args: ['-p', 'hi'],
      stdin: 'inherit',
      stderr: 'inherit',
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
    proxy.setupCliPathThrows({
      error: new ClaudeNotInstalledError(
        'Claude CLI not found: no CLAUDE_CLI_PATH override, no installed @anthropic-ai/claude-code package, and no claude binary on PATH',
      ),
    });

    expect(() => spawnStreamJson({ args: ['-p', 'hi'] })).toThrow(
      new ClaudeNotInstalledError(
        'Claude CLI not found: no CLAUDE_CLI_PATH override, no installed @anthropic-ai/claude-code package, and no claude binary on PATH',
      ),
    );
  });
});
