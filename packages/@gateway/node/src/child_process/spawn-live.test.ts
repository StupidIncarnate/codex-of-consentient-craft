import { spawnLive } from './spawn-live';
import { spawnLiveProxy } from './spawn-live.proxy';

describe('spawnLive()', () => {
  it('VALID: {command, args} => returns the live process and its stdout', () => {
    const proxy = spawnLiveProxy();
    const child = proxy.setupSuccess({ command: 'claude' });

    const result = spawnLive({ command: 'claude', args: ['-p', 'hi'] });

    expect(result).toStrictEqual({ process: child, stdout: child.stdout });
  });

  it('VALID: {stdout emits a chunk with no trailing newline} => the chunk is delivered as-is', async () => {
    const proxy = spawnLiveProxy();
    const child = proxy.setupSuccess({ command: 'claude' });

    const { stdout } = spawnLive({ command: 'claude', args: [] });

    const received: string[] = [];
    stdout.on('data', (chunk: Buffer) => {
      received.push(chunk.toString());
    });
    child.stdout?.push(Buffer.from('partial line, no newline'));
    child.stdout?.push(null);

    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(received).toStrictEqual(['partial line, no newline']);
  });

  it('VALID: {cwd, env, abortSignal} => passes them through to spawn options', () => {
    const proxy = spawnLiveProxy();
    proxy.setupSuccess({ command: 'claude' });
    const controller = new AbortController();

    spawnLive({
      command: 'claude',
      args: [],
      cwd: '/repo',
      env: { A: '1' },
      abortSignal: controller.signal,
    });

    expect(proxy.getSpawnedOptions({ command: 'claude' })).toStrictEqual({
      stdio: ['inherit', 'pipe', 'pipe'],
      cwd: '/repo',
      env: { A: '1' },
      signal: controller.signal,
    });
  });

  it('EMPTY: {cwd, env, abortSignal omitted} => spawn options carry none of them', () => {
    const proxy = spawnLiveProxy();
    proxy.setupSuccess({ command: 'claude' });

    spawnLive({ command: 'claude', args: [] });

    expect(proxy.getSpawnedOptions({ command: 'claude' })).toStrictEqual({
      stdio: ['inherit', 'pipe', 'pipe'],
    });
  });

  it('VALID: {stdin: "ignore"} => passes ignore as stdio[0]', () => {
    const proxy = spawnLiveProxy();
    proxy.setupSuccess({ command: 'claude' });

    spawnLive({ command: 'claude', args: [], stdin: 'ignore' });

    expect(proxy.getSpawnedOptions({ command: 'claude' })).toStrictEqual({
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  });

  it('VALID: {stderr: "inherit"} => passes inherit as stdio[2]', () => {
    const proxy = spawnLiveProxy();
    proxy.setupSuccess({ command: 'claude' });

    spawnLive({ command: 'claude', args: [], stderr: 'inherit' });

    expect(proxy.getSpawnedOptions({ command: 'claude' })).toStrictEqual({
      stdio: ['inherit', 'pipe', 'inherit'],
    });
  });

  it('ERROR: {stdout: null despite stdio[1] = pipe} => throws naming the command', () => {
    const proxy = spawnLiveProxy();
    proxy.setupNullStdout({ command: 'claude' });

    expect(() => spawnLive({ command: 'claude', args: [] })).toThrow(
      new Error(`spawnLive: "claude" produced no stdout despite stdio[1] = 'pipe'`),
    );
  });

  it('ERROR: {command never starts} => logs to stderr instead of crashing the process', async () => {
    const proxy = spawnLiveProxy();
    const child = proxy.setupSpawnError({
      command: 'nonexistent',
      error: Object.assign(new Error('spawn nonexistent ENOENT'), { code: 'ENOENT' }),
    });

    const result = spawnLive({ command: 'nonexistent', args: [] });

    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(
      proxy.captureStderrWrites().some((line) => line.includes('"nonexistent" failed to start')),
    ).toBe(true);
    expect(result.stdout).toBe(child.stdout);
  });
});
